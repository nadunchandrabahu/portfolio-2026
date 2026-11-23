/**
 * A fact we don't have yet (CLAUDE.md rule 0.1). Pending values render as a
 * visible "TODO(nadun)" note in development and are dropped in production.
 * The knowledge-file build (section 8.7) skips them too.
 */
export type Pending = { readonly pending: true; readonly note: string };

export const pending = (note: string): Pending => ({ pending: true, note });

export const isPending = (value: unknown): value is Pending =>
  typeof value === "object" && value !== null && (value as Pending).pending === true;

/** Keep only confirmed values. */
export const confirmed = <T>(values: readonly (T | Pending)[]): T[] =>
  values.filter((value): value is T => !isPending(value));

export const SHOW_PLACEHOLDERS = process.env.NODE_ENV !== "production";

export type ExternalLink = { label: string; href: string };
