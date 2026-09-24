import { describe, it, expect } from 'vitest';
import { deriveCheckinContext } from './time.js';

// America/Bogota is fixed UTC-5, no DST, so this literal offset is safe for every test date.
const bogota = (localDateTime) => new Date(`${localDateTime}-05:00`);

describe('deriveCheckinContext window boundaries', () => {
  it('rejects at 17:59', () => {
    expect(deriveCheckinContext(bogota('2026-10-05T17:59:00')).isWithinWindow).toBe(false);
  });

  it('accepts at 18:00 and targets tonight', () => {
    const ctx = deriveCheckinContext(bogota('2026-10-05T18:00:00'));
    expect(ctx.isWithinWindow).toBe(true);
    expect(ctx.targetDate).toBe('2026-10-05');
  });

  it('accepts at 23:59 and targets tonight', () => {
    const ctx = deriveCheckinContext(bogota('2026-10-05T23:59:00'));
    expect(ctx.isWithinWindow).toBe(true);
    expect(ctx.targetDate).toBe('2026-10-05');
  });

  it('accepts at 00:00 and targets last night', () => {
    const ctx = deriveCheckinContext(bogota('2026-10-06T00:00:00'));
    expect(ctx.isWithinWindow).toBe(true);
    expect(ctx.targetDate).toBe('2026-10-05');
  });

  it('accepts at 03:59 and targets last night', () => {
    const ctx = deriveCheckinContext(bogota('2026-10-06T03:59:00'));
    expect(ctx.isWithinWindow).toBe(true);
    expect(ctx.targetDate).toBe('2026-10-05');
  });

  it('rejects at 04:00', () => {
    expect(deriveCheckinContext(bogota('2026-10-06T04:00:00')).isWithinWindow).toBe(false);
  });

  it('rejects at noon', () => {
    expect(deriveCheckinContext(bogota('2026-10-06T12:00:00')).isWithinWindow).toBe(false);
  });

  it('flags outside the competition range even during a valid window', () => {
    expect(deriveCheckinContext(bogota('2026-11-01T20:00:00')).withinCompetition).toBe(false);
    expect(deriveCheckinContext(bogota('2026-09-30T20:00:00')).withinCompetition).toBe(false);
    expect(deriveCheckinContext(bogota('2026-10-01T20:00:00')).withinCompetition).toBe(true);
  });

  it('minutesUntilClose counts down correctly across midnight', () => {
    expect(deriveCheckinContext(bogota('2026-10-05T23:00:00')).minutesUntilClose).toBe(300);
    expect(deriveCheckinContext(bogota('2026-10-06T02:30:00')).minutesUntilClose).toBe(90);
  });
});
