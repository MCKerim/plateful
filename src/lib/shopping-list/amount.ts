const DECIMAL = /^(\d+)[.,](\d+)$/;

/** Up to two decimals with the reader's separator, no grouping ("1,5" in German). */
export function formatQuantity(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(
    value
  );
}

function decimalSeparator(locale: string): string {
  return (
    new Intl.NumberFormat(locale).formatToParts(1.5).find((part) => part.type === "decimal")
      ?.value ?? "."
  );
}

function joined(quantity: string, unit: string | null): string {
  if (!unit) return quantity;
  return quantity ? `${quantity} ${unit}` : unit;
}

/**
 * `display` with the reader's decimal separator when it is a plain decimal that
 * is `value` written out, else null. Equal at the display's own precision,
 * because the parser stores "1/3" as "0.33" beside 0.3333…; "1.000" beside 1000
 * is thousands and stays.
 */
function localizedDecimal(display: string, value: number | null, locale: string): string | null {
  const match = value === null ? null : DECIMAL.exec(display);
  if (!match || value === null) return null;
  const [, whole, fraction] = match;
  const scale = 10 ** fraction.length;
  if (Math.round(Number(`${whole}.${fraction}`) * scale) !== Math.round(value * scale)) return null;
  return `${whole}${decimalSeparator(locale)}${fraction}`;
}

/**
 * The amount as a row shows it. The written display wins over the value and
 * stays as written ("1/2", "2-3", "etwas", the server's "500 g + 2 EL"), except
 * a display that is only the value as a decimal, which takes the reader's
 * separator so it reads like the summed amounts beside it.
 */
export function amountText(
  value: number | null,
  display: string | null,
  unit: string | null,
  locale: string
): string {
  let quantity = "";
  if (display) quantity = localizedDecimal(display, value, locale) ?? display;
  else if (value !== null) quantity = formatQuantity(value, locale);
  return joined(quantity, unit);
}

/**
 * The amount as the server writes it into mixed-unit text: the stored display
 * untouched and a bare value with a point. Only for mirroring that text, never
 * for display, or the row's text jumps when the server's answer lands.
 */
export function storedAmountText(
  value: number | null,
  display: string | null,
  unit: string | null
): string {
  let quantity = "";
  if (display) quantity = display;
  else if (value !== null) quantity = formatQuantity(value, "en");
  return joined(quantity, unit);
}
