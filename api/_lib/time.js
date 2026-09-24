import {
  TIMEZONE,
  WINDOW_START_HOUR,
  WINDOW_END_HOUR,
  COMPETITION_START,
  COMPETITION_END,
} from '../../shared/constants.js';

function shiftDate(dateStr, deltaDays) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Wall-clock date/time in TIMEZONE for a given instant, independent of the server's own TZ. */
function zonedParts(now) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // Some ICU builds render midnight as "24" under hour12:false.
    hour: parts.hour === '24' ? 0 : Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function getServerNow() {
  return new Date();
}

/**
 * Everything a check-in write needs to know, derived purely from the server clock —
 * never from anything the client sends. `now` is injectable for testing.
 */
export function deriveCheckinContext(now = getServerNow()) {
  const { year, month, day, hour, minute } = zonedParts(now);
  const calendarDate = `${year}-${pad(month)}-${pad(day)}`;

  const isWithinWindow = hour >= WINDOW_START_HOUR || hour < WINDOW_END_HOUR;

  // 18:00–23:59 -> tonight's date. 00:00–03:59 -> still last night's date. Otherwise irrelevant
  // (writes are rejected anyway), but a same-as-calendarDate value keeps sweep math correct too:
  // during the day, "targetDate" naturally becomes the boundary before which every night is closed.
  const targetDate = hour >= WINDOW_START_HOUR ? calendarDate : hour < WINDOW_END_HOUR ? shiftDate(calendarDate, -1) : calendarDate;

  let minutesUntilClose = null;
  if (isWithinWindow) {
    const minutesIntoDay = hour * 60 + minute;
    const windowEndMinutes = WINDOW_END_HOUR * 60;
    minutesUntilClose =
      hour >= WINDOW_START_HOUR ? 24 * 60 - minutesIntoDay + windowEndMinutes : windowEndMinutes - minutesIntoDay;
  }

  const withinCompetition = targetDate >= COMPETITION_START && targetDate <= COMPETITION_END;

  return {
    serverNow: now.toISOString(),
    calendarDate,
    targetDate,
    isWithinWindow,
    withinCompetition,
    minutesUntilClose,
  };
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
