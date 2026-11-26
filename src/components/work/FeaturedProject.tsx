import { Photo } from "@/components/ui/Photo";
import type { Project } from "@/content/projects";
import { FieldTiles } from "./FieldTiles";
import { InspectionTag } from "./InspectionTag";
import { ProjectBody, projectTitleId } from "./ProjectBody";
import { ProjectLinks } from "./ProjectLinks";

/** The app screenshot, uncropped at its own shape, in a machined frame. */
function Screenshot({
  shot,
  sizes,
  className = "",
}: {
  shot: NonNullable<Project["screenshot"]>;
  sizes: string;
  className?: string;
}) {
  return (
    <Photo
      photo={shot}
      sizes={sizes}
      className={`w-full rounded-machined border border-steel-line ${className}`}
      style={{ aspectRatio: `${shot.width} / ${shot.height}` }}
    />
  );
}

/** Full-width card: copy on the left, a visual on the right. */
export function FeaturedProject({ project }: { project: Project }) {
  const { image, screenshot } = project;
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
        <div className="mb-6">
          <ProjectLinks project={project} />
        </div>
        <ProjectBody project={project} />
        {/* Phones and tablets: the screenshot sits after the text, above the result
            tag (desktop shows it in the visual column instead). */}
        {screenshot && image ? (
          <Screenshot
            shot={screenshot}
            sizes="100vw"
            className="mt-8 lg:hidden"
          />
        ) : null}
        {project.result ? (
          <div className="mt-auto pt-8">
            <InspectionTag result={project.result} />
          </div>
        ) : null}
      </div>
      {/* Visual column: the project photo edge to edge at the top (kept wide, so
          a group photo isn't cropped to its middle), then the app screenshot, or
          the field-tile drawing if there isn't one. On phones the photo sits at
          the top of the card like the other project cards. */}
      <div
        className={`flex flex-col bg-cast lg:order-none lg:border-t-0 lg:border-l lg:border-steel-line ${
          image ? "order-first" : "border-t border-steel-line"
        }`}
      >
        {image ? (
          <Photo
            photo={image}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="aspect-[4/3]"
          />
        ) : null}
        {screenshot ? (
          <div
            className={`flex-1 items-center p-6 ${image ? "hidden lg:flex" : "flex"}`}
          >
            <Screenshot
              shot={screenshot}
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          </div>
        ) : (
          <div
            className={`flex-1 items-center p-6 sm:p-8 lg:p-10 ${image ? "hidden lg:flex" : "flex"}`}
          >
            <FieldTiles className="w-full" />
          </div>
        )}
      </div>
    </article>
  );
}
