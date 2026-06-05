/**
 * Brazilian national holidays calculator.
 * Includes fixed holidays and Easter-based moveable holidays.
 */

// Meeus/Jones/Butcher algorithm for Easter Sunday (UTC)
function easterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86_400_000);
}

function toISO(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns all Brazilian national holidays for a given year.
 * @param {number} year
 * @returns {Array<{date: string, name: string}>} – date in 'YYYY-MM-DD'
 */
export function getBrazilianHolidays(year) {
  const easter = easterDate(year);
  const goodFriday = addDays(easter, -2);
  const corpusChristi = addDays(easter, 60);

  return [
    { date: `${year}-01-01`, name: 'Confraternização Universal' },
    { date: toISO(goodFriday), name: 'Sexta-feira Santa' },
    { date: `${year}-04-21`, name: 'Tiradentes' },
    { date: `${year}-05-01`, name: 'Dia do Trabalho' },
    { date: toISO(corpusChristi), name: 'Corpus Christi' },
    { date: `${year}-09-07`, name: 'Independência do Brasil' },
    { date: `${year}-10-12`, name: 'Nossa Senhora Aparecida' },
    { date: `${year}-11-02`, name: 'Finados' },
    { date: `${year}-11-15`, name: 'Proclamação da República' },
    { date: `${year}-11-20`, name: 'Consciência Negra' },
    { date: `${year}-12-25`, name: 'Natal' },
  ];
}

/**
 * Checks if a date string (YYYY-MM-DD) is a Brazilian national holiday.
 * @param {string} dateStr
 * @returns {{date: string, name: string} | null}
 */
export function isHoliday(dateStr) {
  const year = parseInt(dateStr.split('-')[0], 10);
  const holidays = getBrazilianHolidays(year);
  return holidays.find((h) => h.date === dateStr) ?? null;
}
