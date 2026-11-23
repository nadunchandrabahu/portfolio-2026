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
    </Section>
  );
}
