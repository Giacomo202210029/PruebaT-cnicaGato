import { requireAuth } from './_lib/auth.js';
import { getUser, saveUser } from './_lib/users.js';

export default async function handler(req, res) {
  const userId = requireAuth(req);
  if (!userId) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'GET') {
    const user = await getUser(userId);
    return res.status(200).json({
      notificationsEnabled: user.notificationsEnabled,
      telegramLinked: Boolean(user.telegramChatId),
    });
  }

  if (req.method === 'POST') {
    const { notificationsEnabled } = req.body ?? {};
    if (typeof notificationsEnabled !== 'boolean') {
      return res.status(400).json({ error: 'invalid_input' });
    }
    const user = await getUser(userId);
    await saveUser({ ...user, notificationsEnabled });
    return res.status(200).json({ notificationsEnabled });
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
