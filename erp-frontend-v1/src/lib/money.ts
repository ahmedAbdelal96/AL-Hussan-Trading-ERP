/**
 * Money Utilities
 *
 * Centralized helpers for parsing, rounding, and calculating monetary values
 * using integer minor units (cents) to avoid floating-point precision errors.
 *
 * Design decisions:
 * - Keep UI inputs as strings and parse them safely here.
 * - Convert to minor units for arithmetic to avoid IEEE-754 issues.
 * - Round explicitly to the desired number of decimals (default 2).
 */

import { CURRENCY, getCurrentLocale } from "@/config/system.constants";

export const DEFAULT_DECIMALS = 2;

/**
 * Normalize localized numeric input to ASCII digits and decimal point.
 * Supports Arabic-Indic and Eastern Arabic-Indic numerals and separators.
 */
export const normalizeLocalizedNumberInput = (value: string): string => {
  if (!value) return "";

  return value
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\u066b/g, ".")
    .replace(/\u066c/g, "")
    .replace(/,/g, "");
};

/**
 * Safely round a monetary value to the required decimals.
 */
export const roundMoney = (
  amount: number,
  decimals: number = DEFAULT_DECIMALS,
): number => {
  if (!Number.isFinite(amount)) return 0;
  const factor = 10 ** decimals;
  return Math.round(amount * factor) / factor;
};

/**
 * Convert a decimal amount to minor units (e.g., cents).
 * Always rounds before converting to avoid off-by-one issues.
 */
export const toMinorUnits = (
  amount: number,
  decimals: number = DEFAULT_DECIMALS,
): number => {
  if (!Number.isFinite(amount)) return 0;
  const factor = 10 ** decimals;
  return Math.round(roundMoney(amount, decimals) * factor);
};

/**
 * Convert minor units (e.g., cents) back to a decimal amount.
 */
export const fromMinorUnits = (
  minorUnits: number,
  decimals: number = DEFAULT_DECIMALS,
): number => {
  if (!Number.isFinite(minorUnits)) return 0;
  const factor = 10 ** decimals;
  return minorUnits / factor;
};

/**
 * Parse user input into a monetary number safely.
 * - Removes non-numeric characters (except the decimal separator).
 * - Handles multiple decimal separators by keeping the first.
 * - Returns 0 for empty/invalid input.
 */
export const parseMoneyInput = (
  value: string,
  decimals: number = DEFAULT_DECIMALS,
): number => {
  if (!value) return 0;

  const normalizedValue = normalizeLocalizedNumberInput(value);

  // Keep digits and decimal separator only
  const sanitized = normalizedValue.replace(/[^\d.-]/g, "");
  if (!sanitized) return 0;

  const isNegative = sanitized.startsWith("-");
  const unsigned = isNegative ? sanitized.slice(1) : sanitized;

  // If multiple decimals are entered, keep the first and merge the rest
  const [integerPart, ...fractionParts] = unsigned.split(".");
  const normalized =
    fractionParts.length > 0
      ? `${integerPart}.${fractionParts.join("")}`
      : integerPart;

  const parsed = Number.parseFloat(`${isNegative ? "-" : ""}${normalized}`);
  if (Number.isNaN(parsed)) return 0;

  return roundMoney(parsed, decimals);
};

/**
 * Parse integer input safely (e.g. installments), supporting localized digits.
 */
export const parseIntegerInput = (value: string): number => {
  const normalized = normalizeLocalizedNumberInput(value).replace(
    /[^\d-]/g,
    "",
  );
  if (!normalized || normalized === "-") return 0;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Safe addition for monetary values using minor units.
 */
export const addMoney = (
  amounts: number[],
  decimals: number = DEFAULT_DECIMALS,
): number => {
  const totalMinor = amounts.reduce(
    (sum, amount) => sum + toMinorUnits(amount, decimals),
    0,
  );
  return fromMinorUnits(totalMinor, decimals);
};

/**
 * Safe subtraction for monetary values using minor units.
 */
export const subtractMoney = (
  minuend: number,
  subtrahend: number,
  decimals: number = DEFAULT_DECIMALS,
): number => {
  const resultMinor =
    toMinorUnits(minuend, decimals) - toMinorUnits(subtrahend, decimals);
  return fromMinorUnits(resultMinor, decimals);
};

/**
 * Multiply a monetary value by a scalar, rounded to desired decimals.
 */
export const multiplyMoney = (
  amount: number,
  multiplier: number,
  decimals: number = DEFAULT_DECIMALS,
): number => {
  if (!Number.isFinite(amount) || !Number.isFinite(multiplier)) return 0;
  return roundMoney(amount * multiplier, decimals);
};

/**
 * Format a monetary value with Intl.NumberFormat and fixed decimals.
 */
export const formatMoney = (
  amount: number,
  _currency: string = CURRENCY.DEFAULT,
  locale?: string,
  decimals: number = DEFAULT_DECIMALS,
): string => {
  const rounded = roundMoney(amount, decimals);
  const activeLocale = locale || getCurrentLocale();
  return new Intl.NumberFormat(activeLocale, {
    style: "currency",
    currency: CURRENCY.DEFAULT,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rounded);
};
