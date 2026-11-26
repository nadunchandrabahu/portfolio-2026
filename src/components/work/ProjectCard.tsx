import { Photo } from "@/components/ui/Photo";
import type { Project } from "@/content/projects";
import { InspectionTag } from "./InspectionTag";
import { ProjectBody, projectTitleId } from "./ProjectBody";
import { ProjectLinks } from "./ProjectLinks";

export function ProjectCard({ project }: { project: Project }) {
  const secondary = project.variant === "secondary";
  return (
    <article
      data-project-id={project.id}
      aria-labelledby={projectTitleId(project)}
      className={`project-card machined-card lift-card flex h-full flex-col overflow-hidden ${
        secondary ? "bg-cast" : ""
      }`}
    >
      {project.image ? (
        <Photo
          photo={project.image}
          sizes="(min-width: 1280px) 34vw, (min-width: 768px) 46vw, 100vw"
          // The secondary card stays compact (CLAUDE.md 5.2): a letterbox strip.
          className={secondary ? "aspect-[3/1]" : "aspect-video"}
        />
      ) : null}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="mb-5">
          <ProjectLinks project={project} />
        </div>
        <ProjectBody project={project} />
        {project.result && !secondary ? (
          <div className="mt-auto pt-6">
            <InspectionTag result={project.result} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
