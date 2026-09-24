import { sweepUnreported } from '../_lib/checkins.js';
import { getAllUsers } from '../_lib/users.js';
import { existsKey, putJson } from '../_lib/blob.js';
import { sendMessage, buildCheckinKeyboard } from '../_lib/telegram.js';
import { deriveCheckinContext, getServerNow } from '../_lib/time.js';
import { WINDOW_START_HOUR, URGENT_REMINDER_HOUR, TIMEZONE } from '../../shared/constants.js';

function zonedHour(now) {
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour12: false, hour: '2-digit' });
  const h = fmt.format(now);
  return h === '24' ? 0 : Number(h);
}

const reminderMarkerKey = (userId, date, type) => `meta/reminders/${userId}/${date}_${type}.json`;

async function markSent(userId, date, type) {
  try {
    await putJson(reminderMarkerKey(userId, date, type), { sentAt: new Date().toISOString() });
  } catch {
    // Marker already exists — another tick already handled this, fine.
  }
}

/**
 * Runs every hour (Vercel Cron free tier fires "within the hour", not minute-precise), so
 * every step here is idempotent: the sweep re-checks per-day existence, and reminders are
 * deduped with their own marker file, safe to re-run many times an hour.
 */
export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const now = getServerNow();
  const ctx = deriveCheckinContext(now);
  const hour = zonedHour(now);

  const swept = await sweepUnreported(now);

  let remindersSent = 0;
  const band = hour === WINDOW_START_HOUR ? 'open' : hour === URGENT_REMINDER_HOUR ? 'urgent' : null;

  if (band) {
    const users = await getAllUsers();
    for (const user of users) {
      if (!user.telegramChatId || !user.notificationsEnabled) continue;

      const date = ctx.targetDate;
      if (await existsKey(`checkins/${user.id}/${date}.json`)) continue;
      if (await existsKey(reminderMarkerKey(user.id, date, band))) continue;

      const text =
        band === 'open'
          ? '🌙 Hora de marcar tu día. ¿Sin pecado o pecaste?'
          : `🚨 Racha en peligro — te quedan ~${ctx.minutesUntilClose} min antes de que cierre la ventana. ¡Marca ya!`;

      await sendMessage(user.telegramChatId, text, buildCheckinKeyboard());
      await markSent(user.id, date, band);
      remindersSent++;
    }
  }

  res.status(200).json({ swept: swept.length, remindersSent });
}
