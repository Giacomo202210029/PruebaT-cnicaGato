import crypto from 'node:crypto';
import { getJson, putJson } from './blob.js';
import { USER_IDS } from '../../shared/constants.js';

const userKey = (userId) => `users/${userId}.json`;

function emptyUser(userId) {
  return {
    id: userId,
    pinHash: null,
    pinSalt: null,
    telegramChatId: null,
    notificationsEnabled: true,
  };
}

export function isValidUserId(userId) {
  return USER_IDS.includes(userId);
}

export async function getUser(userId) {
  if (!isValidUserId(userId)) return null;
  const existing = await getJson(userKey(userId));
  return existing ?? emptyUser(userId);
}

export async function getAllUsers() {
  return Promise.all(USER_IDS.map(getUser));
}

export async function saveUser(user) {
  await putJson(userKey(user.id), user, { allowOverwrite: true });
  return user;
}

function hashPin(pin, salt) {
  return crypto.scryptSync(pin, salt, 64).toString('hex');
}

export function verifyPin(user, pin) {
  if (!user?.pinHash || !user?.pinSalt) return false;
  const candidate = Buffer.from(hashPin(pin, user.pinSalt), 'hex');
  const stored = Buffer.from(user.pinHash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

/** First-login flow: whichever 4-digit PIN is entered first becomes the user's PIN. */
export async function setPin(user, pin) {
  const salt = crypto.randomBytes(16).toString('base64');
  const updated = { ...user, pinSalt: salt, pinHash: hashPin(pin, salt) };
  return saveUser(updated);
}

export async function findUserByTelegramChatId(chatId) {
  const users = await getAllUsers();
  return users.find((u) => u.telegramChatId === chatId) ?? null;
}
