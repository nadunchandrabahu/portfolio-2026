import { GearboxPoster } from "@/components/gearbox/GearboxPoster";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { FeaturedProject } from "@/components/work/FeaturedProject";
import { ProjectCard } from "@/components/work/ProjectCard";
import { projects, workIntro } from "@/content/projects";

export function Work() {
  const featured = projects.filter((p) => p.variant === "featured");
  const rest = projects.filter((p) => p.variant !== "featured");

  return (
    <Section id="work">
      <SectionHeader id="work" intro={workIntro} />
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_15rem] xl:gap-12">
        <div className="flex flex-col gap-6">
          {featured.map((project) => (
            <div key={project.id} data-reveal>
              <FeaturedProject project={project} />
            </div>
          ))}
          <ul className="grid gap-6 md:grid-cols-2">
            {rest.map((project, i) => (
              <li
                key={project.id}
                data-reveal
                style={{ "--reveal-index": i % 2 } as React.CSSProperties}
                className={project.variant === "secondary" ? "md:self-start" : ""}
              >
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        </div>

        {/* Wide screens: a sticky rail where the gearbox sits face-on to its ring.
            The segment for the card in view lights up (StageDirector). Without
            the 3D stage, the 2D drawing stands in. */}
        <aside aria-hidden="true" className="hidden xl:block">
          <div className="sticky top-28">
            <div data-gearbox-slot="work" className="relative aspect-square w-full">
              <GearboxPoster className="gearbox-slot-fallback h-full w-full opacity-80" />
            </div>
            <p className="eyebrow mt-4 text-center text-concrete">Ring · 00–06 · one per project</p>
          </div>
        </aside>
      </div>
    </Section>
  );
}
