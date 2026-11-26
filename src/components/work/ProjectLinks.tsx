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
 * "Live" and "GitHub" buttons along the top of every project card. Without a
 * public URL the button still shows, disabled, so every card reads the same.
 */
export function ProjectLinks({ project }: { project: Project }) {
  const missing = SLOTS.map(({ key }) => project.links[key]).filter(isPending);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-3" aria-label={`${project.title} links`}>
        {SLOTS.map(({ key, label, icon }) => {
          const href = project.links[key];
          return (
            <li key={key}>
              {typeof href === "string" ? (
                <ExternalButton href={href} icon={icon}>
                  {label}
                </ExternalButton>
              ) : (
                <PlaceholderButton icon={icon}>{label}</PlaceholderButton>
              )}
            </li>
          );
        })}
      </ul>
      {missing.map((item) => (
        <Todo key={item.note} item={item} />
      ))}
    </div>
  );
}
