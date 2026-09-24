import { describe, it, expect, vi, beforeEach } from 'vitest';
import { STATUS } from '../../shared/constants.js';

// In-memory fake standing in for Vercel Blob, behind the same interface as blob.js —
// lets recordCheckin's honesty rules (window, immutability, date derivation) be tested
// without touching real storage.
const store = new Map();

vi.mock('./blob.js', () => ({
  existsKey: async (key) => store.has(key),
  putJson: async (key, data) => {
    if (store.has(key)) throw new Error('already exists');
    store.set(key, data);
  },
  getJson: async (key) => store.get(key) ?? null,
  listJson: async (prefix) => [...store.entries()].filter(([k]) => k.startsWith(prefix)).map(([, v]) => v),
}));

const { recordCheckin, sweepUnreported } = await import('./checkins.js');

const bogota = (localDateTime) => new Date(`${localDateTime}-05:00`);

beforeEach(() => store.clear());

describe('recordCheckin', () => {
  it('writes a clean check-in within the window', async () => {
    const record = await recordCheckin({
      userId: 'jugador1',
      status: STATUS.CLEAN,
      source: 'web',
      now: bogota('2026-10-05T20:00:00'),
    });
    expect(record.date).toBe('2026-10-05');
    expect(record.status).toBe(STATUS.CLEAN);
  });

  it('rejects a second check-in for the same user+day (immutability)', async () => {
    const now = bogota('2026-10-05T20:00:00');
    await recordCheckin({ userId: 'jugador1', status: STATUS.CLEAN, source: 'web', now });
    await expect(
      recordCheckin({ userId: 'jugador1', status: STATUS.RELAPSE, source: 'web', now }),
    ).rejects.toMatchObject({ code: 'already_recorded' });
  });

  it('rejects outside the night window', async () => {
    await expect(
      recordCheckin({ userId: 'jugador1', status: STATUS.CLEAN, source: 'web', now: bogota('2026-10-05T12:00:00') }),
    ).rejects.toMatchObject({ code: 'window_closed' });
  });

  it('rejects an invalid user', async () => {
    await expect(
      recordCheckin({ userId: 'intruso', status: STATUS.CLEAN, source: 'web', now: bogota('2026-10-05T20:00:00') }),
    ).rejects.toMatchObject({ code: 'invalid_user' });
  });

  it('strips note/trigger when the status is clean', async () => {
    const record = await recordCheckin({
      userId: 'jugador1',
      status: STATUS.CLEAN,
      note: 'no debería guardarse',
      trigger: 'estres',
      source: 'web',
      now: bogota('2026-10-05T20:00:00'),
    });
    expect(record.note).toBeNull();
    expect(record.trigger).toBeNull();
  });
});

describe('sweepUnreported', () => {
  it('marks past closed nights with no record, but leaves the still-open night alone', async () => {
    const now = bogota('2026-10-03T10:00:00'); // daytime: Oct 1 & 2 closed, Oct 3 not yet open
    const swept = await sweepUnreported(now);
    const dates = swept.filter((r) => r.user === 'jugador1').map((r) => r.date);
    expect(dates).toContain('2026-10-01');
    expect(dates).toContain('2026-10-02');
    expect(dates).not.toContain('2026-10-03');
  });

  it('is idempotent — a second sweep at the same time adds nothing new', async () => {
    const now = bogota('2026-10-03T10:00:00');
    await sweepUnreported(now);
    expect(await sweepUnreported(now)).toHaveLength(0);
  });
});
