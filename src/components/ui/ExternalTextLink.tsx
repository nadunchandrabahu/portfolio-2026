import { ArrowUpRight } from "lucide-react";

/** Brass text link with an arrow, opening in a new tab. */
export function ExternalTextLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`link-underline inline-flex min-h-11 items-center gap-1 font-mono text-small text-brass ${className}`}
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="size-4" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
