import { requireAdmin } from '../_lib/auth.js';
import { getContent, saveContent } from '../_lib/content.js';
import { withErrorHandling } from '../_lib/handler.js';

export default withErrorHandling(async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: 'forbidden' });

  if (req.method === 'GET') {
    return res.status(200).json(await getContent());
  }

  if (req.method === 'POST') {
    const saved = await saveContent(req.body ?? {});
    return res.status(200).json(saved);
  }

  res.status(405).json({ error: 'method_not_allowed' });
});
