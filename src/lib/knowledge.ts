import { about } from "@/content/about";
import { certificates } from "@/content/certificates";
import { degrees } from "@/content/education";
import { experience } from "@/content/experience";
import { handsOn } from "@/content/handsOn";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { skillDrawers } from "@/content/skills";
import { confirmed, isPending } from "@/content/types";
import { formatRange } from "@/lib/format";

/**
 * The assistant's fact sheet (CLAUDE.md 8.7), compiled from the same content
 * files as the page, so the bot always matches the live site. Served as
 * /knowledge.md (prerendered at build). It is public by design, so it holds
 * only what the page shows: pending items and TODO notes are left out, and
 * there is never a phone number.
 */

const list = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

export function buildKnowledge(): string {
  const out: string[] = [];
  const section = (title: string, body: string) => out.push(`## ${title}\n\n${body.trim()}\n`);

  out.push(
    `# ${site.name}: facts for the portfolio assistant\n\nPublic content from the portfolio site, compiled at build time. Answer about Nadun in the third person, only from these facts.\n`,
  );

  section(
    "Summary",
    [
      `- Name: ${site.name}`,
      `- Role: ${site.role}`,
      `- Location: ${site.location}`,
      `- Availability: ${site.availability}`,
      "",
      site.heroLine,
      site.heroSubLine,
    ].join("\n"),
  );

  section(
    "About",
    [
      ...about.paragraphs,
      `${about.partsTitle} (the gearbox on the site):`,
      list(about.parts.map((p) => `${p.code} ${p.name}: ${p.line}`)),
    ].join("\n\n"),
  );

  section(
    "Projects",
    projects
      .map((p) => {
        const description = confirmed(p.description);
        const links = confirmed(p.links).map((l) => `${l.label}: ${l.href}`);
        return [
          `### ${p.index} · ${p.title}`,
          `${p.eyebrow}.`,
          ...description,
          p.team ?? null,
          p.tech.length ? `Tech: ${p.tech.join(", ")}.` : null,
          p.result ? `Result: ${p.result}.` : null,
          links.length ? list(links) : (p.noLinksNote ?? null),
        ]
          .filter(Boolean)
          .join("\n\n");
      })
      .join("\n\n"),
  );

  section(
    "Off the keyboard",
    list(
      handsOn.tiles.map((t) => {
        const lines = t.lines.filter((l): l is string => !isPending(l));
        return [t.title, ...lines].join(" ");
      }),
    ),
  );

  section("Skills", list(skillDrawers.map((d) => `${d.label}: ${d.skills.join(", ")}`)));

  section(
    "Experience (newest first)",
    list(confirmed(experience).map((e) => `${e.role}, ${e.employer} (${formatRange(e.start, e.end)}): ${e.line}`)),
  );

  const published = certificates.filter((c) => c.status === "published");
  section(
    "Education",
    [
      list(degrees.map((d) => `${d.title}, ${d.institution}, ${d.place}, ${d.years}${d.note ? `. ${d.note}` : ""}`)),
      published.length
        ? `Certifications:\n\n${list(published.map((c) => `${c.title}, ${c.issuer}`))}`
        : "",
    ].join("\n\n"),
  );

  section(
    "Contact",
    list([
      `Email: ${site.email.user} at ${site.email.domain}. Email is the fastest way to reach him.`,
      `LinkedIn: ${site.links.linkedin}`,
      `GitHub: ${site.links.github}`,
      `Location: ${site.location}`,
    ]),
  );

  section(
    "Faith",
    `Nadun is a Christian, and his faith is central to him. On the site's gearbox the brass sun gear at the centre stands for faith, engraved EPH 2:8, with a cross behind it. The footer verse: "${site.verse.text}" (${site.verse.reference.replace(" · ", ", ")}).`,
  );

  return out.join("\n");
}
