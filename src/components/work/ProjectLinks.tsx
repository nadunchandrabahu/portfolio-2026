import { Globe } from "lucide-react";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { ExternalButton, PlaceholderButton } from "@/components/ui/ExternalButton";
import { Todo } from "@/components/ui/Todo";
import type { Project } from "@/content/projects";
import { isPending } from "@/content/types";

const SLOTS = [
  { key: "live", label: "Live", icon: Globe },
  { key: "github", label: "GitHub", icon: GithubIcon },
] as const;

/**
 * "Live" and "GitHub" buttons along the top of a project card, only the ones
 * the project has. A link that exists but isn't public yet shows disabled,
 * with its reason; an optional note sits underneath.
 */
export function ProjectLinks({ project }: { project: Project }) {
  const slots = SLOTS.filter(({ key }) => project.links[key] !== undefined);
  const missing = slots.map(({ key }) => project.links[key]).filter(isPending);
  if (!slots.length && !project.linkNote) return null;

  return (
    <div className="flex flex-col gap-2">
      {slots.length ? (
        <ul className="flex flex-wrap gap-3" aria-label={`${project.title} links`}>
          {slots.map(({ key, label, icon }) => {
            const link = project.links[key];
            return (
              <li key={key}>
                {typeof link === "string" ? (
                  <ExternalButton href={link} icon={icon}>
                    {label}
                  </ExternalButton>
                ) : (
                  <PlaceholderButton
                    icon={icon}
                    reason={link && "unavailable" in link ? link.unavailable : undefined}
                  >
                    {label}
                  </PlaceholderButton>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      {project.linkNote ? <p className="text-small text-concrete">{project.linkNote}</p> : null}
      {missing.map((item) => (
        <Todo key={item.note} item={item} />
      ))}
    </div>
  );
}
