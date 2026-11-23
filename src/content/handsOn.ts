import { pending, type Pending } from "./types";

// TODO(nadun): all four tiles need your sign-off (CLAUDE.md 5.4).
export type HandsOnTile = {
  label: string;
  title: string;
  lines: (string | Pending)[];
  image?: { src: string; alt: string };
};

export const handsOn: { tiles: HandsOnTile[]; closing: string } = {
  tiles: [
    {
      label: "Workshop",
      title: "Working as a mechanic.",
      lines: ["Started in November 2026.", pending("Employer or context, and one line on the work")],
    },
    {
      label: "Automotive",
      title: "Assistant automobile technician, DIMO Lanka.",
      lines: ["Internship, November 2016 to January 2017, about 360 hours."],
    },
    {
      label: "CAD & 3D",
      title: "SolidWorks and Blender.",
      lines: [
        "3D modelling for engineering and product work.",
        pending("Mention that the gearbox on this page could be your own model (CLAUDE.md 7.6)"),
      ],
    },
    {
      label: "Infrastructure",
      title: "Moved a company's server network.",
      lines: ["Relocated Azzureo's entire server network between two Sydney sites."],
    },
  ],
  // TODO(nadun): approve the closing line.
  closing: "Same habit on the bench and in the notebook: measure, fix, test, then measure again.",
};
