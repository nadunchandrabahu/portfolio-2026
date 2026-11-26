import type { Pending } from "./types";

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
    credentialUrl:
      "https://www.myequals.net/sharelink/ec3208d5-d66c-44c8-8369-72ec80447faa/6381a0be-16bf-455a-92d1-9fe69257dd7a",
  },
  {
    title: "Bachelor of Engineering (Mechanical) (Hons.)",
    institution: "Curtin University",
    place: "delivered at SLIIT, Sri Lanka",
    years: "2014–2020",
    credentialUrl:
      "https://www.myequals.net/sharelink/b4827fa7-91e9-488a-9d76-7fa767694fc0/4bd89176-0144-40ed-a04e-26d932f4ec1a",
  },
];
