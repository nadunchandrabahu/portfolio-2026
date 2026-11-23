import { PROJECT_IDS } from "@/content/projects";
import { circlePath, gearPath, PLANETARY } from "@/lib/gearOutline";

/**
 * Static drawing of the planetary gearbox. Stands in for the 3D canvas until
 * it loads (and if WebGL is unavailable). Decorative: everything it says is
 * also in the page text.
 */

const { sun, planet, ring, centreDistance, planetAngles, ringOuterRadius, carrierRadius } =
  PLANETARY;

const sunPath = gearPath(sun);
const planetPath = gearPath(planet);
const ringPath = `${circlePath(ringOuterRadius)} ${gearPath(ring)}`;
const sunBody = `${sunPath} ${circlePath(2.6)}`;
const planetBody = `${planetPath} ${circlePath(1.5)}`;

const planetCentres = planetAngles.map(
  (a) => [centreDistance * Math.cos(a), centreDistance * Math.sin(a)] as const,
);

// 7 project segments marked on the ring face, starting at 12 o'clock.
const segments = PROJECT_IDS.map((id, i) => {
  const a = (i / PROJECT_IDS.length) * 2 * Math.PI - Math.PI / 2;
  const label = a + 0.2;
  return {
    id,
    n: String(i).padStart(2, "0"),
    tick: [
      [26 * Math.cos(a), 26 * Math.sin(a)],
      [28.2 * Math.cos(a), 28.2 * Math.sin(a)],
    ] as const,
    label: [26.9 * Math.cos(label), 26.9 * Math.sin(label)] as const,
    rotate: (label * 180) / Math.PI + 90,
  };
});

const boltAngles = [45, 135, 225, 315].map((d) => (d * Math.PI) / 180);

function Hex({ x, y, r }: { x: number; y: number; r: number }) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    return `${(x + r * Math.cos(a)).toFixed(3)},${(y + r * Math.sin(a)).toFixed(3)}`;
  }).join(" ");
  return <polygon points={pts} />;
}

