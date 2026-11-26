import { about } from "@/content/about";
import { projects, type ProjectId } from "@/content/projects";
import { site } from "@/content/site";
import { skillDrawers } from "@/content/skills";
import { OPENING_SUGGESTIONS, type ChatResponse } from "./schema";

/**
 * Canned replies for CHAT_MOCK=true (CLAUDE.md 8.4), so the whole chat UI
 * and the gearbox choreography work before n8n exists. Keyword-matched, in
 * the assistant's voice (third person), and built only from the site's own
 * content: nothing here is a fact the page doesn't already state.
 */


type Rule = { match: RegExp; reply: (message: string) => ChatResponse };

const part = (id: string) => about.parts.find((p) => p.part === id);

const projectKeywords: [RegExp, ProjectId][] = [
  [/\b(nasa|field ?shift|space apps|farm|crop|satellite)/i, "field-shift"],
  [/\b(clinical|medical|nlp|abbreviation|bert)/i, "clinical-nlp"],
  [/\b(language id|endangered|speech|audio|mms)/i, "language-id"],
  [/\b(mortgage|loan|default)/i, "mortgage-defaults"],
  [/\bpickl/i, "pickl-hq"],
  [/\bgrow ?365/i, "grow365"],
  [/\b(multi-instance|mil survey|survey)/i, "mil-survey"],
];

function projectReply(id: ProjectId): ChatResponse {
  const p = projects.find((x) => x.id === id);
  if (!p) return fallback();
  const lines = [
    `${p.title} is one of Nadun's projects (${p.eyebrow}).`,
    p.result ? `The measured result: ${p.result}.` : null,
    p.tech.length ? `Built with ${p.tech.join(", ")}.` : null,
  ].filter(Boolean);
  return {
    reply: `${lines.join(" ")}\n\nIt's segment ${p.index} on the gearbox ring, and the card is in the Selected work section.`,
    actions: [
      { type: "focus", target: "ring" },
      { type: "highlightProject", id },
    ],
    suggestions: ["What else has he built?", "What's at the centre?"],
  };
}

function fallback(): ChatResponse {
  return {
    reply:
      "I can answer questions about Nadun's projects, background and skills, or how to reach him. I can also take the gearbox apart for you.",
    actions: [],
    suggestions: [...OPENING_SUGGESTIONS.slice(0, 3)],
  };
}

