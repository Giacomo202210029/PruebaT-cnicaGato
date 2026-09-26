import { requireAuth } from './_lib/auth.js';
import { recordCheckin, CheckinError } from './_lib/checkins.js';
import { getContent, pickRandom } from './_lib/content.js';
import { STATUS } from '../shared/constants.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const userId = requireAuth(req);
  if (!userId) return res.status(401).json({ error: 'unauthorized' });

  const { status, note, trigger } = req.body ?? {};

  try {
    const record = await recordCheckin({ userId, status, note, trigger, source: 'web' });
    const content = await getContent();
    const phrase = pickRandom(record.status === STATUS.CLEAN ? content.cleanPhrases : content.relapsePhrases);
    res.status(201).json({ record, phrase });
  } catch (err) {
    if (err instanceof CheckinError) {
      return res.status(err.status).json({ error: err.code, message: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
}
