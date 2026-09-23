import { STATUS } from './constants.js';

function addDaysUTC(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * records: array of { date: 'YYYY-MM-DD', status }.
 * Consecutive clean days ending at the most recently recorded date.
 * A missing date (not yet reported) breaks the streak just like a relapse would.
 */
export function currentStreak(records) {
  if (records.length === 0) return 0;
  const byDate = new Map(records.map((r) => [r.date, r.status]));
  let cursor = [...byDate.keys()].sort().at(-1);
  let streak = 0;
  while (byDate.get(cursor) === STATUS.CLEAN) {
    streak++;
    cursor = addDaysUTC(cursor, -1);
  }
  return streak;
}

/** Longest run of calendar-consecutive clean days anywhere in the records. */
export function longestStreak(records) {
  const cleanDates = records
    .filter((r) => r.status === STATUS.CLEAN)
    .map((r) => r.date)
    .sort();

  let longest = 0;
  let current = 0;
  let prev = null;
  for (const date of cleanDates) {
    current = prev !== null && addDaysUTC(prev, 1) === date ? current + 1 : 1;
    longest = Math.max(longest, current);
    prev = date;
  }
  return longest;
}

export function totalClean(records) {
  return records.filter((r) => r.status === STATUS.CLEAN).length;
}

export function unlockedMilestones(total, milestones) {
  return milestones.filter((m) => total >= m);
}

/** Ranks by total clean days first (the real win condition), longest streak as tiebreak. */
export function rankUsers(usersStats) {
  return [...usersStats].sort(
    (a, b) =>
      b.totalClean - a.totalClean ||
      b.longestStreak - a.longestStreak ||
      b.currentStreak - a.currentStreak,
  );
}
