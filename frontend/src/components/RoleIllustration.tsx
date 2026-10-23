import type { SessionUser } from "../types";
import { useI18n } from "../i18n";
import patient from "../assets/roles/patient.png";
import pharmacist from "../assets/roles/pharmacist.png";
import hospitalStaff from "../assets/roles/hospital-staff.png";
import admin from "../assets/roles/admin.png";

const images: Record<SessionUser["role"], { src: string; alt: string }> = {
  Patient: { src: patient, alt: "Patient finding medicine" },
  Pharmacist: { src: pharmacist, alt: "Pharmacist managing medicine stock" },
  "Hospital Staff": { src: hospitalStaff, alt: "Hospital staff managing medical supplies" },
  Admin: { src: admin, alt: "Administrator coordinating the medicine network" },
};

export function RoleIllustration({ role, className = "", decorative = false }: { role: SessionUser["role"]; className?: string; decorative?: boolean }) {
  const { t } = useI18n();
  const image = images[role];
  return <img src={image.src} alt={decorative ? "" : t(image.alt)} width={1254} height={1254}
    loading="lazy" decoding="async" className={"object-contain " + className} />;
}
