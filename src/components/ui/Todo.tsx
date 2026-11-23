import { SHOW_PLACEHOLDERS, type Pending } from "@/content/types";

/**
 * Development-only marker for a fact Nadun still needs to supply.
 * Renders nothing in production.
 */
export function Todo({ item, className = "" }: { item: Pending; className?: string }) {
  if (!SHOW_PLACEHOLDERS) return null;
  return (
    <span
      className={`block rounded-sm border border-dashed border-brass/60 px-2 py-1 font-mono text-mono-label text-brass ${className}`}
    >
      TODO(nadun): {item.note}
    </span>
  );
}
