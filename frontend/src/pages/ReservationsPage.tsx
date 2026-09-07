import { reservations } from "../data/mockData";
import { Panel, StatusBadge } from "../components/ui";

export function ReservationsPage() {
  return (
    <Panel title="Medicine Reservations">
      <div className="grid gap-3">
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
              <button className="rounded-md bg-[#092C46] px-4 py-2 text-sm font-bold text-white">Confirm</button>
              <button className="rounded-md border border-[#BFD9DB] px-4 py-2 text-sm font-bold text-[#31556A]">
                Contact User
              </button>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}
