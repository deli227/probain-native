import { describe, it, expect } from 'vitest';
import {
  sortCertificationsByLevel,
  sortJobsByDate,
  getCertificationPriority,
  isKnownCertification,
  CERTIFICATION_PRIORITY,
} from '../sortingUtils';

describe('sortingUtils', () => {
  // ─── sortCertificationsByLevel ─────────────────────────
  describe('sortCertificationsByLevel', () => {
    it('sorts certifications from highest to lowest level', () => {
      const certs = [
        { title: 'Base Pool' },
        { title: 'Expert BLS AED' },
        { title: 'Pro Pool' },
        { title: 'Expert Pool' },
      ];

      const sorted = sortCertificationsByLevel(certs);
      expect(sorted.map(c => c.title)).toEqual([
        'Expert BLS AED',
        'Expert Pool',
        'Pro Pool',
        'Base Pool',
      ]);
    });

    it('places unknown certifications at the end', () => {
      const certs = [
        { title: 'Diplôme inconnu' },
        { title: 'Base Pool' },
        { title: 'BLS AED' },
      ];

      const sorted = sortCertificationsByLevel(certs);
      expect(sorted[sorted.length - 1].title).toBe('Diplôme inconnu');
    });

    it('does not mutate the original array', () => {
      const certs = [{ title: 'Base Pool' }, { title: 'Expert Pool' }];
      const original = [...certs];
      sortCertificationsByLevel(certs);
      expect(certs).toEqual(original);
    });

    it('handles empty array', () => {
      expect(sortCertificationsByLevel([])).toEqual([]);
    });

    it('supports "name" property as fallback', () => {
      const certs = [
        { name: 'Base Pool' },
        { name: 'Expert Pool' },
      ];
      const sorted = sortCertificationsByLevel(certs);
      expect(sorted[0].name).toBe('Expert Pool');
    });

    it('handles BLS-AED and BLS AED as same priority', () => {
      const p1 = CERTIFICATION_PRIORITY['BLS AED'];
      const p2 = CERTIFICATION_PRIORITY['BLS-AED'];
      expect(p1).toBe(p2);
    });
  });

  // ─── sortJobsByDate ────────────────────────────────────
  describe('sortJobsByDate', () => {
    it('sorts jobs from most recent to oldest', () => {
      const jobs = [
        { id: 1, created_at: '2024-01-01T00:00:00Z' },
        { id: 2, created_at: '2025-06-15T00:00:00Z' },
        { id: 3, created_at: '2024-06-01T00:00:00Z' },
      ];

      const sorted = sortJobsByDate(jobs);
      expect(sorted.map(j => j.id)).toEqual([2, 3, 1]);
    });

    it('handles missing created_at', () => {
      const jobs = [
        { id: 1 },
        { id: 2, created_at: '2025-01-01T00:00:00Z' },
      ];

      const sorted = sortJobsByDate(jobs);
      expect(sorted[0].id).toBe(2);
    });

    it('does not mutate the original array', () => {
      const jobs = [{ created_at: '2025-01-01' }, { created_at: '2024-01-01' }];
      const original = [...jobs];
      sortJobsByDate(jobs);
      expect(jobs).toEqual(original);
    });

    it('handles empty array', () => {
      expect(sortJobsByDate([])).toEqual([]);
    });
  });

  // ─── getCertificationPriority ──────────────────────────
  describe('getCertificationPriority', () => {
    it('returns correct priority for known certifications', () => {
      expect(getCertificationPriority('Expert BLS AED')).toBe(1);
      expect(getCertificationPriority('Base Pool')).toBe(10);
    });

    it('returns 999 for unknown certifications', () => {
      expect(getCertificationPriority('Unknown Cert')).toBe(999);
    });
  });

  // ─── isKnownCertification ──────────────────────────────
  describe('isKnownCertification', () => {
    it('returns true for known certifications', () => {
      expect(isKnownCertification('Expert Pool')).toBe(true);
      expect(isKnownCertification('BLS-AED')).toBe(true);
    });

    it('returns false for unknown certifications', () => {
      expect(isKnownCertification('Random Diploma')).toBe(false);
    });
  });
});
