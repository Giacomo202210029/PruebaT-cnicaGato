import { describe, it, expect, vi, beforeEach } from 'vitest';
import { STATUS } from '../../shared/constants.js';

// In-memory fake standing in for the GitHub-backed store, behind the same interface as
// store.js — lets recordCheckin's honesty rules (eligible date, immutability) be tested
// without touching real storage.
const store = new Map();

vi.mock('./store.js', () => ({
  existsKey: async (key) => store.has(key),
  putJson: async (key, data) => {
    if (store.has(key)) throw new Error('already exists');
    store.set(key, data);
  },
  getJson: async (key) => store.get(key) ?? null,
  listJson: async (prefix) => [...store.entries()].filter(([k]) => k.startsWith(prefix)).map(([, v]) => v),
}));

const { recordCheckin, resolvePendingDate, sweepUnreported } = await import('./checkins.js');

const bogota = (localDateTime) => new Date(`${localDateTime}-05:00`);

beforeEach(() => store.clear());

describe('recordCheckin', () => {
  it('writes a clean check-in for today, any time of day', async () => {
    const record = await recordCheckin({
      userId: 'jugador1',
      status: STATUS.CLEAN,
      source: 'web',
      now: bogota('2026-10-05T09:00:00'),
    });
    expect(record.date).toBe('2026-10-05');
    expect(record.status).toBe(STATUS.CLEAN);
  });

  it('writes a check-in for yesterday when explicitly dated', async () => {
    const record = await recordCheckin({
      userId: 'jugador1',
      status: STATUS.CLEAN,
      date: '2026-10-04',
      source: 'web',
      now: bogota('2026-10-05T09:00:00'),
    });
    expect(record.date).toBe('2026-10-04');
  });

  it('rejects a second check-in for the same user+day (immutability)', async () => {
    const now = bogota('2026-10-05T09:00:00');
    await recordCheckin({ userId: 'jugador1', status: STATUS.CLEAN, source: 'web', now });
    await expect(
      recordCheckin({ userId: 'jugador1', status: STATUS.RELAPSE, source: 'web', now }),
    ).rejects.toMatchObject({ code: 'already_recorded' });
  });

  it('rejects a date older than yesterday', async () => {
    await expect(
      recordCheckin({
        userId: 'jugador1',
        status: STATUS.CLEAN,
        date: '2026-10-03',
        source: 'web',
        now: bogota('2026-10-05T09:00:00'),
      }),
    ).rejects.toMatchObject({ code: 'invalid_date' });
  });

  it('rejects a future date', async () => {
    await expect(
      recordCheckin({
        userId: 'jugador1',
        status: STATUS.CLEAN,
        date: '2026-10-06',
        source: 'web',
        now: bogota('2026-10-05T09:00:00'),
      }),
    ).rejects.toMatchObject({ code: 'invalid_date' });
  });

  it('rejects an invalid user', async () => {
    await expect(
      recordCheckin({ userId: 'intruso', status: STATUS.CLEAN, source: 'web', now: bogota('2026-10-05T09:00:00') }),
    ).rejects.toMatchObject({ code: 'invalid_user' });
  });

  it('strips note/trigger when the status is clean', async () => {
    const record = await recordCheckin({
      userId: 'jugador1',
      status: STATUS.CLEAN,
      note: 'no debería guardarse',
      trigger: 'estres',
      source: 'web',
      now: bogota('2026-10-05T09:00:00'),
    });
    expect(record.note).toBeNull();
    expect(record.trigger).toBeNull();
  });
});

describe('resolvePendingDate', () => {
  it('offers yesterday first when it is still unmarked', async () => {
    const date = await resolvePendingDate('jugador1', bogota('2026-10-05T09:00:00'));
    expect(date).toBe('2026-10-04');
  });

  it('falls back to today once yesterday is marked', async () => {
    await recordCheckin({
      userId: 'jugador1',
      status: STATUS.CLEAN,
      date: '2026-10-04',
      source: 'web',
      now: bogota('2026-10-05T09:00:00'),
    });
    const date = await resolvePendingDate('jugador1', bogota('2026-10-05T09:00:00'));
    expect(date).toBe('2026-10-05');
  });

  it('returns null once both today and yesterday are marked', async () => {
    const now = bogota('2026-10-05T09:00:00');
    await recordCheckin({ userId: 'jugador1', status: STATUS.CLEAN, date: '2026-10-04', source: 'web', now });
    await recordCheckin({ userId: 'jugador1', status: STATUS.CLEAN, date: '2026-10-05', source: 'web', now });
    expect(await resolvePendingDate('jugador1', now)).toBeNull();
  });
});

describe('sweepUnreported', () => {
  it('marks days older than yesterday with no record, leaving today and yesterday alone', async () => {
    const now = bogota('2026-10-05T09:00:00'); // Oct 1-3 closed, Oct 4 (yesterday) & 5 (today) still open
    const swept = await sweepUnreported(now);
    const dates = swept.filter((r) => r.user === 'jugador1').map((r) => r.date);
    expect(dates).toContain('2026-10-01');
    expect(dates).toContain('2026-10-02');
    expect(dates).toContain('2026-10-03');
    expect(dates).not.toContain('2026-10-04');
    expect(dates).not.toContain('2026-10-05');
  });

  it('is idempotent — a second sweep at the same time adds nothing new', async () => {
    const now = bogota('2026-10-05T09:00:00');
    await sweepUnreported(now);
    expect(await sweepUnreported(now)).toHaveLength(0);
  });
});
