import { ChipList } from "@/components/ui/Chip";
import { Todo } from "@/components/ui/Todo";
import type { Project } from "@/content/projects";
import { isPending } from "@/content/types";

export const projectTitleId = (project: Project) => `project-${project.id}`;

/** Eyebrow → title → description → team → tech chips. Shared by all card variants. */
export function ProjectBody({ project }: { project: Project }) {
  return (
    <>
      <p className="eyebrow text-brass">
        <span className="text-concrete">{project.index} · </span>
        {project.eyebrow}
      </p>
      <h3 id={projectTitleId(project)} className="mt-3 font-display text-h3 font-semibold text-bone">
        {project.title}
      </h3>
      <div className="mt-4 space-y-3 text-concrete">
        {project.description.map((paragraph) =>
          isPending(paragraph) ? (
            <Todo key={paragraph.note} item={paragraph} />
          ) : (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ),
        )}
      </div>
      {project.team ? <p className="mt-3 text-small text-concrete">{project.team}</p> : null}
      <div className="mt-5">
        <ChipList items={project.tech} label="Tech" />
      </div>
    </>
  );
}
