import { USER_IDS, USER_LABELS } from '../../shared/constants.js';

const API_BASE = 'https://api.telegram.org';

function botToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no configurado');
  return token;
}

async function callTelegram(method, payload) {
  const res = await fetch(`${API_BASE}/bot${botToken()}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`Telegram ${method} failed: ${data.description}`);
  }
  return data;
}

export function buildCheckinKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '✅ Sin pecado hoy', callback_data: 'chk:clean' },
        { text: '😔 Pequé hoy', callback_data: 'chk:relapse' },
      ],
    ],
  };
}

export function buildNameKeyboard() {
  return {
    inline_keyboard: [USER_IDS.map((id) => ({ text: USER_LABELS[id], callback_data: `link:${id}` }))],
  };
}

export function sendMessage(chatId, text, replyMarkup) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup: replyMarkup,
    parse_mode: 'HTML',
  });
}

export function answerCallbackQuery(callbackQueryId, text) {
  return callTelegram('answerCallbackQuery', { callback_query_id: callbackQueryId, text, show_alert: false });
}

export function editMessageReplyMarkup(chatId, messageId, replyMarkup = { inline_keyboard: [] }) {
  return callTelegram('editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: replyMarkup });
}
