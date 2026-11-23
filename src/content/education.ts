import { pending, type Pending } from "./types";

export type Degree = {
  title: string;
  institution: string;
  place: string;
  years: string;
  note?: string;
  credentialUrl?: string;
  pendingNotes?: Pending[];
};

export const degrees: Degree[] = [
  {
    title: "Master of Data Science",
    institution: "Macquarie University",
    place: "Sydney",
    years: "2023–2025",
    note: "Major project: clinical NLP · Distinction (82)",
    pendingNotes: [pending("Degree certificate link (credentialUrl)")],
  },
  {
    // TODO(nadun): is it "(Honours)"? Earlier notes say BEng (Hons.).
    title: "Bachelor of Engineering (Mechanical)",
    institution: "Curtin University",
    place: "delivered at SLIIT, Sri Lanka",
    years: "2014–2020",
    pendingNotes: [
      pending('Confirm whether the title includes "(Honours)"'),
      pending("Degree certificate link (credentialUrl)"),
    ],
  },
];
