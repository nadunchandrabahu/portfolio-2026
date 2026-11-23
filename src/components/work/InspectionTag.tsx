/** QC tag at the foot of a project card: the measured result. */
export function InspectionTag({ result }: { result: string }) {
  return (
    <div className="inspection-tag py-3 pr-10 pl-4">
      <p className="eyebrow text-concrete">Result</p>
      <p className="mt-1 font-mono text-small leading-snug text-brass">{result}</p>
    </div>
  );
}
