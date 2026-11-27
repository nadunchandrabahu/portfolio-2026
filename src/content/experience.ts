import type { Pending, Photo } from "./types";

/** Dates are ISO "yyyy-mm"; `end: "present"` for a current role. */
export type ExperienceEntry = {
  role: string;
  employer: string;
  start: string;
  end: string | "present";
  line: string;
  /** Small thumbnail beside the entry (sm and up). */
  image?: Photo;
};

/** Newest first. */
export const experience: (ExperienceEntry | Pending)[] = [
  {
    role: "E-bike Mechanic",
    employer: "Lime",
    start: "2026-11",
    end: "present",
    line: "Servicing and repairing Lime's shared e-bikes.",
  },
  {
    role: "AI Engineer (Contract)",
    employer: "Hatch",
    start: "2026-04",
    end: "2026-07",
    line: "Evaluated agentic AI for e-commerce, tracing agent reasoning and catching reward hacking, and ran prompt engineering to make agents more reliable.",
    image: { src: "/images/experience/hatch.jpg", alt: "" },
  },
  {
    role: "Data Quality Analyst (Freelance)",
    employer: "DataAnnotation",
    start: "2024-06",
    end: "2026-04",
    line: "AI training-data work across audio and mathematics, building material to improve model quality.",
    image: { src: "/images/experience/dataannotation.jpg", alt: "" },
  },
  {
    role: "Hardware & Systems Consultant",
    employer: "Azzureo",
    start: "2023-03",
    end: "2024-04",
    line: "Maintained server infrastructure and relocated the company's entire server network between two Sydney sites.",
    image: { src: "/images/experience/azzureo.jpg", alt: "" },
  },
  {
    role: "Operations & Administration",
    employer: "Island Aquarium",
    start: "2021-05",
    end: "2022-06",
    line: "Ran live-export logistics to 7 countries and supervised a packing team, and built the company website and an Excel invoicing tool.",
    image: {
      src: "/images/experience/island-aquarium.webp",
      alt: "The Island Aquarium website home page: live tropical fish supplier",
    },
  },
  {
    role: "Management Trainee",
    employer: "KIA Motors Lanka",
    start: "2020-06",
    end: "2021-02",
    line: "Coordinated workshop operations and built a live vehicle-tracking tool in Google Apps Script.",
    image: {
      src: "/images/experience/kia-tracker.webp",
      alt: "The KIA SA progress tracker: a Google Sheets tool with front office and workshop checklists",
    },
  },
  {
    role: "Assistant Automobile Technician (Internship)",
    employer: "DIMO Lanka",
    start: "2016-11",
    end: "2017-01",
    // TODO(nadun): confirm the line.
    line: "About 360 hours of hands-on vehicle servicing.",
  },
];
