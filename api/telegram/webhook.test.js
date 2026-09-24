import { describe, it, expect, vi, beforeEach } from 'vitest';

const telegramCalls = [];
vi.mock('../_lib/telegram.js', () => ({
  sendMessage: vi.fn(async (...args) => telegramCalls.push(['sendMessage', ...args])),
  answerCallbackQuery: vi.fn(async (...args) => telegramCalls.push(['answerCallbackQuery', ...args])),
  editMessageReplyMarkup: vi.fn(async (...args) => telegramCalls.push(['editMessageReplyMarkup', ...args])),
  buildNameKeyboard: () => ({ inline_keyboard: [] }),
}));

const recordCheckinMock = vi.fn();
class MockCheckinError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
vi.mock('../_lib/checkins.js', () => ({
  recordCheckin: (...args) => recordCheckinMock(...args),
  CheckinError: MockCheckinError,
}));

const usersById = new Map();
vi.mock('../_lib/users.js', () => ({
  getUser: async (id) => usersById.get(id) ?? null,
  saveUser: async (user) => usersById.set(user.id, user),
  findUserByTelegramChatId: async (chatId) => [...usersById.values()].find((u) => u.telegramChatId === chatId) ?? null,
}));

const { default: handler } = await import('./webhook.js');

function makeRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

beforeEach(() => {
  telegramCalls.length = 0;
  recordCheckinMock.mockReset();
  usersById.clear();
  process.env.TELEGRAM_WEBHOOK_SECRET = 'test-secret';
});

describe('telegram webhook', () => {
  it('acks fast but drops updates without the right secret token', async () => {
    const req = { headers: {}, body: { message: { text: '/start', chat: { id: 1 } } } };
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(telegramCalls).toHaveLength(0);
  });

  it('links a user on a link: callback', async () => {
    usersById.set('jugador1', { id: 'jugador1', telegramChatId: null });
    const req = {
      headers: { 'x-telegram-bot-api-secret-token': 'test-secret' },
      body: { callback_query: { id: 'cbq1', data: 'link:jugador1', message: { chat: { id: 555 }, message_id: 9 } } },
    };
    await handler(req, makeRes());
    expect(usersById.get('jugador1').telegramChatId).toBe(555);
  });

  it('records a check-in on a chk: callback for a linked user', async () => {
    usersById.set('jugador1', { id: 'jugador1', telegramChatId: 555 });
    recordCheckinMock.mockResolvedValue({ status: 'clean' });
    const req = {
      headers: { 'x-telegram-bot-api-secret-token': 'test-secret' },
      body: { callback_query: { id: 'cbq2', data: 'chk:clean', message: { chat: { id: 555 }, message_id: 10 } } },
    };
    await handler(req, makeRes());
    expect(recordCheckinMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'jugador1', status: 'clean', source: 'telegram' }),
    );
  });

  it('tells an unlinked chat to /start first, without calling recordCheckin', async () => {
    const req = {
      headers: { 'x-telegram-bot-api-secret-token': 'test-secret' },
      body: { callback_query: { id: 'cbq3', data: 'chk:clean', message: { chat: { id: 999 }, message_id: 11 } } },
    };
    await handler(req, makeRes());
    expect(recordCheckinMock).not.toHaveBeenCalled();
    const ack = telegramCalls.find((c) => c[0] === 'answerCallbackQuery');
    expect(ack[2]).toMatch(/start/);
  });

  it('surfaces a CheckinError message back to the user (e.g. already checked in)', async () => {
    usersById.set('jugador1', { id: 'jugador1', telegramChatId: 555 });
    recordCheckinMock.mockRejectedValue(new MockCheckinError(409, 'already_recorded', 'Ya registraste tu día de hoy.'));
    const req = {
      headers: { 'x-telegram-bot-api-secret-token': 'test-secret' },
      body: { callback_query: { id: 'cbq4', data: 'chk:relapse', message: { chat: { id: 555 }, message_id: 12 } } },
    };
    await handler(req, makeRes());
    const ack = telegramCalls.filter((c) => c[0] === 'answerCallbackQuery').at(-1);
    expect(ack[2]).toBe('Ya registraste tu día de hoy.');
  });
});
