import { reactive, readonly } from 'vue';
import { useAuth } from './useAuth.js';

const state = reactive({ loading: false, error: null, data: null });
let pollTimer = null;

function onVisibility() {
  if (document.visibilityState === 'visible') refresh();
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
    pollTimer = setInterval(refresh, 45_000);
    document.addEventListener('visibilitychange', onVisibility);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
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
