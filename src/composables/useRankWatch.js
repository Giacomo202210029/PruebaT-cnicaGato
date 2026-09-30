import { reactive, watch } from 'vue';
import { useBoard } from './useBoard.js';

// Module-level singleton, same pattern as useBoard/useAuth — one notice shared across
// whichever components render it.
const notice = reactive({ message: null, kind: null }); // kind: 'up' | 'down'

const snapshotKey = (userId) => `racha_rank_snapshot_${userId}`;

function readSnapshot(userId) {
  try {
    const raw = localStorage.getItem(snapshotKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSnapshot(userId, order) {
  try {
    localStorage.setItem(snapshotKey(userId), JSON.stringify(order));
  } catch {
    // Private browsing / storage disabled — the notification just won't fire, fine.
  }
}

/**
 * Compares the current leaderboard order against the last one seen on this device. Never
 * reveals anything about *why* someone's rank changed (no day-level data involved) — only
 * that it did, which is exactly the public "puntaje" signal this is meant to surface.
 */
function checkRankChange(data) {
  const userId = data.me;
  const order = data.leaderboardOrder;
  const prevOrder = readSnapshot(userId);
  writeSnapshot(userId, order);

  if (!prevOrder) return; // first time seen on this device, nothing to compare yet

  const oldIndex = prevOrder.indexOf(userId);
  const newIndex = order.indexOf(userId);
  if (oldIndex === -1 || newIndex === -1 || newIndex === oldIndex) return;

  const labels = Object.fromEntries(data.users.map((u) => [u.id, u.label]));

  if (newIndex > oldIndex) {
    const passers = order
      .slice(0, newIndex)
      .filter((id) => id !== userId && !prevOrder.slice(0, oldIndex).includes(id));
    const names = passers.map((id) => labels[id]).filter(Boolean);
    notice.kind = 'down';
    notice.message = names.length
      ? `${names.join(' y ')} te pasó en el puntaje — ahora vas #${newIndex + 1}.`
      : `Bajaste al puesto #${newIndex + 1}.`;
  } else {
    notice.kind = 'up';
    notice.message = `¡Subiste al puesto #${newIndex + 1}!`;
  }
}

export function useRankWatch() {
  const { state: boardState } = useBoard();
  watch(
    () => boardState.data,
    (data) => {
      if (data) checkRankChange(data);
    },
    { immediate: true },
  );

  function dismiss() {
    notice.message = null;
    notice.kind = null;
  }

  return { notice, dismiss };
}
