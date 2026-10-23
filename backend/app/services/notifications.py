"""Transactional outbox: HTTP handlers enqueue; the worker delivers after commit."""
from datetime import UTC, datetime, timedelta
from email.message import EmailMessage as MimeMessage
from email.policy import SMTP
from pathlib import Path
import logging
import smtplib
import ssl
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from app.core.config import get_settings
from app.models.email_message import EmailMessage
from app.models.inventory import Inventory
from app.models.reservation import Reservation
from app.models.user import User

logger = logging.getLogger(__name__)


def queue_email(db, user_id: int | None, event_key: str, subject: str, body: str):
    if not user_id:
        return False
    result = db.scalar(insert(EmailMessage).values(user_id=user_id, event_key=event_key,
        subject=subject, body=body, status="pending", attempts=0)
        .on_conflict_do_nothing(index_elements=["event_key"]).returning(EmailMessage.id))
    return result is not None


def reservation_email(db, reservation):
    status = reservation.status.value
    medicine = " ".join(filter(None, [reservation.medicine.name, reservation.medicine.strength]))
    body = (f"Reservation #{reservation.id}: {status}\nMedicine: {medicine}\n"
            f"Quantity: {reservation.quantity}\nLocation: {reservation.pharmacy.name}\n"
            f"Address: {reservation.pharmacy.address}\n"
            f"Hold expires: {reservation.expires_at.isoformat()}\n"
            "Contact the supplying institution to confirm pickup arrangements.")
    for user_id in {reservation.user_id, reservation.pharmacy.owner_user_id} - {None}:
        queue_email(db, user_id, f"reservation:{reservation.id}:{status}:{user_id}",
                    f"MediAssure: reservation #{reservation.id} {status}", body)


def queue_low_stock(db, user=None):
    from app.services.records import inventory_query
    today = datetime.now(UTC).date().isoformat()
    for item in db.scalars(inventory_query(user)):
        available = item.current_stock - item.reserved_stock
        if available <= item.reorder_level:
            queue_email(db, item.pharmacy.owner_user_id, f"low-stock:{item.id}:{today}",
                f"MediAssure: low stock - {item.medicine.name}",
                f"{item.pharmacy.name}\nMedicine: {item.medicine.name} {item.medicine.strength or ''}\n"
                f"Available: {available}\nReserved: {item.reserved_stock}\n"
                f"Reorder level: {item.reorder_level}\nPlease review your stock and rebalancing suggestions.")


def current_notification(db, row):
    # Do not send superseded reservation states or a backlog of daily stock alerts.
    if row.event_key.startswith("reservation:"):
        _, reservation_id, status, _ = row.event_key.split(":")
        reservation = db.get(Reservation, int(reservation_id))
        return reservation is not None and reservation.status.value == status
    if not row.event_key.startswith("low-stock:"):
        return True
    if row.event_key.split(":")[2] != datetime.now(UTC).date().isoformat():
        return False
    inventory_id = int(row.event_key.split(":")[1])
    item = db.get(Inventory, inventory_id)
    if item is None or item.current_stock - item.reserved_stock > item.reorder_level:
        return False
    available = item.current_stock - item.reserved_stock
    row.body = (f"{item.pharmacy.name}\nMedicine: {item.medicine.name} {item.medicine.strength or ''}\n"
                f"Available: {available}\nReserved: {item.reserved_stock}\nReorder level: {item.reorder_level}")
    return True


def deliver_pending(db, settings=None, limit=25, *, user_id=None):
    settings = settings or get_settings()
    if settings.email_transport == "disabled":
        return 0
    count = 0
    # SKIP LOCKED lets multiple workers claim separate rows.
    for _ in range(limit):
        query = select(EmailMessage).where(EmailMessage.status == "pending",
            EmailMessage.next_attempt_at <= datetime.now(UTC))
        if user_id is not None:
            query = query.where(EmailMessage.user_id == user_id)
        row = db.scalar(query.order_by(EmailMessage.id).with_for_update(skip_locked=True).limit(1))
        if row is None:
            break
        recipient = db.get(User, row.user_id)
        if recipient is None or not current_notification(db, row):
            row.status = "skipped"
            db.commit()
            continue
        row.attempts += 1
        try:
            message = MimeMessage()
            message["From"] = settings.smtp_from or "mediassure@localhost"
            message["To"] = recipient.email
            message["Subject"] = row.subject
            message["Message-ID"] = f"<mediassure-{row.id}@notifications.local>"
            message.set_content(row.body)
            if settings.email_transport == "file":
                directory = Path(settings.email_preview_dir)
                directory.mkdir(parents=True, exist_ok=True)
                (directory / f"{row.id}.eml").write_bytes(message.as_bytes(policy=SMTP))
                row.status = "preview"
            else:
                if not settings.smtp_host or not settings.smtp_from:
                    raise ValueError("SMTP host and sender must be configured")
                connection = smtplib.SMTP_SSL if settings.smtp_security == "ssl" else smtplib.SMTP
                kwargs = {"context": ssl.create_default_context()} if settings.smtp_security == "ssl" else {}
                with connection(settings.smtp_host, settings.smtp_port, timeout=15, **kwargs) as smtp:
                    if settings.smtp_security == "starttls":
                        smtp.starttls(context=ssl.create_default_context())
                    if settings.smtp_username:
                        smtp.login(settings.smtp_username, settings.smtp_password.get_secret_value())
                    smtp.send_message(message)
                row.status = "sent"
                row.sent_at = datetime.now(UTC)
            row.last_error = None
            count += 1
        except (OSError, smtplib.SMTPException, ValueError) as error:
            # Never persist credentials/provider text in errors returned to users.
            row.last_error = "Email delivery failed; check server email configuration"
            row.next_attempt_at = datetime.now(UTC) + timedelta(minutes=min(60, 2 ** row.attempts))
            if row.attempts >= 5:
                row.status = "failed"
            logger.warning("Email delivery failed for message %s (%s)", row.id, type(error).__name__)
        db.commit()
    return count
