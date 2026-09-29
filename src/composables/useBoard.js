import { reactive, readonly } from 'vue';
import { useAuth } from './useAuth.js';

// This is a once-a-day check-in app, not live chat — poll gently, and only while the tab
// is actually visible. A background tab left open used to keep polling every 45s forever,
// which is what burned through the Vercel Blob free-tier request quota well before the
// competition even started.
const POLL_INTERVAL_MS = 5 * 60 * 1000;

const state = reactive({ loading: false, error: null, data: null });
let pollTimer = null;

function startInterval() {
  clearInterval(pollTimer);
  pollTimer = setInterval(refresh, POLL_INTERVAL_MS);
}

function onVisibility() {
  if (document.visibilityState === 'visible') {
    refresh();
    startInterval();
  } else {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function refresh() {
  const { authHeaders, state: authState } = useAuth();
  if (!authState.token) return;

  state.loading = true;
  state.error = null;
  try {
    const res = await fetch('/api/board', { headers: authHeaders() });
    if (!res.ok) throw new Error('No se pudo cargar el tablero.');
    state.data = await res.json();
  } catch (err) {
    state.error = err.message;
  } finally {
    state.loading = false;
  }
}

export function useBoard() {
  const { authHeaders } = useAuth();

  function startPolling() {
    stopPolling();
    refresh();
    if (document.visibilityState === 'visible') startInterval();
    document.addEventListener('visibilitychange', onVisibility);
  }

  function stopPolling() {
    clearInterval(pollTimer);
    pollTimer = null;
    document.removeEventListener('visibilitychange', onVisibility);
    state.data = null;
  }

  async function submitCheckin(status, { note, trigger } = {}) {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status, note, trigger }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'No se pudo marcar el día.');
    await refresh();
    return data;
  }

  return { state: readonly(state), refresh, startPolling, stopPolling, submitCheckin };
}
