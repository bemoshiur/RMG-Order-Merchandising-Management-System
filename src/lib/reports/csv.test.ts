import { describe, it, expect } from "vitest";
import { escapeCsvCell } from "./csv";

describe("escapeCsvCell", () => {
  it("neutralizes spreadsheet formula injection (leading = + - @ tab)", () => {
    expect(escapeCsvCell("=HYPERLINK(\"http://evil\")")).toBe("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(escapeCsvCell("+cmd|'/c calc'!A1")).toBe("'+cmd|'/c calc'!A1");
    expect(escapeCsvCell("@SUM(1)")).toBe("'@SUM(1)");
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
    expect(escapeCsvCell("\tfoo")).toBe("'\tfoo");
  });

  it("leaves legitimate numbers and plain text intact", () => {
    expect(escapeCsvCell(-100)).toBe("-100"); // real negative number, not a formula
    expect(escapeCsvCell("-100")).toBe("-100");
    expect(escapeCsvCell(1234.5)).toBe("1234.5");
    expect(escapeCsvCell("Green Life/TTF")).toBe("Green Life/TTF");
    expect(escapeCsvCell("")).toBe("");
  });

  it("still quotes cells with commas, quotes or newlines", () => {
    expect(escapeCsvCell("a,b")).toBe("\"a,b\"");
    expect(escapeCsvCell("say \"hi\"")).toBe("\"say \"\"hi\"\"\"");
    expect(escapeCsvCell("line1\nline2")).toBe("\"line1\nline2\"");
  });
});
