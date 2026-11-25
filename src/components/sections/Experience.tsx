import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Photo } from "@/components/ui/Photo";
import { Todo } from "@/components/ui/Todo";
import { experience } from "@/content/experience";
import { isPending } from "@/content/types";
import { formatRange } from "@/lib/format";

export function Experience() {
  return (
    <Section id="experience">
      <SectionHeader id="experience" />
      <ol className="relative max-w-3xl border-l border-steel-line pl-8 sm:pl-10">
        {experience.map((entry) =>
          isPending(entry) ? (
            <li key={entry.note} className="pb-10">
              <Todo item={entry} />
            </li>
          ) : (
            <li
              key={`${entry.employer}-${entry.start}`}
              className="photo-host relative pb-10 last:pb-0 sm:grid sm:grid-cols-[minmax(0,1fr)_9rem] sm:gap-x-8"
              data-reveal
            >
              <span
                aria-hidden="true"
                className="absolute top-2 -left-8 size-2.5 -translate-x-1/2 rounded-full bg-brass ring-4 ring-graphite sm:-left-10"
              />
              <div>
                <p className="font-mono text-mono-label tracking-[0.08em] text-concrete uppercase">
                  {formatRange(entry.start, entry.end)}
                </p>
                <h3 className="mt-2 font-display text-h3 font-semibold text-bone">
                  {entry.role}
                  <span className="font-normal text-concrete">, {entry.employer}</span>
                </h3>
                <p className="mt-2 max-w-measure text-concrete">{entry.line}</p>
              </div>
              {/* A small thumbnail beside the entry; the timeline stays text-only on phones. */}
              {entry.image ? (
                <Photo
                  photo={entry.image}
                  sizes="144px"
                  className="mt-1 hidden aspect-[3/2] rounded-sm border border-steel-line sm:block"
                />
              ) : null}
            </li>
          ),
        )}
      </ol>
    </Section>
  );
}
