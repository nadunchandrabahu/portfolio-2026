export type SkillDrawerId = "languages" | "ml-ai" | "stats" | "web" | "tools";
export type SkillDrawer = { id: SkillDrawerId; label: string; skills: string[] };

export const skillDrawers: SkillDrawer[] = [
  {
    id: "languages",
    label: "Languages",
    skills: ["Python", "R (tidyverse, ggplot2, Quarto)", "SQL", "JavaScript"],
  },
  {
    id: "ml-ai",
    label: "Machine learning & AI",
    skills: [
      "n8n",
      "ElevenLabs",
      "APIs",
      "context engineering",
      "RAG and MCP",
      "agentic AI workflows",
      "automation",
      "LLM fine-tuning and benchmarking (GPT-4.1, BERT, BioBERT, Meta MMS)",
      "agentic AI evaluation",
      "PyTorch",
      "Hugging Face Transformers",
    ],
  },
  {
    id: "stats",
    label: "Statistics & analytics",
    skills: [
      "logistic regression",
      "generalized linear models",
      "statistical inference",
      "feature selection",
      "exploratory data analysis",
      "Power BI",
      "Tableau",
    ],
  },
  {
    id: "web",
    label: "Web & full-stack",
    skills: ["React", "React Native", "Supabase", "Shopify Storefront API", "Cloudflare"],
  },
  {
    id: "tools",
    label: "Tools",
    skills: ["Git/GitHub", "Google Apps Script", "Google Colab"],
  },
];
