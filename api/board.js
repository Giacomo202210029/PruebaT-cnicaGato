import { requireAuth } from './_lib/auth.js';
import { getUserRecords } from './_lib/checkins.js';
import { deriveCheckinContext, competitionEnded } from './_lib/time.js';
import { withErrorHandling } from './_lib/handler.js';
import { currentStreak, longestStreak, totalClean, rankUsers } from '../shared/streaks.js';
import { USER_IDS, USER_LABELS, MILESTONES } from '../shared/constants.js';

/** One endpoint for Today/Calendar/Leaderboard/Badges/Results — cheap at this scale, one round trip. */
export default withErrorHandling(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const userId = requireAuth(req);
  if (!userId) return res.status(401).json({ error: 'unauthorized' });

  const ctx = deriveCheckinContext();

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

  res.status(200).json({
    serverNow: ctx.serverNow,
    targetDate: ctx.targetDate,
    isWithinWindow: ctx.isWithinWindow,
    minutesUntilClose: ctx.minutesUntilClose,
    competitionEnded: competitionEnded(),
    milestones: MILESTONES,
    users,
    leaderboardOrder: rankUsers(users).map((u) => u.id),
    me: userId,
  });
});
