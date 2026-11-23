import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { ChipList } from "@/components/ui/Chip";
import { skillDrawers } from "@/content/skills";

export function Toolbox() {
  return (
    <Section id="skills" className="bg-cast">
      <SectionHeader id="skills" />
      <div className="gap-6 md:columns-2 xl:columns-3">
        {skillDrawers.map((drawer, i) => {
          const n = String(i + 1).padStart(2, "0");
          return (
            <section
              key={drawer.label}
              aria-labelledby={`drawer-${n}`}
              data-reveal
              style={{ "--reveal-index": i % 3 } as React.CSSProperties}
              className="machined-card mb-6 break-inside-avoid p-6"
            >
              <h3 id={`drawer-${n}`} className="eyebrow flex items-center gap-3 text-concrete">
                <span className="text-brass">Drawer {n}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-steel-line" />
                <span className="text-bone">{drawer.label}</span>
              </h3>
              <div className="mt-5">
                <ChipList items={drawer.skills} />
              </div>
            </section>
          );
        })}
      </div>
    </Section>
  );
}
