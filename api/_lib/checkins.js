import { STATUS, MAX_NOTE_LENGTH, TRIGGER_TAGS, USER_IDS, COMPETITION_START } from '../../shared/constants.js';
import { deriveCheckinContext, isEligibleCheckinDate, allCompetitionDates, getServerNow } from './time.js';
import { existsKey, putJson, listJson } from './store.js';

const checkinKey = (userId, date) => `checkins/${userId}/${date}.json`;

export class CheckinError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * The single place that writes a check-in, for both the web endpoint and the Telegram
 * webhook. Every honesty rule lives here: server-derived date only (today or yesterday,
 * never client-chosen), immutable once written (checked here, then backstopped by
 * store.js's allowOverwrite:false).
 */
export async function recordCheckin({ userId, status, date, note, trigger, source, now = getServerNow() }) {
  if (!USER_IDS.includes(userId)) {
    throw new CheckinError(400, 'invalid_user', 'Usuario inválido.');
  }
  if (![STATUS.CLEAN, STATUS.RELAPSE].includes(status)) {
    throw new CheckinError(400, 'invalid_status', 'Estado inválido.');
  }

  const ctx = deriveCheckinContext(now);
  const targetDate = date || ctx.calendarDate;
  if (!isEligibleCheckinDate(targetDate, ctx)) {
    throw new CheckinError(403, 'invalid_date', 'Solo puedes marcar el día de hoy o el de ayer.');
  }

  const key = checkinKey(userId, targetDate);
  if (await existsKey(key)) {
    throw new CheckinError(409, 'already_recorded', 'Ya registraste ese día.');
  }

  const record = {
    user: userId,
    date: targetDate,
    status,
    note: status === STATUS.RELAPSE && note ? String(note).slice(0, MAX_NOTE_LENGTH) : null,
    trigger: status === STATUS.RELAPSE && TRIGGER_TAGS.includes(trigger) ? trigger : null,
    source,
    createdAt: new Date().toISOString(),
  };

  try {
    await putJson(key, record);
  } catch {
    // Someone else won the race between our existsKey check and this write.
    throw new CheckinError(409, 'already_recorded', 'Ya registraste ese día.');
  }

  return record;
}

export async function getUserRecords(userId) {
  const records = await listJson(`checkins/${userId}/`);
  return records.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Resolves which date a dateless check-in (a Telegram button tap, which carries no date)
 * should target: yesterday first if it's still unmarked — most likely what a forgotten
 * check-in means — otherwise today. Returns null once both are already recorded.
 */
export async function resolvePendingDate(userId, now = getServerNow()) {
  const ctx = deriveCheckinContext(now);

  if (ctx.yesterday >= COMPETITION_START && !(await existsKey(checkinKey(userId, ctx.yesterday)))) {
    return ctx.yesterday;
  }
  if (ctx.withinCompetition && !(await existsKey(checkinKey(userId, ctx.calendarDate)))) {
    return ctx.calendarDate;
  }
  return null;
}

/**
 * Closes the books on any date older than yesterday with no check-in. This is bookkeeping
 * only, never a penalty: totalClean already only counts STATUS.CLEAN days, so a day nobody
 * marked simply doesn't add to your count — it was never a "sin", it just quietly doesn't
 * count in your favor.
 */
export async function sweepUnreported(now = getServerNow()) {
  const ctx = deriveCheckinContext(now);
  const swept = [];

  for (const userId of USER_IDS) {
    const existing = await getUserRecords(userId);
    const known = new Set(existing.map((r) => r.date));

    for (const date of allCompetitionDates()) {
      if (date >= ctx.yesterday) continue; // still eligible to be marked
      if (known.has(date)) continue;

      const record = {
        user: userId,
        date,
        status: STATUS.NO_REPORTADO,
        note: null,
        trigger: null,
        source: 'cron',
        createdAt: new Date().toISOString(),
      };
      try {
        await putJson(checkinKey(userId, date), record);
        swept.push(record);
      } catch {
        // Already written (e.g. by a concurrent tick) — fine.
      }
    }
  }

  return swept;
}
