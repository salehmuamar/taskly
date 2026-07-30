import { describe, it, expect } from 'vitest';
import {
  statusBadgeStyles,
  priorityBadgeStyles,
  statusColors,
  priorityColors,
  statusDots,
  priorityDots,
} from '@/shared/lib/constants';

describe('statusBadgeStyles', () => {
  it('has styles for all task statuses', () => {
    const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];
    for (const status of statuses) {
      expect(statusBadgeStyles[status]).toBeDefined();
      expect(statusBadgeStyles[status].bg).toBeTruthy();
      expect(statusBadgeStyles[status].text).toBeTruthy();
    }
  });

  it('has styles for all project statuses', () => {
    const statuses = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];
    for (const status of statuses) {
      expect(statusBadgeStyles[status]).toBeDefined();
    }
  });
});

describe('priorityBadgeStyles', () => {
  it('has styles for all priorities', () => {
    const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
    for (const priority of priorities) {
      expect(priorityBadgeStyles[priority]).toBeDefined();
      expect(priorityBadgeStyles[priority].bg).toBeTruthy();
      expect(priorityBadgeStyles[priority].text).toBeTruthy();
    }
  });
});

describe('statusColors', () => {
  it('has Tailwind classes for all statuses', () => {
    for (const key of Object.keys(statusBadgeStyles)) {
      expect(statusColors[key]).toBeTruthy();
      expect(statusColors[key]).toContain('bg-');
      expect(statusColors[key]).toContain('text-');
    }
  });
});

describe('priorityColors', () => {
  it('has Tailwind classes for all priorities', () => {
    for (const key of Object.keys(priorityBadgeStyles)) {
      expect(priorityColors[key]).toBeTruthy();
    }
  });
});

describe('statusDots', () => {
  it('has dot colors for task statuses', () => {
    const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];
    for (const status of statuses) {
      expect(statusDots[status]).toBeTruthy();
      expect(statusDots[status]).toContain('bg-');
    }
  });
});

describe('priorityDots', () => {
  it('has dot colors for all priorities', () => {
    const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
    for (const priority of priorities) {
      expect(priorityDots[priority]).toBeTruthy();
    }
  });
});
