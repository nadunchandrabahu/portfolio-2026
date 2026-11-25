import { pending, type ExternalLink, type Pending, type Photo } from "./types";

export const PROJECT_IDS = [
  "field-shift",
  "clinical-nlp",
  "language-id",
  "mortgage-defaults",
  "pickl-hq",
  "grow365",
  "mil-survey",
] as const;
export type ProjectId = (typeof PROJECT_IDS)[number];

export type Project = {
  id: ProjectId;
  /** Ring-segment number on the gearbox, 00–06. */
  index: string;
  variant: "featured" | "standard" | "secondary";
  eyebrow: string;
  title: string;
  description: (string | Pending)[];
  team?: string;
  tech: string[];
  /** Inspection-tag readout. Secondary cards have none. */
  result?: string;
  links: (ExternalLink | Pending)[];
  /** Shown when there are no public links. */
  noLinksNote?: string;
  image?: Photo;
};

export const projects: Project[] = [
  {
    id: "field-shift",
    index: "00",
    variant: "featured",
    eyebrow: "NASA Space Apps / Earth observation",
    title: "Field Shift: Adapting Farms with NASA Data",
    description: [
      "Built in two days with three teammates at NASA's International Space Apps Challenge on the Gold Coast. Field Shift helps farmers explore crop rotations and choose when to sow, using 30 years of NASA Earth observation data: MODIS land surface temperature from the Terra and Aqua satellites, ECOSTRESS, and NASA POWER climate records.",
      "We fitted harmonic regression models to land surface temperature and rainfall, and got the tool working for wheat, barley and corn across Perth, Brisbane and Melbourne. The same data covers almost anywhere on Earth, so soil moisture, soil nutrients, erosion and extreme weather are next.",
      pending(
        'One sentence on the part you owned, e.g. "I built the land surface temperature model…"',
      ),
    ],
    // TODO(nadun): confirm the spelling, Nicholls or Nichols.
    team: "Team: Patrick Bujok (mentor), Jean-Luc Gravelle, Cole Nicholls",
    // TODO(nadun): confirm the front-end stack.
    tech: ["Python", "harmonic regression", "MODIS (Terra/Aqua)", "ECOSTRESS", "NASA POWER", "Netlify"],
    result: "30 yrs of NASA data → sowing windows · 3 crops × 3 cities",
    image: {
      src: "/images/projects/field-shift.jpg",
      alt: "Group photo of participants at NASA's International Space Apps Challenge",
      position: "50% 40%",
    },
    links: [
      // TODO(nadun): confirm the prototype URL; one earlier note had nasafieldship.netlify.app.
      { label: "Live prototype", href: "https://nasafieldshift.netlify.app" },
      { label: "GitHub", href: "https://github.com/nadunchandrabahu/field-shift-nasa" },
    ],
  },
  {
    id: "clinical-nlp",
    index: "01",
    variant: "standard",
    eyebrow: "Research / NLP",
    title: "Empowering Medical Data Analytics with AI",
    description: [
      "A team research project, and my master's major project (graded 82, Distinction), on getting language models to disambiguate clinical abbreviations. I owned Task 1: framing it, collecting and cleaning the CASI dataset of around 26,500 clinical notes, and building the BERT and BioBERT baseline the rest of the team measured against. The final comparison showed GPT-4.1 nano clearly outperformed the encoder baselines, with a fuzzy-match step to credit answers that were right but worded differently.",
    ],
    tech: ["Python", "Hugging Face Transformers", "BERT", "BioBERT", "GPT-4.1", "Google Colab"],
    result: "baseline established → GPT-4.1 nano ~48.7% accuracy",
    image: { src: "/images/projects/clinical-nlp.jpg", alt: "", position: "50% 45%" },
    links: [pending("GitHub URL for the clinical NLP project")],
  },
  {
    id: "language-id",
    index: "02",
    variant: "standard",
    eyebrow: "Machine learning / Speech",
    title: "Language ID for Endangered Languages (Hack 2025)",
    description: [
      "Built at a hackathon for Global Recordings Network, who catalogue audio in thousands of rare and endangered languages. I handled the model side: fine-tuning Meta's Massively Multilingual Speech model, which covers over 4,000 languages. Full fine-tuning needed roughly 370GB of RAM and 7 hours per epoch, which we didn't have, so I trained a light classifier head on embeddings from the frozen encoder instead. It lifted confidence on correct languages from 0.89 to 0.991, with signs it helped languages outside the training set too.",
    ],
    tech: ["PyTorch", "Meta MMS", "Google Colab TPU", "embeddings", "transfer learning"],
    result: "confidence 0.89 → 0.991",
    image: {
      src: "/images/projects/language-id.jpg",
      alt: "Hack 2025 participants in Sydney, with Global Recordings Network on the screen behind them",
      position: "50% 35%",
    },
    links: [pending("GitHub URL for the language ID project")],
  },
  {
    id: "mortgage-defaults",
    index: "03",
    variant: "standard",
    eyebrow: "Statistics / Modelling",
    title: "Predicting Mortgage Defaults",
    description: [
      "A full modelling project in R on Fannie Mae's loan data: over 420,000 loans and 75 raw fields. I engineered a binary default target from the delinquency and status fields, then cut the 75 fields to a 13-predictor logistic regression using backward stepwise selection on AIC, handling multicollinearity along the way. The whole analysis is a reproducible Quarto report, written up in plain terms for homebuyers, lenders, and investors.",
    ],
    tech: ["R", "tidyverse", "ggplot2", "Quarto", "logistic regression"],
    result: "75 fields → 13-predictor model, 420,000+ loans",
    image: { src: "/images/projects/mortgage-defaults.jpg", alt: "" },
    links: [pending("GitHub URL for the mortgage defaults project")],
  },
  {
    id: "pickl-hq",
    index: "04",
    variant: "standard",
    eyebrow: "Full-stack / E-commerce",
    title: "PICKL HQ",
    description: [
      "A pickleball-gear storefront I designed and built end to end. It's a headless setup: a React front end wired to Shopify's Storefront API and hosted on Cloudflare, with the branding, product system, and architecture all mine. Live in pre-launch while I finish the product imagery and content.",
    ],
    tech: ["React", "Shopify Storefront API", "Cloudflare"],
    result: "live in pre-launch · ~200 visitors/week",
    image: {
      src: "/images/projects/pickl-hq.jpg",
      alt: "The PICKL HQ home page: \"Gear worth playing for.\" with a Shop the range button",
      position: "0% 50%",
    },
    links: [{ label: "Live site", href: "https://picklhq.com" }],
  },
  {
    id: "grow365",
    index: "05",
    variant: "standard",
    eyebrow: "Mobile / Full-stack",
    title: "Grow365",
    description: [
      "A complete devotional mobile app I built as sole developer for a ministry, in React Native (Expo) with a Supabase backend. I handled all the engineering and the full build pipeline through to a tested Android build; the content comes from the ministry. In testing ahead of an app-store release.",
    ],
    tech: ["React Native", "Expo", "Supabase", "EAS"],
    result: "complete build · in testing",
    image: { src: "/images/projects/grow365.jpg", alt: "", position: "30% 50%" },
    links: [],
    noLinksNote: "Private build, no public link yet",
  },
  {
    id: "mil-survey",
    index: "06",
    variant: "secondary",
    eyebrow: "Research / Writing",
    title: "Multi-Instance Learning: A Survey",
    description: [
      "An academic survey on Multi-Instance Learning, a weakly-supervised approach where models learn from group-level labels instead of labelled individual points. It maps the main families of methods and reviews published object-detection work including WSDDN and MIL-SERBoost.",
    ],
    tech: ["research", "technical writing"],
    image: { src: "/images/projects/mil-survey.jpg", alt: "" },
    links: [pending("GitHub URL for the MIL survey")],
  },
];

export const workIntro = "Projects with real data, real constraints and a measured result.";
