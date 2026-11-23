import { ExternalTextLink } from "@/components/ui/ExternalTextLink";
import { Todo } from "@/components/ui/Todo";
import type { Project } from "@/content/projects";
import { confirmed, isPending } from "@/content/types";

export function ProjectLinks({ project }: { project: Project }) {
  const links = confirmed(project.links);
  const missing = project.links.filter(isPending);

  return (
    <div className="flex flex-col gap-2">
      {links.length > 0 ? (
        <ul className="flex flex-wrap gap-x-5" aria-label={`${project.title} links`}>
          {links.map((link) => (
            <li key={link.href}>
              <ExternalTextLink href={link.href}>{link.label}</ExternalTextLink>
            </li>
          ))}
        </ul>
      ) : project.noLinksNote ? (
        <p className="font-mono text-small text-concrete">{project.noLinksNote}</p>
      ) : null}
      {missing.map((item) => (
        <Todo key={item.note} item={item} />
      ))}
    </div>
  );
}
