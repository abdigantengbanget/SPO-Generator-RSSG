export type InstitutionKey =
  | "rs_semen_gresik"
  | "pt_cipta_nirmala"
  | "pt_cipta_nirmala_husada";

export interface InstitutionBranding {
  id: InstitutionKey;
  label: string;
  fullName: string;
  logoPath: string;
  alt: string;
  isPlaceholderLogo: boolean;
}

export const INSTITUTION_OPTIONS: InstitutionBranding[] = [
  {
    id: "rs_semen_gresik",
    label: "RS Semen Gresik",
    fullName: "RUMAH SAKIT SEMEN GRESIK",
    logoPath: "/assets/aistudio/rs-semen-gresik_d7d14617.png",
    alt: "Logo Rumah Sakit Semen Gresik",
    isPlaceholderLogo: false,
  },
  {
    id: "pt_cipta_nirmala",
    label: "PT Cipta Nirmala",
    fullName: "PT CIPTA NIRMALA",
    logoPath: "/assets/aistudio/cipta nirmala.png",
    alt: "Logo PT Cipta Nirmala",
    isPlaceholderLogo: false,
  },
  {
    id: "pt_cipta_nirmala_husada",
    label: "PT Cipta Nirmala Husada",
    fullName: "PT CIPTA NIRMALA HUSADA",
    logoPath: "/assets/aistudio/cipta nirmala husada.jpg",
    alt: "Logo PT Cipta Nirmala Husada",
    isPlaceholderLogo: false,
  },
];

export function resolveInstitutionKey(institusi?: string): InstitutionKey {
  const lower = String(institusi || "")
    .trim()
    .toLowerCase();
  if (lower.includes("cipta nirmala husada") || lower === "cnh") {
    return "pt_cipta_nirmala_husada";
  }
  if (lower.includes("cipta nirmala") && !lower.includes("semen gresik")) {
    return "pt_cipta_nirmala";
  }
  return "rs_semen_gresik";
}

export function getInstitutionBranding(
  institusi?: string,
): InstitutionBranding {
  const key = resolveInstitutionKey(institusi);
  return (
    INSTITUTION_OPTIONS.find((item) => item.id === key) ||
    INSTITUTION_OPTIONS[0]
  );
}
