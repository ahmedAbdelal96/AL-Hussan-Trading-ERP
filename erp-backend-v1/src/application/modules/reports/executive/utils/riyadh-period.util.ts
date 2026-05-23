/**
 * Riyadh time utilities used by executive reports period resolution.
 *
 * We normalize all generated date windows to Asia/Riyadh local boundaries,
 * then convert those boundaries to UTC instants for database filtering.
 */

export const RIYADH_TIMEZONE = 'Asia/Riyadh';
const RIYADH_UTC_OFFSET_HOURS = 3;

type RiyadhDateParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
};

export const getRiyadhDateParts = (
  date: Date = new Date(),
): RiyadhDateParts => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: RIYADH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);

  return { year, month, day };
};

export const getDaysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/**
 * Converts a local Riyadh date-time into a UTC Date object.
 */
export const toUtcFromRiyadh = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
): Date =>
  new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      hour - RIYADH_UTC_OFFSET_HOURS,
      minute,
      second,
      millisecond,
    ),
  );

export const getRiyadhMonthRange = (
  year: number,
  month: number,
): { start: Date; end: Date } => ({
  start: toUtcFromRiyadh(year, month, 1, 0, 0, 0, 0),
  end: toUtcFromRiyadh(
    year,
    month,
    getDaysInMonth(year, month),
    23,
    59,
    59,
    999,
  ),
});

export const getRiyadhYearRange = (
  year: number,
): { start: Date; end: Date } => ({
  start: toUtcFromRiyadh(year, 1, 1, 0, 0, 0, 0),
  end: toUtcFromRiyadh(year, 12, 31, 23, 59, 59, 999),
});

export const getRiyadhQuarterFromMonth = (month: number): number =>
  Math.floor((month - 1) / 3) + 1;

export const getRiyadhQuarterRange = (
  year: number,
  quarter: number,
): { start: Date; end: Date } => {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  return {
    start: toUtcFromRiyadh(year, startMonth, 1, 0, 0, 0, 0),
    end: toUtcFromRiyadh(
      year,
      endMonth,
      getDaysInMonth(year, endMonth),
      23,
      59,
      59,
      999,
    ),
  };
};
