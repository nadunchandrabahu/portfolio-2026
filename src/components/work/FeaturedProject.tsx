import { Photo } from "@/components/ui/Photo";
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
      {/* Visual column: the project photo edge to edge at the top (kept wide, so
          a group photo isn't cropped to its middle), then the field-tile
          drawing. On phones the photo alone stands in for both, at the top of
          the card like the other project cards. */}
      <div
        className={`flex flex-col bg-cast lg:order-none lg:border-t-0 lg:border-l lg:border-steel-line ${
          project.image ? "order-first" : "border-t border-steel-line"
        }`}
      >
        {project.image ? (
          <Photo photo={project.image} sizes="(min-width: 1024px) 40vw, 100vw" className="aspect-[4/3]" />
        ) : null}
        <div
          className={`flex-1 items-center p-6 sm:p-8 lg:p-10 ${project.image ? "hidden lg:flex" : "flex"}`}
        >
          <FieldTiles className="w-full" />
        </div>
      </div>
    </article>
  );
}
