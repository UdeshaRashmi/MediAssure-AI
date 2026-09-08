import { useState } from "react";
import type { Reservation } from "../types";
import { EmptyState, Modal, Panel, StatusBadge } from "../components/ui";

export function ReservationsPage({ reservations }: { reservations: Reservation[] }) {
  const [activeDialog, setActiveDialog] = useState<{ type: "confirm" | "contact"; reservation: Reservation } | null>(null);
  const [notice, setNotice] = useState("");

  return (
    <>
      <Panel title="Medicine Reservations">
        <div className="grid gap-3">
          {notice && <div className="rounded-md border border-[#BFD9DB] bg-white p-4 text-sm font-bold text-[#0D8F93]">{notice}</div>}
          {reservations.length === 0 && <EmptyState title="No reservations" detail="Backend returned no active medicine reservations." />}
          {reservations.map((reservation) => (
            <article key={reservation.id} className="rounded-md border border-[#BFD9DB] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#0D8F93]">{reservation.id}</p>
                  <h3 className="mt-1 text-lg font-bold">{reservation.medicine}</h3>
                  <p className="mt-1 text-sm text-[#557084]">
                    {reservation.patient} - qty {reservation.qty} - ETA {reservation.eta}
                  </p>
                </div>
                <StatusBadge label={reservation.status} tone="teal" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDialog({ type: "confirm", reservation })}
                  className="rounded-md bg-[#092C46] px-4 py-2 text-sm font-bold text-white"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDialog({ type: "contact", reservation })}
                  className="rounded-md border border-[#BFD9DB] px-4 py-2 text-sm font-bold text-[#31556A]"
                >
                  Contact User
                </button>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Modal
        title={activeDialog?.type === "confirm" ? "Confirm Reservation" : "Contact User"}
        open={Boolean(activeDialog)}
        onClose={() => setActiveDialog(null)}
      >
        {activeDialog && (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setNotice(
                activeDialog.type === "confirm"
                  ? `${activeDialog.reservation.id} confirmation prepared.`
                  : `Contact note saved for ${activeDialog.reservation.patient}.`,
              );
              setActiveDialog(null);
            }}
          >
            <div className="rounded-md border border-[#BFD9DB] bg-[#F8FCFC] p-4">
              <h3 className="font-bold">{activeDialog.reservation.medicine}</h3>
              <p className="mt-1 text-sm text-[#557084]">
                {activeDialog.reservation.id} - qty {activeDialog.reservation.qty} - ETA {activeDialog.reservation.eta}
              </p>
            </div>
            {activeDialog.type === "confirm" ? (
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#557084]">Pickup instruction</span>
                <textarea className="mt-2 min-h-24 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none" defaultValue="Keep medicine at pharmacist counter until patient arrives." />
              </label>
            ) : (
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#557084]">Message</span>
                <textarea className="mt-2 min-h-24 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none" defaultValue={`Your ${activeDialog.reservation.medicine} reservation is being prepared.`} />
              </label>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setActiveDialog(null)} className="h-10 rounded-md border border-[#BFD9DB] px-4 text-sm font-bold text-[#31556A]">
                Cancel
              </button>
              <button className="h-10 rounded-md bg-[#0D8F93] px-4 text-sm font-bold text-white">
                {activeDialog.type === "confirm" ? "Save confirmation" : "Save message"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
