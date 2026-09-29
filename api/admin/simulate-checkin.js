import { requireAdmin } from '../_lib/auth.js';
import { putJson } from '../_lib/store.js';
import { withErrorHandling } from '../_lib/handler.js';
import { STATUS, TRIGGER_TAGS, MAX_NOTE_LENGTH, USER_IDS } from '../../shared/constants.js';

/**
 * Admin-only preview tool: writes a check-in for any user/date within the competition,
 * bypassing the night-window and "must be today" rules that recordCheckin() enforces for
 * real players — this is explicitly a testing aid, not a way to log a real day. Allows
 * overwrite so the admin can freely iterate while previewing. Use /api/admin/reset to
 * clear everything before the real competition starts.
 */
export default withErrorHandling(async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { targetUser, date, status, note, trigger } = req.body ?? {};

  if (!USER_IDS.includes(targetUser)) {
    return res.status(400).json({ error: 'invalid_user' });
  }
  if (![STATUS.CLEAN, STATUS.RELAPSE].includes(status)) {
    return res.status(400).json({ error: 'invalid_status' });
  }
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'invalid_date' });
  }

  const record = {
    user: targetUser,
    date,
    status,
    note: status === STATUS.RELAPSE && note ? String(note).slice(0, MAX_NOTE_LENGTH) : null,
    trigger: status === STATUS.RELAPSE && TRIGGER_TAGS.includes(trigger) ? trigger : null,
    source: 'admin-test',
    createdAt: new Date().toISOString(),
  };

  await putJson(`checkins/${targetUser}/${date}.json`, record, { allowOverwrite: true });
  res.status(201).json({ record });
});
