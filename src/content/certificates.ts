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

/**
 * A published certificate, as Nadun listed it (CLAUDE.md 5.7). Skill chips
 * come from each course's own listing: the credential page, the Coursera
 * course page, or the course description.
 */
const cert = (
  id: string,
  title: string,
  issuer: string,
  date: string,
  credentialUrl: string,
  skills: string[],
): Certificate => ({
  id,
  title,
  issuer,
  date,
  skills,
  credentialUrl,
  status: "published",
});

export const certificates: Certificate[] = [
  cert(
    "siemens-project-management",
    "Siemens Mobility - Project Management",
    "Siemens",
    "2026-09",
    "https://www.theforage.com/completion-certificates/YtWaumzWHmKiqP63y/zSefEeEKvojiQqiaH_YtWaumzWHmKiqP63y_6a976aa947d0207b03375125_1788331337293_completion_certificate.pdf",
    ["project management", "KPI design", "dashboards"],
  ),
  cert(
    "ligency-ai-builder-n8n",
    "AI Builder: Create Agents, Voice Agents & Automations in n8n",
    "Ligency",
    "2026-11",
    "https://www.udemy.com/certificate/UC-9ff65c2c-8673-4294-a113-ff4d0663bbda/",
    ["n8n", "AI agents", "voice agents"],
  ),
  cert(
    "dlai-data-analytics-foundations",
    "Data Analytics Foundations",
    "DeepLearning.AI",
    "2026-09",
    "https://www.deeplearning.ai/certificates/981e8387-1e44-4001-afc8-a7b7a91b0e37",
    ["Google Sheets", "data visualisation", "data storytelling"],
  ),
  cert(
    "dlai-applied-statistics",
    "Applied Statistics for Data Analytics",
    "DeepLearning.AI",
    "2026-09",
    "https://www.deeplearning.ai/certificates/45b16854-99e7-4e45-b0b8-5b4959d70d18",
    ["probability", "hypothesis testing", "descriptive statistics"],
  ),
  cert(
    "dlai-llmops",
    "LLMOps",
    "DeepLearning.AI",
    "2026-09",
    "https://www.deeplearning.ai/accomplishments/73725c1d-ac8f-4e27-8fa3-f2111c41f361",
    ["fine-tuning", "evaluation and monitoring", "data processing"],
  ),
  cert(
    "udemy-complete-javascript",
    "The Complete JavaScript Course 2023",
    "Udemy",
    "2023-12",
    "https://www.udemy.com/certificate/UC-a8309093-d1ce-4c7e-a1d9-67d9c0fad40f/",
    ["JavaScript", "web development"],
  ),
  cert(
    "udemy-deep-learning-a-z",
    "Deep Learning A-Z: Hands-on Artificial Neural Networks",
    "Udemy",
    "2022-01",
    "https://www.udemy.com/certificate/UC-3bbfc172-0ecd-4d53-b33a-d75dcec2230d/",
    ["neural networks", "CNNs", "RNNs"],
  ),
  cert(
    "udemy-machine-learning-a-z",
    "Machine Learning A-Z: Hands-on Python & R in Data Science",
    "Udemy",
    "2022-01",
    "https://www.udemy.com/certificate/UC-5c92ca31-cbf2-4060-83f6-fcf209e464a1/",
    ["machine learning", "Python", "R"],
  ),
];

export const certificatesIntro = {
  eyebrow: "Online credentials",
  title: "Certifications",
};