export function GearboxPoster({
  variant = "machined",
  className = "",
}: {
  variant?: "machined" | "blueprint";
  className?: string;
}) {
  const blueprint = variant === "blueprint";
  const id = (name: string) => `gbx-${variant}-${name}`;
  const line = { fill: "none", stroke: "var(--brass)", strokeWidth: 0.14 } as const;

  return (
    <svg
      viewBox="-31 -31 62 62"
      aria-hidden="true"
      focusable="false"
      className={className}
      fillRule="evenodd"
    >
      {blueprint ? null : (
        <defs>
          <linearGradient id={id("steel")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8a9096" />
            <stop offset="0.45" stopColor="#4a4f55" />
            <stop offset="1" stopColor="#2a2e32" />
          </linearGradient>
          <linearGradient id={id("ring")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b3f44" />
            <stop offset="0.5" stopColor="#24272b" />
            <stop offset="1" stopColor="#141618" />
          </linearGradient>
          <radialGradient id={id("brass")} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#e6c886" />
            <stop offset="0.45" stopColor="#b8913f" />
            <stop offset="1" stopColor="#6e5422" />
          </radialGradient>
          <linearGradient id={id("temper")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d8b56a" />
            <stop offset="0.35" stopColor="#a8673a" />
            <stop offset="0.7" stopColor="#6b4a8c" />
            <stop offset="1" stopColor="#3d6a9e" />
          </linearGradient>
        </defs>
      )}

      {/* Carrier plate behind, with a knurled rim and hex bolts. */}
      <g>
        <circle
          r={carrierRadius}
          {...(blueprint ? line : { fill: "#191b1e", stroke: "#2f3337", strokeWidth: 0.25 })}
        />
        <circle
          r={carrierRadius - 0.5}
          fill="none"
          stroke={blueprint ? "var(--brass)" : "#3a3e43"}
          strokeWidth={blueprint ? 0.1 : 0.5}
          strokeDasharray="0.3 0.3"
        />
        <g
          {...(blueprint
            ? line
            : { fill: "#2c3034", stroke: "#4a4f55", strokeWidth: 0.12 })}
        >
          {boltAngles.map((a) => (
            <Hex key={a} x={14 * Math.cos(a)} y={14 * Math.sin(a)} r={1.1} />
          ))}
        </g>
      </g>

      {/* Ring gear (fixed), with 7 project segments. */}
      <path
        d={ringPath}
        {...(blueprint
          ? line
          : { fill: `url(#${id("ring")})`, stroke: "#3a3e43", strokeWidth: 0.12 })}
      />
      <g
        stroke={blueprint ? "var(--brass)" : "#8a9096"}
        strokeWidth={0.12}
        opacity={blueprint ? 1 : 0.8}
      >
        {segments.map((s) => (
          <line key={s.id} x1={s.tick[0][0]} y1={s.tick[0][1]} x2={s.tick[1][0]} y2={s.tick[1][1]} />
        ))}
      </g>
      <g
        fill={blueprint ? "var(--brass)" : "#9a9fa5"}
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize="1.05"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {segments.map((s) => (
          <text
            key={s.id}
            transform={`translate(${s.label[0].toFixed(3)} ${s.label[1].toFixed(3)}) rotate(${s.rotate.toFixed(2)})`}
          >
            {s.n}
          </text>
        ))}
      </g>

      {/* Planets: machined steel, each on a pin. */}
      {planetCentres.map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x.toFixed(3)} ${y.toFixed(3)})`}>
          <path
            d={planetBody}
            {...(blueprint
              ? line
              : { fill: `url(#${id("steel")})`, stroke: `url(#${id("temper")})`, strokeWidth: 0.12 })}
          />
          <circle r={3.2} fill="none" stroke={blueprint ? "var(--brass)" : "#2a2e32"} strokeWidth={0.12} />
          <g {...(blueprint ? line : { fill: "#5b6066", stroke: "#2a2e32", strokeWidth: 0.1 })}>
            <Hex x={0} y={0} r={1.1} />
          </g>
        </g>
      ))}

      {/* Sun gear: brass, engraved EPH 2:8. */}
      <g>
        <path
          d={sunBody}
          {...(blueprint
            ? line
            : { fill: `url(#${id("brass")})`, stroke: "#6e5422", strokeWidth: 0.12 })}
        />
        <rect
          x={-0.55}
          y={-3.6}
          width={1.1}
          height={1.2}
          {...(blueprint ? line : { fill: "#0f1011" })}
        />
        <circle r={7.6} fill="none" stroke={blueprint ? "var(--brass)" : "#8c6b32"} strokeWidth={0.1} />
        <text
          y={5.3}
          fill={blueprint ? "var(--brass)" : "#6e5422"}
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize="1.5"
          fontWeight={500}
          letterSpacing="0.12"
          textAnchor="middle"
        >
          EPH 2:8
        </text>
      </g>

      {blueprint ? (
        <g fill="none" stroke="var(--concrete)" strokeWidth={0.08}>
          {/* Dash-dot centre lines. */}
          <g strokeDasharray="2 0.6 0.3 0.6" opacity={0.8}>
            <line x1={-30.5} y1={0} x2={30.5} y2={0} />
            <line x1={0} y1={-30.5} x2={0} y2={30.5} />
          </g>
          {/* Ø48 across the ring pitch circle. */}
          <circle r={24} strokeDasharray="0.6 0.4" opacity={0.6} />
          <line x1={-24} y1={-24} x2={-24} y2={-29.6} />
          <line x1={24} y1={-24} x2={24} y2={-29.6} />
          <line x1={-23.6} y1={-29} x2={23.6} y2={-29} />
          <path d="M-24 -29 l1.2 -0.4 v0.8 Z M24 -29 l-1.2 -0.4 v0.8 Z" fill="var(--concrete)" />
          <text
            x={0}
            y={-29.6}
            fill="var(--concrete)"
            stroke="none"
            fontFamily="var(--font-jetbrains-mono), monospace"
            fontSize="1.4"
            textAnchor="middle"
          >
            Ø48
          </text>
          {/* Z=24 leader to the sun. */}
          <circle cx={7.4} cy={-7.4} r={0.35} fill="var(--concrete)" />
          <polyline points="7.4,-7.4 11.5,-11.5 15.5,-11.5" />
          <text
            x={15.8}
            y={-11.1}
            fill="var(--concrete)"
            stroke="none"
            fontFamily="var(--font-jetbrains-mono), monospace"
            fontSize="1.4"
          >
            Z=24
          </text>
        </g>
      ) : null}
    </svg>
  );
}
