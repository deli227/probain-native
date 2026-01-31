import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase BEFORE importing the hook
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/utils/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { useAvailabilities } from '../use-availabilities';
import { supabase } from '@/integrations/supabase/client';

describe('useAvailabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── fetchAvailabilities ───────────────────────────────
  describe('fetchAvailabilities', () => {
    it('fetches and returns dates as local Date objects', async () => {
      const mockData = [
        { date: '2026-01-31', is_available: true },
        { date: '2026-02-15', is_available: true },
      ];

      const mockEq2 = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const { result } = renderHook(() => useAvailabilities());

      let dates: Date[] = [];
      await act(async () => {
        dates = await result.current.fetchAvailabilities('user-123');
      });

      expect(dates).toHaveLength(2);

      // Critical timezone test: "2026-01-31" must be January 31 local, NOT January 30 UTC
      const jan31 = dates[0];
      expect(jan31.getFullYear()).toBe(2026);
      expect(jan31.getMonth()).toBe(0); // January = 0
      expect(jan31.getDate()).toBe(31);

      const feb15 = dates[1];
      expect(feb15.getFullYear()).toBe(2026);
      expect(feb15.getMonth()).toBe(1); // February = 1
      expect(feb15.getDate()).toBe(15);
    });

    it('returns empty array on error', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const { result } = renderHook(() => useAvailabilities());

      let dates: Date[] = [];
      await act(async () => {
        dates = await result.current.fetchAvailabilities('user-123');
      });

      expect(dates).toEqual([]);
    });

    it('returns empty array when no availabilities exist', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const { result } = renderHook(() => useAvailabilities());

      let dates: Date[] = [];
      await act(async () => {
        dates = await result.current.fetchAvailabilities('user-123');
      });

      expect(dates).toEqual([]);
    });
  });

  // ─── saveAvailabilities ────────────────────────────────
  describe('saveAvailabilities', () => {
    it('deletes existing and inserts new dates using local format', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'availabilities') {
          return { delete: mockDelete, insert: mockInsert } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useAvailabilities());

      const testDates = [
        new Date(2026, 0, 31), // 31 janvier 2026 (local)
        new Date(2026, 5, 15), // 15 juin 2026 (local)
      ];

      await act(async () => {
        await result.current.saveAvailabilities(testDates, 'user-123');
      });

      // Check delete was called
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith('user_id', 'user-123');

      // Check insert was called with correct local date format
      expect(mockInsert).toHaveBeenCalledWith([
        { user_id: 'user-123', date: '2026-01-31', is_available: true },
        { user_id: 'user-123', date: '2026-06-15', is_available: true },
      ]);
    });

    it('skips insert when dates array is empty', async () => {
      const mockInsert = vi.fn();
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete, insert: mockInsert } as any);

      const { result } = renderHook(() => useAvailabilities());

      await act(async () => {
        await result.current.saveAvailabilities([], 'user-123');
      });

      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('throws and shows toast on delete error', async () => {
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      const { result } = renderHook(() => useAvailabilities());

      await expect(
        act(async () => {
          await result.current.saveAvailabilities([new Date()], 'user-123');
        })
      ).rejects.toBeTruthy();
    });
  });

  // ─── clearAvailabilities ───────────────────────────────
  describe('clearAvailabilities', () => {
    it('deletes all availabilities for user', async () => {
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      const { result } = renderHook(() => useAvailabilities());

      await act(async () => {
        await result.current.clearAvailabilities('user-123');
      });

      expect(supabase.from).toHaveBeenCalledWith('availabilities');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('throws on error', async () => {
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: { message: 'Error' } });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      const { result } = renderHook(() => useAvailabilities());

      await expect(
        act(async () => {
          await result.current.clearAvailabilities('user-123');
        })
      ).rejects.toBeTruthy();
    });
  });

  // ─── loading state ─────────────────────────────────────
  describe('loading state', () => {
    it('starts with loading false', () => {
      const { result } = renderHook(() => useAvailabilities());
      expect(result.current.loading).toBe(false);
    });
  });
});
