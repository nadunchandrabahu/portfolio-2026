/** Knurled cross-hatch strip: under the nav and above the footer only. */
export function KnurlDivider({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`knurl ${className}`} />;
}
