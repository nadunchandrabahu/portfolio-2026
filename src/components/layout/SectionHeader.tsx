import { getSection, type SectionId } from "@/content/site";

/**
 * Engineering dimension line, then the Archivo section title:
 * |←──── 02 · SELECTED WORK ────→|
 */
export function SectionHeader({ id, intro }: { id: SectionId; intro?: string }) {
  const section = getSection(id);
  return (
    <header className="mb-10 md:mb-14">
      <div className="dimension-line" data-reveal aria-hidden="true">
        <span className="dimension-line__tick" />
        <span className="dimension-line__rule dimension-line__rule--start" />
        <span className="dimension-line__label eyebrow">
          {section.number} · {section.label}
        </span>
        <span className="dimension-line__rule dimension-line__rule--end" />
        <span className="dimension-line__tick" />
      </div>
      <h2
        id={`${id}-title`}
        className="display-expanded mt-6 text-h2 font-bold uppercase text-bone"
        data-reveal
      >
        <span className="sr-only">{section.number} · </span>
        {section.title}
      </h2>
      {intro ? (
        <p className="mt-4 max-w-measure text-concrete" data-reveal>
          {intro}
        </p>
      ) : null}
    </header>
  );
}
