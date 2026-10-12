/**
 * Finds cooking durations ("5 minutes", "4–5 Minuten", "1½ hours") in a step's
 * plain text so they can become tappable timer chips: the fallback for steps
 * without a valid annotation. German and English, digits only (no word
 * numbers). A scan never overrides an annotation. Port of the iOS
 * `StepDurationScanner`.
 */

/** One detected duration and where it sits in the step text (UTF-16 indices). */
export type DurationMatch = {
  start: number;
  end: number;
  /** The low end of a range like "4–5 min". */
  seconds: number;
  /** The high end of a range, else null. */
  secondsMax: number | null;
  /** The matched text verbatim, the chip's visible label. */
  text: string;
};

// A number token: integer, decimal (`.`/`,`), a unicode or ASCII fraction, or
// an integer followed by one ("1½", "1 1/2").
const NUMBER = String.raw`(?:\d+\s+\d+/\d+|\d+/\d+|\d+(?:[.,]\d+)?\s*[½¼¾⅓⅔⅕]?|[½¼¾⅓⅔⅕])`;

// `value (– value2)? unit`, unit not followed by another letter (so "minute"
// can't steal "Minuten", and "Std." keeps its period).
const PATTERN = new RegExp(
  `(?<value>${NUMBER})` +
    `(?:\\s*(?:-|–|—|to|bis)\\s*(?<value2>${NUMBER}))?` +
    `\\s*` +
    `(?<unit>hours|hour|hrs|hr|stunden|stunde|std\\.?|minutes|minute|minuten|mins|min\\.?|seconds|second|secs|sec\\.?|sekunden|sekunde|sek\\.?|h)` +
    `(?![\\p{L}])`,
  "giu"
);

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅕": 0.2,
};

function decimal(s: string): number | null {
  const value = Number(s.replace(",", "."));
  return s.length > 0 && Number.isFinite(value) ? value : null;
}

function asciiFraction(s: string): number | null {
  const parts = s.split("/");
  if (parts.length !== 2) return null;
  const num = Number(parts[0]);
  const den = Number(parts[1]);
  return Number.isFinite(num) && Number.isFinite(den) && den !== 0 ? num / den : null;
}

/** Parses a matched number token ("1½", "1 1/2", "2,5") into its value. */
export function parseDurationValue(raw: string): number | null {
  const s = raw.trim();
  if (s.length === 0) return null;
  const last = s[s.length - 1];
  const fraction = UNICODE_FRACTIONS[last];
  if (fraction !== undefined) {
    const intPart = s.slice(0, -1).trim();
    if (intPart.length === 0) return fraction;
    const whole = decimal(intPart);
    return whole === null ? null : whole + fraction;
  }
  if (s.includes("/")) {
    const parts = s.split(/\s+/);
    if (parts.length === 2) {
      const whole = decimal(parts[0]);
      const frac = asciiFraction(parts[1]);
      return whole === null || frac === null ? null : whole + frac;
    }
    return parts.length === 1 ? asciiFraction(s) : null;
  }
  return decimal(s);
}

/** Seconds per unit of the matched unit token. */
export function unitSeconds(unit: string): number {
  const u = unit.toLowerCase().replace(".", "");
  if (u === "h" || u.startsWith("hr") || u.startsWith("hour") || u.startsWith("std") || u.startsWith("stund")) {
    return 3600;
  }
  if (u.startsWith("min")) return 60;
  return 1;
}

/** Every duration in `text`, in reading order, non-overlapping. */
export function scanDurations(text: string): DurationMatch[] {
  const matches: DurationMatch[] = [];
  for (const match of text.matchAll(PATTERN)) {
    const groups = match.groups ?? {};
    const low = groups.value === undefined ? null : parseDurationValue(groups.value);
    if (low === null) continue;
    const multiplier = unitSeconds(groups.unit ?? "");
    const seconds = Math.round(low * multiplier);
    if (seconds <= 0) continue;
    let secondsMax: number | null = null;
    const high = groups.value2 === undefined ? null : parseDurationValue(groups.value2);
    if (high !== null) {
      const max = Math.round(high * multiplier);
      if (max > seconds) secondsMax = max;
    }
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      seconds,
      secondsMax,
      text: match[0],
    });
  }
  return matches;
}
