/**
 * Brazilian national holidays (client-side mirror of server utility).
 */
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
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86_400_000);
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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

export function isHoliday(dateStr) {
  const year = parseInt(dateStr.split('-')[0], 10);
  const holidays = getBrazilianHolidays(year);
  return holidays.find((h) => h.date === dateStr) ?? null;
}

/** Returns all Fridays of a given month as 'YYYY-MM-DD' strings */
export function getFridaysOfMonth(year, month) {
  const fridays = [];
  const d = new Date(year, month - 1, 1);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  while (d.getMonth() === month - 1) {
    fridays.push(toISO(new Date(d)));
    d.setDate(d.getDate() + 7);
  }
  return fridays;
}

/** Returns the next Friday date string (today if today is Friday) */
export function getNextFriday() {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 5 ? 0 : (5 - day + 7) % 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return toISO(next);
}

/** Format a 'YYYY-MM-DD' string to Portuguese long format */
export function formatDatePT(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/** Format a 'YYYY-MM-DD' string to short Brazilian format */
export function formatDateShortPT(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const HOURLY_RATE = 90;      // R$/h
const DURATION_HOURS = 2;    // 2h por jogo (22h-00h)
const MAX_PLAYERS = 18;
const AVULSO_PRICE = 10;     // R$ por jogo avulso

/**
 * Calculates the financial values for a given month based on its number of Fridays.
 * @param {number} year
 * @param {number} month – 1-based
 */
export function calcMonthlyValues(year, month) {
  const numFridays = getFridaysOfMonth(year, month).length;
  const totalCost = numFridays * HOURLY_RATE * DURATION_HOURS;
  const pricePerPerson = Math.round(totalCost / MAX_PLAYERS);
  return { numFridays, totalCost, pricePerPerson, hourlyRate: HOURLY_RATE, durationHours: DURATION_HOURS, maxPlayers: MAX_PLAYERS, avulsoPrice: AVULSO_PRICE };
}
