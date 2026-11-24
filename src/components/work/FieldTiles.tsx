/**
 * Stylised satellite-tile mosaic for the Field Shift card. Illustrative only:
 * the values are a deterministic pattern, not real data.
 */
const COLS = 14;
const ROWS = 10;
const SIZE = 10;

// Smooth, repeatable "terrain" from a few sine waves, in 0..1.
function value(c: number, r: number): number {
  const v =
    Math.sin(c * 0.55 + 0.8) * 0.35 +
    Math.cos(r * 0.7 - c * 0.2) * 0.3 +
    Math.sin((c + r) * 0.33) * 0.2;
  return Math.min(1, Math.max(0, 0.5 + v * 0.6));
}

const cells = Array.from({ length: COLS * ROWS }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return { c, r, v: value(c, r) };
});

// One <path> per shade instead of a <rect> per tile (10 paths, not 140
// elements): same picture, a much lighter DOM to parse and hydrate.
const LEVELS = 8;
const shades = (() => {
  const groups = new Map<string, { fill: string; opacity: number; d: string }>();
  for (const { c, r, v } of cells) {
    const fill = v > 0.62 ? "var(--brass-deep)" : "var(--steel-line)";
    const level = Math.round(v * (LEVELS - 1)) / (LEVELS - 1);
    const key = `${fill}|${level}`;
    const group = groups.get(key) ?? { fill, opacity: 0.25 + level * 0.75, d: "" };
    const inner = SIZE - 1.2;
    group.d += `M${c * SIZE + 0.6} ${r * SIZE + 0.6}h${inner}v${inner}h-${inner}Z`;
    groups.set(key, group);
  }
  return [...groups.values()];
})();

// Three highlighted tiles (one per crop) along a single band.
const marked = new Set(["3,6", "7,3", "11,5"]);

export function FieldTiles({ className = "" }: { className?: string }) {
  const w = COLS * SIZE;
  const h = ROWS * SIZE;
  return (
    <figure className={className}>
      <svg viewBox={`-6 -6 ${w + 12} ${h + 12}`} aria-hidden="true" className="h-auto w-full">
        {shades.map((shade) => (
          <path key={`${shade.fill}${shade.opacity}`} d={shade.d} fill={shade.fill} opacity={shade.opacity} />
        ))}
        {[...marked].map((key) => {
          const [c = 0, r = 0] = key.split(",").map(Number);
          return (
            <rect
              key={key}
              x={c * SIZE}
              y={r * SIZE}
              width={SIZE}
              height={SIZE}
              fill="none"
              stroke="var(--brass)"
              strokeWidth={1}
            />
          );
        })}
        {/* Corner registration marks. */}
        <g stroke="var(--concrete)" strokeWidth={0.6} fill="none">
          <path d={`M-4 4 V-4 H4 M${w - 4} -4 H${w + 4} V4 M${w + 4} ${h - 4} V${h + 4} H${w - 4} M4 ${h + 4} H-4 V${h - 4}`} />
        </g>
      </svg>
      <figcaption className="eyebrow mt-3 flex justify-between gap-4 text-concrete">
        <span>MODIS · ECOSTRESS · POWER</span>
        <span>Illustrative</span>
      </figcaption>
    </figure>
  );
}
