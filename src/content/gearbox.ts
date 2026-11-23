import { about, type GearPartId } from "./about";
import { degrees } from "./education";
import { handsOn } from "./handsOn";
import { projects, type ProjectId } from "./projects";
import { site } from "./site";
import { skillDrawers, type SkillDrawerId } from "./skills";

/**
 * What the hero gearbox shows when a part is hovered (or tapped). Everything
 * here is composed from the other content files, so the gearbox never says
 * anything the page text doesn't.
 */

export type GearDetailGroup = { label: string; items: string[] };

export type GearDetail = {
  code: string;
  name: string;
  line: string;
  groups: GearDetailGroup[];
  quote?: { text: string; reference: string };
};

/** Which Toolbox drawers each planet carries. */
const PART_DRAWERS: Record<Exclude<GearPartId, "sun" | "engineering">, SkillDrawerId[]> = {
  data: ["stats", "languages"],
  ai: ["ml-ai"],
  build: ["web", "tools"],
};

const drawerGroups = (ids: SkillDrawerId[]): GearDetailGroup[] =>
  ids.flatMap((id) => {
    const drawer = skillDrawers.find((d) => d.id === id);
    return drawer ? [{ label: drawer.label, items: drawer.skills }] : [];
  });

const tileTitle = (label: string) =>
  handsOn.tiles.find((t) => t.label === label)?.title.replace(/\.$/, "");

function engineeringGroups(): GearDetailGroup[] {
  const degree = degrees.find((d) => d.title.includes("Engineering"));
  const handsOnTitles = ["Workshop", "Automotive", "CAD & 3D"]
    .map(tileTitle)
    .filter((t): t is string => Boolean(t));
  return [
    ...(degree ? [{ label: "Degree", items: [`${degree.title}, ${degree.institution}`] }] : []),
    { label: "Off the keyboard", items: handsOnTitles },
  ];
}

function partDetail(part: GearPartId): GearDetail {
  const row = about.parts.find((p) => p.part === part);
  const base = { code: row?.code ?? "", name: row?.name ?? part, line: row?.line ?? "" };
  if (part === "sun") return { ...base, groups: [], quote: site.verse };
  if (part === "engineering") return { ...base, groups: engineeringGroups() };
  return { ...base, groups: drawerGroups(PART_DRAWERS[part]) };
}

export const gearPartDetails: Record<GearPartId, GearDetail> = {
  engineering: partDetail("engineering"),
  data: partDetail("data"),
  ai: partDetail("ai"),
  build: partDetail("build"),
  sun: partDetail("sun"),
};

/** A ring segment: one project. */
export function projectDetail(id: ProjectId): GearDetail | null {
  const project = projects.find((p) => p.id === id);
  if (!project) return null;
  return {
    code: `Ring · ${project.index}`,
    name: project.title,
    line: project.result ?? project.eyebrow,
    groups: [{ label: "Built with", items: project.tech }],
  };
}
