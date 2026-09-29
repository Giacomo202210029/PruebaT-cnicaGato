import { recordCheckin, resolvePendingDate, CheckinError } from '../_lib/checkins.js';
import { getUser, saveUser, findUserByTelegramChatId } from '../_lib/users.js';
import { getContent, pickRandom } from '../_lib/content.js';
import {
  sendMessage,
  answerCallbackQuery,
  editMessageReplyMarkup,
  buildNameKeyboard,
} from '../_lib/telegram.js';
import { STATUS, USER_LABELS } from '../../shared/constants.js';

export default async function handler(req, res) {
  // Ack immediately — Telegram retries aggressively on slow/non-200 responses.
  res.status(200).json({ ok: true });

  if (req.headers['x-telegram-bot-api-secret-token'] !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.warn('Telegram webhook: secret token mismatch, dropping update.');
    return;
  }

  const update = req.body ?? {};
  try {
    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message?.text === '/start') {
      await sendMessage(update.message.chat.id, '¿Quién eres?', buildNameKeyboard());
    }
  } catch (err) {
    console.error('Telegram webhook handling error:', err);
  }
}

async function handleCallback(cq) {
  const data = cq.data ?? '';
  const chatId = cq.message?.chat?.id;
  const messageId = cq.message?.message_id;

  if (data.startsWith('link:')) {
    const userId = data.slice('link:'.length);
    const user = await getUser(userId);
    if (!user) {
      await answerCallbackQuery(cq.id, 'Usuario inválido.');
      return;
    }
    await saveUser({ ...user, telegramChatId: chatId });
    await answerCallbackQuery(cq.id, `Listo, quedaste vinculado como ${USER_LABELS[userId]}.`);
    if (messageId) await editMessageReplyMarkup(chatId, messageId);
    return;
  }

  if (data.startsWith('chk:')) {
    const status = data.slice('chk:'.length) === 'clean' ? STATUS.CLEAN : STATUS.RELAPSE;
    const user = await findUserByTelegramChatId(chatId);
    if (!user) {
      await answerCallbackQuery(cq.id, 'Primero vincula tu cuenta con /start.');
      return;
    }

    const date = await resolvePendingDate(user.id);
    if (!date) {
      await answerCallbackQuery(cq.id, 'Ya tienes todo marcado, no queda ningún día pendiente.');
      if (messageId) await editMessageReplyMarkup(chatId, messageId);
      return;
    }

    try {
      await recordCheckin({ userId: user.id, status, date, source: 'telegram' });
      const content = await getContent();
      await answerCallbackQuery(cq.id, 'Marcado ✅');
      if (messageId) await editMessageReplyMarkup(chatId, messageId);
      await sendMessage(chatId, pickRandom(status === STATUS.CLEAN ? content.cleanPhrases : content.relapsePhrases));
    } catch (err) {
      const message = err instanceof CheckinError ? err.message : 'Algo salió mal, intenta desde la web.';
      await answerCallbackQuery(cq.id, message);
    }
  }
}