const rules: Rule[] = [
  {
    // "light mode", "switch to rain", "make it dark"… (theme words next to mode/theme, or rain on its own)
    match: /\b(light|dark|rain|rainy)\s+(mode|theme)\b|\b(mode|theme)\b.*\b(light|dark|rain)\b|\brain\b/i,
    reply: (message) => {
      const value = /rain/i.test(message) ? "rain" : /light/i.test(message) ? "light" : "dark";
      const line = {
        dark: "Back to the night workshop: dark mode.",
        light: "Lights on: the drafting-paper theme.",
        rain: "Rain mode: a greyer, gloomier workshop, with rain on the glass.",
      }[value];
      return {
        reply: `${line} You can also change it any time with the theme button in the header.`,
        actions: [{ type: "theme", value }],
        suggestions: ["Show me the NASA project", "Take the gearbox apart"],
      };
    },
  },
  {
    match: /\b(mechanical|engineer\w*|background|story|career|end up)\b/i,
    reply: () => ({
      reply: [
        `Nadun trained as a mechanical engineer (Curtin University, delivered at SLIIT in Sri Lanka). ${part("engineering")?.line ?? ""}`,
        "He then did a Master of Data Science at Macquarie University. His work now runs from statistical modelling on large datasets to fine-tuning language models and evaluating AI agents.",
        "On the gearbox, watch the drive pass from the engineering planet through the mesh to the AI planet.",
      ].join("\n\n"),
      actions: [
        { type: "focus", target: "engineering" },
        { type: "spin", rpm: 30 },
        { type: "focus", target: "ai" },
      ],
      suggestions: ["Show me the NASA project", "What tools does he use?", "Take the gearbox apart"],
    }),
  },
  {
    match: /\b(apart|explode\w*|disassembl\w*|exploded|parts)\b/i,
    reply: () => ({
      reply:
        "Here it is in exploded view. The brass sun gear at the centre stands for faith. The four steel planets are mechanical engineering, statistics and data science, machine learning and AI, and building. The fixed outer ring carries his seven projects, one segment each.",
      actions: [
        { type: "focus", target: "overview" },
        { type: "explode", amount: 1 },
        { type: "spin", rpm: 8 },
      ],
      suggestions: ["Put it back together", "What's at the centre?", "Show it as a drawing"],
    }),
  },
  {
    match: /\b(together|reassembl\w*|assemble|reset|back)\b/i,
    reply: () => ({
      reply: "Back together, and control goes back to the page as you scroll.",
      actions: [{ type: "reset" }],
      suggestions: ["Take the gearbox apart", "Show me the NASA project"],
    }),
  },
  {
    match: /\b(blueprint|drawing|drafting)\b/i,
    reply: () => ({
      reply: "This is the engineering-drawing view: the same gearbox as a line drawing, with centre lines and two dimensions.",
      actions: [
        { type: "mode", value: "blueprint" },
        { type: "spin", rpm: 0 },
      ],
      suggestions: ["Put it back together", "Take the gearbox apart"],
    }),
  },
  {
    match: /\b(centre|center|sun|faith|cross|god|christian|ephesians|eph|verse)\b/i,
    reply: () => ({
      reply: `At the centre is the brass sun gear, engraved EPH 2:8, with a cross on the hub behind it. Nadun is a Christian, and his faith is what everything else turns around.\n\n"${site.verse.text}" (${site.verse.reference.replace(" · ", ", ")})`,
      actions: [
        { type: "explode", amount: 0 },
        { type: "focus", target: "sun" },
        { type: "spin", rpm: 4 },
      ],
      suggestions: ["How does a mechanical engineer end up in AI?", "What else has he built?"],
    }),
  },
  {
    match: /\b(contact|email|reach|hire|hiring|available|availability|resume|cv)\b/i,
    reply: () => ({
      reply: `Email is the fastest way to reach Nadun. The address and a copy button are in the Contact section. He's in ${site.location} and open to data and AI roles. He's also on LinkedIn and GitHub.`,
      actions: [{ type: "scrollTo", section: "contact" }],
      suggestions: ["What has he built?", "What tools does he use?"],
    }),
  },
  {
    match: /\b(skills?|tools?|stack|languages?|python|toolbox)\b/i,
    reply: () => ({
      reply: `His toolbox, by drawer: ${skillDrawers
        .map((d) => `${d.label.toLowerCase()} (${d.skills.slice(0, 4).join(", ")}${d.skills.length > 4 ? ", and more" : ""})`)
        .join("; ")}.`,
      actions: [{ type: "scrollTo", section: "skills" }],
      suggestions: ["Show me the NASA project", "How does a mechanical engineer end up in AI?"],
    }),
  },
  {
    match: /\b(projects?|built|build|work|portfolio)\b/i,
    reply: () => ({
      reply: `Seven projects sit on the ring, one segment each: ${projects.map((p) => `${p.index} ${p.title}`).join("; ")}.`,
      actions: [
        { type: "focus", target: "ring" },
        { type: "scrollTo", section: "work" },
      ],
      suggestions: ["Show me the NASA project", "Tell me about the clinical NLP project"],
    }),
  },
];

export function mockReply(message: string): ChatResponse {
  for (const [pattern, id] of projectKeywords) {
    if (pattern.test(message)) return projectReply(id);
  }
  for (const rule of rules) {
    if (rule.match.test(message)) return rule.reply(message);
  }
  return fallback();
}
