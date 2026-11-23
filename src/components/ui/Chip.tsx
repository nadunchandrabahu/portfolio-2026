/** Mono tag chip: 1px steel-line outline, no fill. */
export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-sm border border-steel-line px-2 py-1 font-mono text-mono-label leading-snug text-concrete">
      {children}
    </li>
  );
}

export function ChipList({ items, label }: { items: string[]; label?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label={label}>
      {items.map((item) => (
        <Chip key={item}>{item}</Chip>
      ))}
    </ul>
  );
}
