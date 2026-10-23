"""Run with python -m app.notification_worker [--once]."""
import argparse
import logging
import time
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.services.notifications import deliver_pending, queue_low_stock
from app.services.records import expire_reservations


def run_once():
    with SessionLocal() as db:
        expire_reservations(db)
        queue_low_stock(db)
        db.commit()
        return deliver_pending(db)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    logging.info("Email worker transport: %s", get_settings().email_transport)
    while True:
        try:
            run_once()
        except Exception:
            logging.exception("Notification scan failed")
            if args.once:
                raise
        if args.once:
            return
        time.sleep(30)


if __name__ == "__main__":
    main()
