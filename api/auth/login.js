import { getUser, verifyPin, setPin, isValidUserId } from '../_lib/users.js';
import { issueToken } from '../_lib/auth.js';
import { withErrorHandling } from '../_lib/handler.js';
import { USER_LABELS } from '../../shared/constants.js';

export default withErrorHandling(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { userId, pin } = req.body ?? {};
  if (!isValidUserId(userId) || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'invalid_input', message: 'PIN debe ser de 4 dígitos.' });
  }

  let user = await getUser(userId);

  if (!user.pinHash) {
    // First login for this slot: the PIN they enter now becomes their PIN.
    user = await setPin(user, pin);
  } else if (!verifyPin(user, pin)) {
    return res.status(401).json({ error: 'wrong_pin', message: 'PIN incorrecto.' });
  }

  const token = issueToken(userId);
  res.status(200).json({ token, userId, label: USER_LABELS[userId] });
});
