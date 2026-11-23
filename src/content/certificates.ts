export type Certificate = {
  id: string;
  title: string;
  issuer: string;
  /** ISO yyyy-mm */
  date: string;
  hours?: number;
  skills: string[];
  credentialUrl?: string;
  image?: string;
  status: "published" | "placeholder";
};

const slot = (n: number): Certificate => ({
  id: `slot-${String(n).padStart(2, "0")}`,
  title: `Certificate slot ${String(n).padStart(2, "0")}`,
  issuer: "",
  date: "",
  skills: [],
  status: "placeholder",
});

// TODO(nadun): titles, issuers, dates, links and images for all 8 (CLAUDE.md 5.7).
export const certificates: Certificate[] = [
  {
    id: "dlai-data-analytics-foundations",
    title: "Data Analytics Foundations",
    issuer: "DeepLearning.AI",
    date: "2026-09",
    // TODO(nadun): confirm, and add the credential URL and 2–3 skill chips.
    // Course 1 of the Data Analytics Professional Certificate.
    skills: [],
    status: "published",
  },
  slot(2),
  slot(3),
  slot(4),
  slot(5),
  slot(6),
  slot(7),
  slot(8),
];

export const certificatesIntro = {
  eyebrow: "Online credentials",
  title: "Certifications",
};
