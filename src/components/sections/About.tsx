import { GearboxPoster } from "@/components/gearbox/GearboxPoster";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { about } from "@/content/about";

export function About() {
  return (
    <Section id="about" className="bg-cast">
      <SectionHeader id="about" />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16">
        <div>
          <div className="max-w-measure space-y-5 text-bone">
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 32)} data-reveal>
                {p}
              </p>
            ))}
          </div>

          <h3 className="eyebrow mt-14 text-concrete" data-reveal>
            {about.partsTitle}
          </h3>
          {/* Each row is a button: hovering or focusing it brings that part of the
              gearbox forward (StageDirector, desktop). */}
          <ol className="mt-4 border-t border-steel-line">
            {about.parts.map((part, i) => (
              <li
                key={part.code}
                data-reveal
                style={{ "--reveal-index": i } as React.CSSProperties}
                className="border-b border-steel-line"
              >
                <button
                  type="button"
                  data-part={part.part}
                  className="grid w-full grid-cols-[4.5rem_1fr] gap-x-4 gap-y-1 px-2 py-4 text-left transition-colors hover:bg-machined/60 focus-visible:bg-machined/60 sm:grid-cols-[4.5rem_14rem_1fr]"
                >
                  <span className="font-mono text-small text-brass">{part.code}</span>
                  <span className="font-display font-semibold text-bone">{part.name}</span>
                  <span className="col-start-2 text-concrete sm:col-start-3">{part.line}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* The exploded 3D gearbox (with part balloons) sits in this slot on desktop.
            The blueprint drawing stands in without the 3D stage. */}
        <div aria-hidden="true" className="hidden lg:block">
          <div data-gearbox-slot="about" className="sticky top-28">
            <GearboxPoster variant="blueprint" className="gearbox-slot-fallback w-full opacity-90" />
          </div>
        </div>
      </div>
    </Section>
  );
}
