import Image from "next/image";
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
        <Image
          src={project.image.src}
          alt={project.image.alt}
          width={1280}
          height={720}
          className="aspect-video w-full object-cover"
        />
      ) : null}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <ProjectBody project={project} />
        <div className="mt-auto flex flex-col gap-4 pt-6">
          {project.result && !secondary ? <InspectionTag result={project.result} /> : null}
          <ProjectLinks project={project} />
        </div>
      </div>
    </article>
  );
}
