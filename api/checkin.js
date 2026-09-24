import { requireAuth } from './_lib/auth.js';
import { recordCheckin, CheckinError } from './_lib/checkins.js';
import { STATUS, CLEAN_PHRASES, RELAPSE_PHRASES } from '../shared/constants.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const userId = requireAuth(req);
  if (!userId) return res.status(401).json({ error: 'unauthorized' });

  const { status, note, trigger } = req.body ?? {};

  try {
    const record = await recordCheckin({ userId, status, note, trigger, source: 'web' });
    const phrase = record.status === STATUS.CLEAN ? pick(CLEAN_PHRASES) : pick(RELAPSE_PHRASES);
    res.status(201).json({ record, phrase });
  } catch (err) {
    if (err instanceof CheckinError) {
      return res.status(err.status).json({ error: err.code, message: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
}
