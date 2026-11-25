import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Photo } from "@/components/ui/Photo";
import { Todo } from "@/components/ui/Todo";
import { handsOn } from "@/content/handsOn";
import { isPending } from "@/content/types";

export function HandsOn() {
  return (
    <Section id="hands-on">
      <SectionHeader
        id="hands-on"
        aside={
          // The gearbox reassembles here as a blueprint drawing (StageDirector).
          <div aria-hidden="true" data-gearbox-slot="hands-on" className="gearbox-slot-optional mt-4 size-40 shrink-0 lg:-mb-14" />
        }
      />
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {handsOn.tiles.map((tile, i) => (
          <li key={tile.label} data-reveal style={{ "--reveal-index": i } as React.CSSProperties}>
            <div className="photo-host machined-card lift-card flex h-full flex-col overflow-hidden">
              {tile.image ? (
                <Photo photo={tile.image} sizes="(min-width: 1280px) 22vw, (min-width: 640px) 46vw, 100vw" className="aspect-[4/3]" />
              ) : null}
              <div className="flex flex-1 flex-col gap-3 p-6">
                <p className="eyebrow text-brass">{tile.label}</p>
                <h3 className="font-display text-h3 font-semibold text-bone">{tile.title}</h3>
                {tile.lines.map((line) =>
                  isPending(line) ? (
                    <Todo key={line.note} item={line} />
                  ) : (
                    <p key={line} className="text-concrete">
                      {line}
                    </p>
                  ),
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-10 max-w-measure text-concrete" data-reveal>
        {handsOn.closing}
      </p>
    </Section>
  );
}
