const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-04" → "Apr 2026". Returns the input unchanged if it isn't yyyy-mm. */
export function formatMonth(iso: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : iso;
}

export function formatRange(start: string, end: string): string {
  return `${formatMonth(start)} – ${end === "present" ? "Present" : formatMonth(end)}`;
}
