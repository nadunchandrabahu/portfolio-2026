import type { Pending } from "./types";

export type Degree = {
  title: string;
  institution: string;
  place: string;
  years: string;
  note?: string;
  credentialUrl?: string;
  /**
   * The major project's write-up, a PDF in /public/research that the "View
   * research" button downloads. Pending: a dashed stand-in button in
   * development, hidden in production.
   */
  research?: { href: string; fileName: string } | Pending;
  pendingNotes?: Pending[];
};

export const degrees: Degree[] = [
  {
    title: "Master of Data Science",
    institution: "Macquarie University",
    place: "Sydney",
    years: "2023–2025",
    note: "Major project: Empowering Medical Data Analytics with AI · Distinction (82)",
    credentialUrl:
      "https://www.myequals.net/sharelink/ec3208d5-d66c-44c8-8369-72ec80447faa/6381a0be-16bf-455a-92d1-9fe69257dd7a",
    // Copied from postgrad-research.pdf in the project root.
    research: {
      href: "/research/Empowering-Medical-Data-Analytics-with-AI.pdf",
      fileName: "Chandrabahu-Empowering-Medical-Data-Analytics-with-AI.pdf",
    },
  },
  {
    title: "Bachelor of Engineering (Mechanical) (Hons.)",
    institution: "Curtin University",
    place: "delivered at SLIIT, Sri Lanka",
    years: "2014–2020",
    note: "Major project: Measurement of Thermal and Optical Properties of Metal Oxide Nanoparticles",
    credentialUrl:
      "https://www.myequals.net/sharelink/b4827fa7-91e9-488a-9d76-7fa767694fc0/4bd89176-0144-40ed-a04e-26d932f4ec1a",
    // From undergrad-research.pdf in the project root, without page 3 (the
    // cover letter, which has a home address and student ID).
    research: {
      href: "/research/Metal-Oxide-Nanoparticles-Thesis.pdf",
      fileName: "Chandrabahu-Metal-Oxide-Nanoparticles-Thesis.pdf",
    },
  },
];
