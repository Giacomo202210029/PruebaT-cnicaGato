import { describe, it, expect } from 'vitest';
import { currentStreak, longestStreak, totalClean, unlockedMilestones, rankUsers } from './streaks.js';
import { STATUS } from './constants.js';

const day = (date, status) => ({ date, status });

describe('currentStreak', () => {
  it('is 0 with no records', () => {
    expect(currentStreak([])).toBe(0);
  });

  it('counts consecutive clean days ending at the latest record', () => {
    const records = [day('2026-10-01', STATUS.CLEAN), day('2026-10-02', STATUS.CLEAN), day('2026-10-03', STATUS.CLEAN)];
    expect(currentStreak(records)).toBe(3);
  });

  it('is 0 if the latest day is a relapse', () => {
    const records = [day('2026-10-01', STATUS.CLEAN), day('2026-10-02', STATUS.RELAPSE)];
    expect(currentStreak(records)).toBe(0);
  });

  it('a missing day (gap) breaks the streak just like a relapse would', () => {
    const records = [day('2026-10-01', STATUS.CLEAN), day('2026-10-03', STATUS.CLEAN)];
    expect(currentStreak(records)).toBe(1);
  });

  it('a no_reportado day breaks the streak', () => {
    const records = [
      day('2026-10-01', STATUS.CLEAN),
      day('2026-10-02', STATUS.NO_REPORTADO),
      day('2026-10-03', STATUS.CLEAN),
    ];
    expect(currentStreak(records)).toBe(1);
  });
});

describe('longestStreak', () => {
  it('finds the longest run anywhere, not just at the end', () => {
    const records = [
      day('2026-10-01', STATUS.CLEAN),
      day('2026-10-02', STATUS.CLEAN),
      day('2026-10-03', STATUS.CLEAN),
      day('2026-10-04', STATUS.RELAPSE),
      day('2026-10-05', STATUS.CLEAN),
    ];
    expect(longestStreak(records)).toBe(3);
  });

  it('is 0 with no clean days', () => {
    expect(longestStreak([day('2026-10-01', STATUS.RELAPSE)])).toBe(0);
  });
});

describe('totalClean', () => {
  it('counts only clean days', () => {
    const records = [
      day('2026-10-01', STATUS.CLEAN),
      day('2026-10-02', STATUS.RELAPSE),
      day('2026-10-03', STATUS.NO_REPORTADO),
      day('2026-10-04', STATUS.CLEAN),
    ];
    expect(totalClean(records)).toBe(2);
  });
});

describe('unlockedMilestones', () => {
  it('returns only milestones reached so far', () => {
    expect(unlockedMilestones(10, [7, 14, 21, 31])).toEqual([7]);
  });
});

describe('rankUsers', () => {
  it('ranks by totalClean, then longestStreak, then currentStreak', () => {
    const a = { userId: 'a', totalClean: 10, longestStreak: 5, currentStreak: 2 };
    const b = { userId: 'b', totalClean: 12, longestStreak: 3, currentStreak: 1 };
    const c = { userId: 'c', totalClean: 10, longestStreak: 6, currentStreak: 0 };
    expect(rankUsers([a, b, c]).map((u) => u.userId)).toEqual(['b', 'c', 'a']);
  });
});
