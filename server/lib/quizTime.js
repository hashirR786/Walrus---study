// Every date in the daily quiz is reckoned in IST, so "today" and "this week"
// mean the same thing for every student regardless of where the server runs.
// Weeks run Monday to Sunday.

const IST_OFFSET_MINUTES = 5 * 60 + 30;

// A Date shifted into IST, so the UTC getters read as IST wall-clock values.
const toIst = (date = new Date()) =>
  new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);

const pad = (n) => String(n).padStart(2, '0');

// YYYY-MM-DD for the IST calendar day.
export const istDateKey = (date = new Date()) => {
  const d = toIst(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

// The Monday of the IST week containing `date`, as YYYY-MM-DD.
export const istWeekStart = (date = new Date()) => {
  const d = toIst(date);
  // getUTCDay: 0=Sunday. Shift so Monday is 0.
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

// All seven YYYY-MM-DD keys of the week starting at `weekStart`.
export const weekDateKeys = (weekStart) => {
  const [y, m, d] = weekStart.split('-').map(Number);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(Date.UTC(y, m - 1, d + i));
    out.push(`${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`);
  }
  return out;
};

export const previousWeekStart = (weekStart) => {
  const [y, m, d] = weekStart.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d - 7));
  return `${prev.getUTCFullYear()}-${pad(prev.getUTCMonth() + 1)}-${pad(prev.getUTCDate())}`;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Describes a week the way a badge should read it: "Week 3 of November 2026".
// The week belongs to the month its Monday falls in, so a week straddling two
// months is not counted twice.
export const describeWeek = (weekStart) => {
  const [y, m, d] = weekStart.split('-').map(Number);
  const weekOfMonth = Math.floor((d - 1) / 7) + 1;
  const keys = weekDateKeys(weekStart);
  return {
    year: y,
    month: m,
    monthName: MONTHS[m - 1],
    weekOfMonth,
    weekStart,
    weekEnd: keys[6],
    label: `Week ${weekOfMonth} of ${MONTHS[m - 1]} ${y}`,
  };
};
