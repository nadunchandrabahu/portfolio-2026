import { ArrowUpRight, type LucideIcon } from "lucide-react";

/**
 * Brass outline button that opens an external page in a new tab, in the
 * same style as "Download resume" and "Ask the workshop": fills brass on
 * hover. 44px tall for touch.
 */
export function ExternalButton({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-brass px-4 font-mono text-small font-medium tracking-[0.08em] text-brass uppercase transition-colors hover:bg-brass hover:text-graphite active:bg-brass-deep active:text-graphite"
    >
      {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
      {children}
      <ArrowUpRight aria-hidden="true" className="size-4" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/**
 * Development-only stand-in for a button whose link Nadun hasn't supplied
 * yet: the same shape, dashed and inert. Production renders nothing (the
 * page passes it only when SHOW_PLACEHOLDERS is on).
 */
export function PlaceholderButton({ icon: Icon, children }: { icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <span
      aria-disabled="true"
      className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-sm border border-dashed border-brass/50 px-4 font-mono text-small font-medium tracking-[0.08em] text-brass/60 uppercase"
    >
      {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
      {children}
    </span>
  );
}
