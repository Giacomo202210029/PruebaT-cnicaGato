import { TIMEZONE, COMPETITION_START, COMPETITION_END } from '../../shared/constants.js';

function shiftDate(dateStr, deltaDays) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

/** Wall-clock calendar date in TIMEZONE for a given instant — the server's own idea of
 * "today", never the client's. */
function zonedDate(now) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function getServerNow() {
  return new Date();
}

/**
 * Everything a check-in write needs to know, derived purely from the server clock —
 * never from anything the client sends. `now` is injectable for testing.
 */
export function deriveCheckinContext(now = getServerNow()) {
  const calendarDate = zonedDate(now);
  const yesterday = shiftDate(calendarDate, -1);
  const withinCompetition = calendarDate >= COMPETITION_START && calendarDate <= COMPETITION_END;

  return {
    serverNow: now.toISOString(),
    calendarDate,
    yesterday,
    withinCompetition,
  };
}

/**
 * A date can be marked only if it's today or yesterday (server-derived) and falls inside
 * the competition — no hard time-of-day window, but no back-dating beyond one day either.
 */
export function isEligibleCheckinDate(date, ctx) {
  if (date !== ctx.calendarDate && date !== ctx.yesterday) return false;
  return date >= COMPETITION_START && date <= COMPETITION_END;
}

export function competitionEnded(now = getServerNow()) {
  return deriveCheckinContext(now).calendarDate > COMPETITION_END;
}

export function allCompetitionDates() {
  const dates = [];
  let cursor = COMPETITION_START;
  while (cursor <= COMPETITION_END) {
    dates.push(cursor);
    cursor = shiftDate(cursor, 1);
  }
  return dates;
}
