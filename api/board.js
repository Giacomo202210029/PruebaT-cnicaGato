import { requireAuth } from './_lib/auth.js';
import { getUserRecords } from './_lib/checkins.js';
import { deriveCheckinContext, competitionEnded } from './_lib/time.js';
import { getContent, pickForDate } from './_lib/content.js';
import { withErrorHandling } from './_lib/handler.js';
import { currentStreak, longestStreak, totalClean, rankUsers } from '../shared/streaks.js';
import { USER_IDS, USER_LABELS, MILESTONES, ADMIN_USER_ID } from '../shared/constants.js';

/** One endpoint for Today/Calendar/Leaderboard/Badges/Results — cheap at this scale, one round trip. */
export default withErrorHandling(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const userId = requireAuth(req);
  if (!userId) return res.status(401).json({ error: 'unauthorized' });

  const ctx = deriveCheckinContext();
  const content = await getContent();

  const users = await Promise.all(
    USER_IDS.map(async (id) => {
      const days = await getUserRecords(id);
      return {
        id,
        label: USER_LABELS[id],
        days,
        currentStreak: currentStreak(days),
        longestStreak: longestStreak(days),
        totalClean: totalClean(days),
      };
    }),
  );

  // Calendars are private: nobody sees another player's day-by-day record, only the public
  // score (computed above from the full, unstripped records). The admin is the one exception
  // — jugador1 can see everyone's day statuses to preview/test the app — but even the admin
  // never sees another player's relapse notes/triggers; those are private with no exceptions.
  const isAdmin = userId === ADMIN_USER_ID;
  const usersForResponse = users.map((u) => {
    if (u.id === userId) return u;
    if (isAdmin) return { ...u, days: u.days.map((d) => ({ ...d, note: null, trigger: null })) };
    return { ...u, days: [] };
  });

  res.status(200).json({
    serverNow: ctx.serverNow,
    today: ctx.calendarDate,
    yesterday: ctx.yesterday,
    competitionEnded: competitionEnded(),
    milestones: MILESTONES,
    users: usersForResponse,
    leaderboardOrder: rankUsers(users).map((u) => u.id),
    me: userId,
    isAdmin,
    scienceFact: pickForDate(content.scienceFacts, ctx.calendarDate),
  });
});
