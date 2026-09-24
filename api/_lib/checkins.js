import { STATUS, MAX_NOTE_LENGTH, TRIGGER_TAGS, USER_IDS } from '../../shared/constants.js';
import { deriveCheckinContext, allCompetitionDates, getServerNow } from './time.js';
import { existsKey, putJson, listJson } from './blob.js';

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
 * webhook. Every honesty rule lives here: night-window only, server-derived date,
 * immutable once written (checked here, then backstopped by blob.js's allowOverwrite:false).
 */
export async function recordCheckin({ userId, status, note, trigger, source, now = getServerNow() }) {
  if (!USER_IDS.includes(userId)) {
    throw new CheckinError(400, 'invalid_user', 'Usuario inválido.');
  }
  if (![STATUS.CLEAN, STATUS.RELAPSE].includes(status)) {
    throw new CheckinError(400, 'invalid_status', 'Estado inválido.');
  }

  const ctx = deriveCheckinContext(now);
  if (!ctx.isWithinWindow) {
    throw new CheckinError(403, 'window_closed', 'Solo se puede marcar de noche (18:00–04:00).');
  }
  if (!ctx.withinCompetition) {
    throw new CheckinError(403, 'outside_competition', 'La competencia no está activa en este momento.');
  }

  const key = checkinKey(userId, ctx.targetDate);
  if (await existsKey(key)) {
    throw new CheckinError(409, 'already_recorded', 'Ya registraste tu día de hoy.');
  }

  const record = {
    user: userId,
    date: ctx.targetDate,
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
    throw new CheckinError(409, 'already_recorded', 'Ya registraste tu día de hoy.');
  }

  return record;
}

export async function getUserRecords(userId) {
  const records = await listJson(`checkins/${userId}/`);
  return records.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Marks any past, fully-closed night with no check-in as "no_reportado" — silence never
 * escapes the honesty rules. Safe to call every cron tick: each write targets a key that
 * won't exist yet for a truly unreported day, and is a no-op (caught) otherwise.
 */
export async function sweepUnreported(now = getServerNow()) {
  const ctx = deriveCheckinContext(now);
  const swept = [];

  for (const userId of USER_IDS) {
    const existing = await getUserRecords(userId);
    const known = new Set(existing.map((r) => r.date));

    for (const date of allCompetitionDates()) {
      if (date >= ctx.targetDate) continue; // not yet closed
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
