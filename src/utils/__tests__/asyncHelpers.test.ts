import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout, safeQuery } from '../asyncHelpers';

describe('asyncHelpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── withTimeout ───────────────────────────────────────
  describe('withTimeout', () => {
    it('resolves if promise completes within timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 5000);
      expect(result).toBe('success');
    });

    it('rejects with timeout error if promise takes too long', async () => {
      const neverResolve = new Promise<string>(() => {});
      const promise = withTimeout(neverResolve, 100, 'Custom timeout');

      vi.advanceTimersByTime(101);

      await expect(promise).rejects.toThrow('Custom timeout');
    });

    it('uses default error message', async () => {
      const neverResolve = new Promise<string>(() => {});
      const promise = withTimeout(neverResolve, 100);

      vi.advanceTimersByTime(101);

      await expect(promise).rejects.toThrow('Timeout dépassé');
    });

    it('uses default timeout of 5000ms', async () => {
      const neverResolve = new Promise<string>(() => {});
      const promise = withTimeout(neverResolve);

      vi.advanceTimersByTime(4999);
      // Should not have rejected yet — can't easily test this with fake timers + Promise.race
      // but we test that at 5001 it does reject
      vi.advanceTimersByTime(2);

      await expect(promise).rejects.toThrow('Timeout dépassé');
    });

    it('does not reject after promise resolves even if timer fires', async () => {
      const promise = withTimeout(Promise.resolve(42), 100);
      const result = await promise;
      expect(result).toBe(42);
      // Advancing timers should not cause errors
      vi.advanceTimersByTime(200);
    });
  });

  // ─── safeQuery ─────────────────────────────────────────
  describe('safeQuery', () => {
    it('resolves on first attempt when no error', async () => {
      vi.useRealTimers(); // Need real timers for async
      const result = await safeQuery(() => Promise.resolve('data'), 5000, 0);
      expect(result).toBe('data');
    });

    it('throws non-timeout errors immediately without retry', async () => {
      vi.useRealTimers();
      const fn = () => Promise.reject(new Error('Auth error'));

      await expect(safeQuery(fn, 5000, 2)).rejects.toThrow('Auth error');
    });

    it('retries on timeout errors', async () => {
      vi.useRealTimers();
      let attempt = 0;
      const fn = () => {
        attempt++;
        if (attempt < 3) return Promise.reject(new Error('Query timeout'));
        return Promise.resolve('success');
      };

      const result = await safeQuery(fn, 5000, 3);
      expect(result).toBe('success');
      expect(attempt).toBe(3);
    });

    it('accepts a direct promise (backward compat)', async () => {
      vi.useRealTimers();
      const result = await safeQuery(Promise.resolve('direct'), 5000, 0);
      expect(result).toBe('direct');
    });
  });
});
