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
          {/* Rows become buttons that focus the gearbox part in phase 4. */}
          <ol className="mt-4 border-t border-steel-line">
            {about.parts.map((part, i) => (
              <li
                key={part.code}
                data-part={part.part}
                data-reveal
                style={{ "--reveal-index": i } as React.CSSProperties}
                className="grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-1 border-b border-steel-line py-4 sm:grid-cols-[4.5rem_14rem_1fr]"
              >
                <span className="font-mono text-small text-brass">{part.code}</span>
                <span className="font-display font-semibold text-bone">{part.name}</span>
                <span className="col-start-2 text-concrete sm:col-start-3">{part.line}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Exploded 3D gearbox lands here in phase 4; blueprint drawing until then. */}
        <div className="hidden lg:block">
          <div className="sticky top-28">
            <GearboxPoster variant="blueprint" className="w-full opacity-90" />
          </div>
        </div>
      </div>
    </Section>
  );
}
