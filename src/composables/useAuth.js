import { reactive, readonly } from 'vue';

const STORAGE_KEY = 'racha-limpia:auth';

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const state = reactive({ token: null, userId: null, label: null });
const stored = loadStored();
if (stored) Object.assign(state, stored);

function persist() {
  try {
    if (state.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Private browsing / storage disabled — session just won't survive a reload.
  }
}

export function useAuth() {
  async function login(userId, pin) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, pin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'No se pudo iniciar sesión.');

    state.token = data.token;
    state.userId = data.userId;
    state.label = data.label;
    persist();
    return data;
  }

  function logout() {
    state.token = null;
    state.userId = null;
    state.label = null;
    persist();
  }

  function authHeaders() {
    return state.token ? { authorization: `Bearer ${state.token}` } : {};
  }

  return { state: readonly(state), login, logout, authHeaders };
}
