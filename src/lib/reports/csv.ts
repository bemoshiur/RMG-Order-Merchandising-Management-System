/**
 * Escape one CSV cell. Two concerns:
 *  1. CSV-injection: a cell that begins with = + - @ (or a tab/CR) is interpreted as a FORMULA by
 *     Excel/Google Sheets, so user-controlled text like `=HYPERLINK(...)` or `=cmd|'/c calc'!A1`
 *     would execute on open. Prefix such NON-numeric cells with an apostrophe so they render as
 *     text. Genuine numbers (incl. negatives) are left untouched.
 *  2. Standard quoting for commas / quotes / newlines.
 */
export function escapeCsvCell(v: string | number): string {
  let s = String(v ?? "");
  const looksLikeFormula = /^[=+\-@\t\r]/.test(s);
  const isNumber = s !== "" && Number.isFinite(Number(s));
  if (looksLikeFormula && !isNumber) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
