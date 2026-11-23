import { Download } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { EmailBlock } from "@/components/ui/Email";
import { Todo } from "@/components/ui/Todo";
import { resumePending, site } from "@/content/site";

const socialLink =
  "link-underline inline-flex min-h-11 items-center gap-2 text-bone transition-colors hover:text-brass";

export function Contact() {
  return (
    <Section id="contact">
      <SectionHeader id="contact" intro={site.contact.line} />
      <div data-reveal>
        <EmailBlock />
      </div>

      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between" data-reveal>
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <li>
            <a href={site.links.linkedin} target="_blank" rel="noopener noreferrer" className={socialLink}>
              <LinkedinIcon className="size-4" />
              LinkedIn
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
          <li>
            <a href={site.links.github} target="_blank" rel="noopener noreferrer" className={socialLink}>
              <GithubIcon className="size-4" />
              GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
          <li className="font-mono text-small text-concrete">{site.location}</li>
        </ul>

        {site.resume.available ? (
          <a
            href={site.resume.href}
            download
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-sm border border-brass px-5 font-mono text-small uppercase tracking-[0.08em] text-brass transition-colors hover:bg-brass hover:text-graphite"
          >
            <Download aria-hidden="true" className="size-4" />
            Download resume
          </a>
        ) : resumePending ? (
          <Todo item={resumePending} className="w-fit" />
        ) : null}
      </div>
    </Section>
  );
}
