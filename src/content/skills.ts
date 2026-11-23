export type SkillDrawer = { label: string; skills: string[] };

export const skillDrawers: SkillDrawer[] = [
  {
    label: "Languages",
    skills: ["Python", "R (tidyverse, ggplot2, Quarto)", "SQL", "JavaScript"],
  },
  {
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
    label: "Web & full-stack",
    skills: ["React", "React Native", "Supabase", "Shopify Storefront API", "Cloudflare"],
  },
  {
    label: "Tools",
    skills: ["Git/GitHub", "Google Apps Script", "Google Colab"],
  },
];
