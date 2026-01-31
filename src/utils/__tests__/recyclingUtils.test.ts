import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  resolveCertName,
  normalizeCertName,
  getRecyclingInfo,
  getRecyclingAlerts,
  formatRecyclingDate,
  getRecyclingLabel,
} from '../recyclingUtils';

describe('recyclingUtils', () => {
  // ─── resolveCertName ───────────────────────────────────
  describe('resolveCertName', () => {
    it('resolves alias "BLS AED" to "BLS-AED"', () => {
      expect(resolveCertName('BLS AED')).toBe('BLS-AED');
    });

    it('resolves alias "Expert BLS AED" to "Expert BLS-AED"', () => {
      expect(resolveCertName('Expert BLS AED')).toBe('Expert BLS-AED');
    });

    it('returns original title when no alias exists', () => {
      expect(resolveCertName('Pro Pool')).toBe('Pro Pool');
      expect(resolveCertName('Autre diplôme')).toBe('Autre diplôme');
    });
  });

  // ─── normalizeCertName ─────────────────────────────────
  describe('normalizeCertName', () => {
    it('normalizes to lowercase with alias resolution', () => {
      expect(normalizeCertName('BLS AED')).toBe('bls-aed');
      expect(normalizeCertName('Expert Pool')).toBe('expert pool');
    });

    it('trims whitespace', () => {
      expect(normalizeCertName('  Pro Pool  ')).toBe('pro pool');
    });
  });

  // ─── getRecyclingInfo ──────────────────────────────────
  describe('getRecyclingInfo', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns unknown for unrecognized certification', () => {
      const info = getRecyclingInfo({ id: '1', title: 'Diplôme Inconnu', start_date: '2024-01-01' });
      expect(info.status).toBe('unknown');
      expect(info.nextRecyclingDue).toBeNull();
    });

    it('returns no_recycling for Base Pool', () => {
      const info = getRecyclingInfo({ id: '1', title: 'Base Pool', start_date: '2024-01-01' });
      expect(info.status).toBe('no_recycling');
      expect(info.nextRecyclingDue).toBeNull();
    });

    it('returns valid for recently obtained BLS-AED (4 year period)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 15)); // 15 jan 2025

      const info = getRecyclingInfo({ id: '1', title: 'BLS-AED', start_date: '2025-01-01' });
      // Expiry: 2025 + 4 = 2029, deadline 31/12/2029
      expect(info.status).toBe('valid');
      expect(info.deadlineYear).toBe(2029);
      expect(info.recyclingPeriodYears).toBe(4);
      expect(info.daysRemaining).toBeGreaterThan(365);
    });

    it('handles alias "BLS AED" same as "BLS-AED"', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 15));

      const info = getRecyclingInfo({ id: '1', title: 'BLS AED', start_date: '2025-01-01' });
      expect(info.recyclingPeriodYears).toBe(4);
      expect(info.deadlineYear).toBe(2029);
    });

    it('returns expired when past deadline', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15)); // 15 juin 2026

      // Pro Pool obtained 2024-01-01, period 2 years → expiry 2026, deadline 31/12/2026
      // On 15 juin 2026 → same year → expiring_soon, not expired
      // Let's use a date that IS expired:
      const info = getRecyclingInfo({ id: '1', title: 'Pro Pool', start_date: '2022-01-01' });
      // 2022 + 2 = 2024, deadline 31/12/2024
      // Today 2026-06-15 > 31/12/2024 → expired
      expect(info.status).toBe('expired');
      expect(info.daysRemaining).toBeLessThan(0);
    });

    it('returns expiring_soon when in the same year as deadline', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15)); // 15 juin 2026

      // Pro Pool obtained 2024-06-01, period 2 years → expiry 2026, deadline 31/12/2026
      const info = getRecyclingInfo({ id: '1', title: 'Pro Pool', start_date: '2024-06-01' });
      expect(info.status).toBe('expiring_soon');
      expect(info.deadlineYear).toBe(2026);
    });

    it('uses end_date as reference when provided', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 15));

      const info = getRecyclingInfo({
        id: '1',
        title: 'Expert Pool',
        start_date: '2020-01-01',
        end_date: '2024-06-01',
      });
      // Reference = end_date 2024-06-01, period 2 years → 2026, deadline 31/12/2026
      expect(info.deadlineYear).toBe(2026);
      expect(info.recyclingPeriodYears).toBe(2);
    });

    it('returns reminder status when past 12 months from reference', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 15)); // 15 mars 2026

      // Module Lac obtained 2025-01-01, period 4 years → 2029, deadline 31/12/2029
      // Reminder after 12 months = 2026-01-01
      // Today 2026-03-15 is past reminder date but before 2029 → reminder
      const info = getRecyclingInfo({ id: '1', title: 'Module Lac', start_date: '2025-01-01' });
      expect(info.status).toBe('reminder');
    });
  });

  // ─── getRecyclingAlerts ────────────────────────────────
  describe('getRecyclingAlerts', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns empty array for formations with no alerts', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 15));

      const alerts = getRecyclingAlerts([
        { id: '1', title: 'Base Pool', start_date: '2024-01-01' },
        { id: '2', title: 'BLS-AED', start_date: '2025-01-01' },
      ]);
      expect(alerts).toEqual([]);
    });

    it('returns alerts sorted by urgency (expired first)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 5, 15)); // 15 juin 2027

      const alerts = getRecyclingAlerts([
        // Pro Pool 2024 → expired (deadline 31/12/2026)
        { id: '1', title: 'Pro Pool', start_date: '2024-01-01', organization: 'SSS' },
        // Expert Pool 2025 → expiring_soon (deadline 31/12/2027)
        { id: '2', title: 'Expert Pool', start_date: '2025-06-01', organization: 'SSS' },
      ]);

      expect(alerts.length).toBe(2);
      expect(alerts[0].status).toBe('expired');
      expect(alerts[0].formationId).toBe('1');
      expect(alerts[1].status).toBe('expiring_soon');
    });

    it('excludes valid and unknown formations', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 15));

      const alerts = getRecyclingAlerts([
        { id: '1', title: 'Diplôme Inconnu', start_date: '2020-01-01' },
        { id: '2', title: 'Base Pool', start_date: '2020-01-01' },
        { id: '3', title: 'BLS-AED', start_date: '2025-01-01' },
      ]);
      expect(alerts).toEqual([]);
    });
  });

  // ─── formatRecyclingDate ───────────────────────────────
  describe('formatRecyclingDate', () => {
    it('formats date in dd/MM/yyyy French format', () => {
      expect(formatRecyclingDate(new Date(2026, 11, 31))).toBe('31/12/2026');
    });

    it('pads single-digit days and months', () => {
      expect(formatRecyclingDate(new Date(2025, 0, 5))).toBe('05/01/2025');
    });
  });

  // ─── getRecyclingLabel ─────────────────────────────────
  describe('getRecyclingLabel', () => {
    it('returns expired label with year', () => {
      const label = getRecyclingLabel({
        status: 'expired',
        nextRecyclingDue: new Date(2024, 11, 31),
        daysRemaining: -180,
        recyclingPeriodYears: 2,
        deadlineYear: 2024,
      });
      expect(label).toBe('Recyclage expiré depuis le 31/12/2024');
    });

    it('returns expiring_soon label with year', () => {
      const label = getRecyclingLabel({
        status: 'expiring_soon',
        nextRecyclingDue: new Date(2026, 11, 31),
        daysRemaining: 200,
        recyclingPeriodYears: 2,
        deadlineYear: 2026,
      });
      expect(label).toBe('Recyclage avant fin 2026');
    });

    it('returns reminder label with year', () => {
      const label = getRecyclingLabel({
        status: 'reminder',
        nextRecyclingDue: new Date(2028, 11, 31),
        daysRemaining: 900,
        recyclingPeriodYears: 4,
        deadlineYear: 2028,
      });
      expect(label).toBe('Pensez à recycler (fin 2028)');
    });

    it('returns valid label with year', () => {
      const label = getRecyclingLabel({
        status: 'valid',
        nextRecyclingDue: new Date(2029, 11, 31),
        daysRemaining: 1800,
        recyclingPeriodYears: 4,
        deadlineYear: 2029,
      });
      expect(label).toBe("Valide jusqu'à fin 2029");
    });

    it('returns null for unknown status', () => {
      expect(getRecyclingLabel({
        status: 'unknown',
        nextRecyclingDue: null,
        daysRemaining: null,
        recyclingPeriodYears: null,
        deadlineYear: null,
      })).toBeNull();
    });

    it('returns null for no_recycling status', () => {
      expect(getRecyclingLabel({
        status: 'no_recycling',
        nextRecyclingDue: null,
        daysRemaining: null,
        recyclingPeriodYears: null,
        deadlineYear: null,
      })).toBeNull();
    });
  });
});
