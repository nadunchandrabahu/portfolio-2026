import { pending, type Pending } from "./types";

export const SECTION_IDS = [
  "hero",
  "work",
  "about",
  "hands-on",
  "skills",
  "experience",
  "education",
  "contact",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

type Section = {
  id: SectionId;
  number: string;
  label: string;
  title: string;
  /** Short label when the section appears in the nav. */
  nav?: string;
};

export const sections: readonly Section[] = [
  { id: "hero", number: "01", label: "Hero", title: "Nadun Chandrabahu" },
  { id: "work", number: "02", label: "Selected work", title: "Selected work", nav: "Work" },
  { id: "about", number: "03", label: "About", title: "About", nav: "About" },
  { id: "hands-on", number: "04", label: "Off the keyboard", title: "Off the keyboard" },
  { id: "skills", number: "05", label: "Toolbox", title: "Toolbox" },
  {
    id: "experience",
    number: "06",
    label: "Experience",
    title: "Experience",
    nav: "Experience",
  },
  { id: "education", number: "07", label: "Education", title: "Education", nav: "Education" },
  { id: "contact", number: "08", label: "Contact", title: "Get in touch", nav: "Contact" },
];

export const getSection = (id: SectionId): Section => {
  const section = sections.find((s) => s.id === id);
  if (!section) throw new Error(`Unknown section: ${id}`);
  return section;
};

export const site = {
  name: "Nadun Chandrabahu",
  monogram: "NC",

  // TODO(nadun): Content.md says "Data Scientist"; confirm the wording.
  role: "Data scientist and AI engineer",
  eyebrow: "Sydney, AU — Data science · AI engineering",
  heroLine:
    "I build and evaluate machine learning systems, from statistical models on large datasets to LLM fine-tuning and agentic AI evaluation.",
  // TODO(nadun): draft sub-line. Approve or cut.
  heroSubLine:
    "Trained as a mechanical engineer. I still like knowing how things work, down to the last bolt.",
  availability: "Currently in Sydney, open to data and AI roles.",

  location: "Sydney, Australia",
  links: {
    github: "https://github.com/nadunchandrabahu",
    linkedin: "https://www.linkedin.com/in/nadunchandrabahu",
  },
  /** Assembled client-side to keep the full address out of the HTML. */
  email: { user: "nadun.c.97", domain: "gmail.com" },

  resume: {
    // Copied from Resume-NadunChandrabahu.pdf in the project root; replace this
    // file when the resume changes. It includes the phone number (Nadun's choice).
    href: "/resume/Nadun-Chandrabahu-Resume.pdf",
    fileName: "Nadun-Chandrabahu-Resume.pdf",
    available: true,
  },

  contact: {
    // TODO(nadun): confirm the reply-time line.
    line: "The fastest way to reach me is email. I reply within a couple of days.",
  },

  verse: {
    // New International Version (NIV), Nadun's choice. The verse runs on into 2:9
    // with a dash; quoted on its own, it ends at "gift of God".
    // Biblica allows short NIV quotations on the web with the "NIV" label.
    text: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God.",
    reference: "Ephesians 2:8 · NIV",
  },

  footer: {
    copyright: "© 2026 Nadun Chandrabahu",
    credit: "Built in Sydney with Next.js and three.js",
  },

  /**
   * Shows the "Digital twin" buttons. The server side has its own kill
   * switch (CHAT_ENABLED): with it off, the panel answers with a polite
   * "offline, email Nadun" reply.
   */
  features: { chat: true },
};

export const resumePending: Pending | null = site.resume.available
  ? null
  : pending("Resume PDF at /public/resume/Nadun-Chandrabahu-Resume.pdf");
