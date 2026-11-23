import { site } from "@/content/site";

/** Stamped steel nameplate, riveted to the hero like a machine's ID plate. */
export function DataPlate() {
  return (
    <div className="data-plate max-w-lg px-6 py-5 sm:px-8 sm:py-6">
      <span className="hex-screw top-2 left-2" aria-hidden="true" />
      <span className="hex-screw top-2 right-2" aria-hidden="true" />
      <span className="hex-screw bottom-2 left-2" aria-hidden="true" />
      <span className="hex-screw right-2 bottom-2" aria-hidden="true" />

      <p className="data-plate__engraved eyebrow mb-3 font-medium">Data plate</p>
      <div className="data-plate__rule mb-3" aria-hidden="true" />
      <dl className="data-plate__engraved grid grid-cols-[5.25rem_1fr] sm:grid-cols-[6rem_1fr] gap-x-4 gap-y-1.5 font-mono text-[0.78rem] leading-snug uppercase tracking-[0.06em] sm:text-[0.8125rem]">
        {site.dataPlate.map((row) => (
          <div key={row.field} className="contents">
            <dt>{row.field}</dt>
            <dd className="flex items-center gap-2 font-medium">
              {"lamp" in row && row.lamp ? <span className="status-lamp" aria-hidden="true" /> : null}
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
