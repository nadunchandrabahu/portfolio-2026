"use client";

/** Suggestion chips: tap to send that question. */
export function Suggestions({
  items,
  disabled,
  onPick,
}: {
  items: readonly string[];
  disabled: boolean;
  onPick: (text: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul aria-label="Suggested questions" className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(item)}
            className="min-h-9 rounded-sm border border-steel-line px-3 py-1.5 text-left font-mono text-[12px] leading-snug text-bone transition-colors hover:border-brass/60 hover:text-brass disabled:opacity-50"
          >
            {item}
          </button>
        </li>
      ))}
    </ul>
  );
}
