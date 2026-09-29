import { sweepUnreported, resolvePendingDate } from '../_lib/checkins.js';
import { getAllUsers } from '../_lib/users.js';
import { existsKey, putJson } from '../_lib/store.js';
import { sendMessage, buildCheckinKeyboard } from '../_lib/telegram.js';
import { deriveCheckinContext, getServerNow } from '../_lib/time.js';

const reminderMarkerKey = (userId, date) => `meta/reminders/${userId}/${date}.json`;

async function markSent(userId, date) {
  try {
    await putJson(reminderMarkerKey(userId, date), { sentAt: new Date().toISOString() });
  } catch {
    // Marker already exists — another tick already handled this, fine.
  }
}

/**
 * Runs twice a day (Vercel Cron's Hobby tier only allows daily schedules, so this is wired
 * as two separate daily crons rather than one hourly one). There's no hard deadline anymore
 * — each run just closes the books on days nobody can mark anymore, and sends at most one
 * gentle nudge per day to anyone with a pending day. Never framed as urgent: a missed day
 * isn't a "sin", it just doesn't count in your favor.
 */
export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const now = getServerNow();
  const ctx = deriveCheckinContext(now);

  const swept = await sweepUnreported(now);

  let remindersSent = 0;
  const users = await getAllUsers();
  for (const user of users) {
    if (!user.telegramChatId || !user.notificationsEnabled) continue;
    if (await existsKey(reminderMarkerKey(user.id, ctx.calendarDate))) continue;

    const pendingDate = await resolvePendingDate(user.id, now);
    if (!pendingDate) continue;

    const text =
      pendingDate === ctx.calendarDate
        ? '🌙 ¿Cómo te fue hoy? Marca tu día cuando puedas.'
        : '🌤️ Ayer se te quedó sin marcar — todavía puedes hacerlo.';

    await sendMessage(user.telegramChatId, text, buildCheckinKeyboard());
    await markSent(user.id, ctx.calendarDate);
    remindersSent++;
  }

  res.status(200).json({ swept: swept.length, remindersSent });
}
