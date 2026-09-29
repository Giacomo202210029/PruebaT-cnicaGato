import { describe, it, expect } from 'vitest';
import { deriveCheckinContext, isEligibleCheckinDate } from './time.js';

// America/Bogota is fixed UTC-5, no DST, so this literal offset is safe for every test date.
const bogota = (localDateTime) => new Date(`${localDateTime}-05:00`);

describe('deriveCheckinContext', () => {
  it('derives today and yesterday from the server clock, any time of day', () => {
    expect(deriveCheckinContext(bogota('2026-10-05T09:15:00')).calendarDate).toBe('2026-10-05');
    expect(deriveCheckinContext(bogota('2026-10-05T09:15:00')).yesterday).toBe('2026-10-04');
    expect(deriveCheckinContext(bogota('2026-10-05T23:59:00')).calendarDate).toBe('2026-10-05');
    expect(deriveCheckinContext(bogota('2026-10-06T00:00:00')).calendarDate).toBe('2026-10-06');
  });

  it('flags outside the competition range', () => {
    expect(deriveCheckinContext(bogota('2026-11-01T20:00:00')).withinCompetition).toBe(false);
    expect(deriveCheckinContext(bogota('2026-09-30T20:00:00')).withinCompetition).toBe(false);
    expect(deriveCheckinContext(bogota('2026-10-01T20:00:00')).withinCompetition).toBe(true);
  });
});

describe('isEligibleCheckinDate', () => {
  const ctx = deriveCheckinContext(bogota('2026-10-05T09:15:00'));

  it('accepts today', () => {
    expect(isEligibleCheckinDate('2026-10-05', ctx)).toBe(true);
  });

  it('accepts yesterday', () => {
    expect(isEligibleCheckinDate('2026-10-04', ctx)).toBe(true);
  });

  it('rejects the day before yesterday', () => {
    expect(isEligibleCheckinDate('2026-10-03', ctx)).toBe(false);
  });

  it('rejects a future date', () => {
    expect(isEligibleCheckinDate('2026-10-06', ctx)).toBe(false);
  });

  it('rejects a date outside the competition even if it would otherwise be "yesterday"', () => {
    const edgeCtx = deriveCheckinContext(bogota('2026-10-01T09:00:00'));
    expect(edgeCtx.yesterday).toBe('2026-09-30');
    expect(isEligibleCheckinDate('2026-09-30', edgeCtx)).toBe(false);
  });
});
