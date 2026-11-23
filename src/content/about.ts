export type GearPartId = "engineering" | "data" | "ai" | "build" | "sun";

export const about = {
  paragraphs: [
    "I'm a data scientist in Sydney with a Master of Data Science from Macquarie University. My work runs from classical statistical modelling on large datasets to the newer end of machine learning: fine-tuning language models, evaluating autonomous AI agents, and building tools that actually get used.",
    "I came to data science from mechanical engineering, which is where the comfort with maths and the habit of measuring things carefully come from. I like problems where the data is messy and the answer matters, and I tend to build something to solve them rather than leave them on a slide.",
    // TODO(nadun): draft faith paragraph. Approve, edit or cut.
    "Faith sits at the centre of how I live and work. I count what I've been able to build as grace, not something I earned.",
  ],
  partsTitle: "How the parts fit",
  parts: [
    {
      code: "P-01",
      part: "engineering",
      name: "Mechanical engineering",
      line: "Where the maths and the habit of measuring carefully come from.",
    },
    {
      code: "P-02",
      part: "data",
      name: "Statistics and data science",
      line: "Modelling large, messy datasets properly.",
    },
    {
      code: "P-03",
      part: "ai",
      name: "Machine learning and AI",
      line: "Fine-tuning, evaluating and stress-testing models and agents.",
    },
    {
      code: "P-04",
      part: "build",
      name: "Building",
      line: "Shipping real tools: web, mobile, automation.",
    },
    {
      code: "S-00",
      part: "sun",
      name: "Centre",
      line: "Ephesians 2:8. What everything turns around.",
    },
  ] satisfies { code: string; part: GearPartId; name: string; line: string }[],
};
