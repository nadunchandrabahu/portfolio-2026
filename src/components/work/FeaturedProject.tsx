import Image from "next/image";
import type { Project } from "@/content/projects";
import { FieldTiles } from "./FieldTiles";
import { InspectionTag } from "./InspectionTag";
import { ProjectBody, projectTitleId } from "./ProjectBody";
import { ProjectLinks } from "./ProjectLinks";

/** Full-width card: copy on the left, a visual on the right. */
export function FeaturedProject({ project }: { project: Project }) {
  return (
    <article
      data-project-id={project.id}
      aria-labelledby={projectTitleId(project)}
      className="project-card machined-card lift-card grid overflow-hidden lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
    >
      <div className="flex flex-col p-6 sm:p-8 lg:p-10">
        <p className="eyebrow mb-4 inline-flex w-fit items-center gap-2 rounded-sm border border-brass/40 px-2 py-1 text-brass">
          Featured
        </p>
        <ProjectBody project={project} />
        <div className="mt-auto flex flex-col gap-4 pt-8">
          {project.result ? <InspectionTag result={project.result} /> : null}
          <ProjectLinks project={project} />
        </div>
      </div>
      <div className="flex items-center border-t border-steel-line bg-cast p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
        {project.image ? (
          <Image
            src={project.image.src}
            alt={project.image.alt}
            width={1280}
            height={960}
            className="h-auto w-full rounded-sm"
          />
        ) : (
          <FieldTiles className="w-full" />
        )}
      </div>
    </article>
  );
}
