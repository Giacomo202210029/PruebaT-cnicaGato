import { requireAdmin } from '../_lib/auth.js';
import { deleteAll } from '../_lib/blob.js';
import { withErrorHandling } from '../_lib/handler.js';

/** Admin-only: wipes every check-in (test and real alike). Meant to be used once, right
 * before the competition's actual start date, to clear out preview/test data. */
export default withErrorHandling(async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const deleted = await deleteAll('checkins/');
  res.status(200).json({ deleted });
});
