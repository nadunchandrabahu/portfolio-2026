import { ArrowUpRight, Download } from "lucide-react";
import type { ComponentType } from "react";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: "true" }>;

const shape =
  "inline-flex min-h-11 items-center gap-2 rounded-sm border px-4 font-mono text-small font-medium tracking-[0.08em] uppercase";

/**
 * Brass outline button that opens an external page in a new tab, in the
 * same style as "Download resume" and "Digital twin": fills brass on
 * hover. 44px tall for touch.
 */
export function ExternalButton({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon?: Icon;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${shape} border-brass text-brass transition-colors hover:bg-brass hover:text-graphite active:bg-brass-deep active:text-graphite`}
    >
      {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
      {children}
      <ArrowUpRight aria-hidden="true" className="size-4" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** The same button for a file on this site: it downloads the file. */
export function DownloadButton({
  href,
  fileName,
  icon: Icon,
  children,
}: {
  href: string;
  fileName: string;
  icon?: Icon;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      download={fileName}
      className={`${shape} border-brass text-brass transition-colors hover:bg-brass hover:text-graphite active:bg-brass-deep active:text-graphite`}
    >
      {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
      {children}
      <Download aria-hidden="true" className="size-4" />
      <span className="sr-only"> (PDF download)</span>
    </a>
  );
}

/**
 * The same button, dashed and disabled, for a link that isn't public yet.
 * `reason` is read out by screen readers and shown as a tooltip.
 */
export function PlaceholderButton({
  icon: Icon,
  reason = "no public link yet",
  children,
}: {
  icon?: Icon;
  reason?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      title={reason.charAt(0).toUpperCase() + reason.slice(1)}
      className={`${shape} cursor-not-allowed border-dashed border-brass/45 text-brass/55`}
    >
      {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
      {children}
      <span className="sr-only"> ({reason})</span>
    </button>
  );
}
