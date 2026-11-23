import type { SectionId } from "@/content/site";

/** Page section with its id, landmark label and standard spacing. */
export function Section({
  id,
  children,
  className = "",
}: {
  id: SectionId;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      data-section={id}
      // Below-the-fold sections skip style/layout until near the viewport.
      className={`relative py-20 [contain-intrinsic-size:auto_1200px] [content-visibility:auto] md:py-28 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
