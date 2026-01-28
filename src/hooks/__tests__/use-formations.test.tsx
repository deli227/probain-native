import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules BEFORE importing the hook
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock safeGetUser - utilisé par le hook au lieu de supabase.auth.getUser
vi.mock('@/utils/asyncHelpers', () => ({
  safeGetUser: vi.fn(),
}));

// NOW import after mocking
import { useFormations } from '../use-formations';
import { supabase } from '@/integrations/supabase/client';
import { safeGetUser } from '@/utils/asyncHelpers';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      }
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useFormations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default chain mocks
    const mockOrder = vi.fn();
    const mockEq = vi.fn();
    const mockSelect = vi.fn();

    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    // Mock safeGetUser pour retourner un utilisateur authentifié
    vi.mocked(safeGetUser).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    } as any);
  });

  it('charge les formations avec succès', async () => {
    const mockFormations = [
      {
        id: '1',
        title: 'BNSSA',
        organization: 'Test Org',
        start_date: '2024-01-01',
        end_date: null,
        user_id: 'test-user-id'
      }
    ];

    // Override the order mock for this test
    const mockOrder = vi.fn().mockResolvedValue({
      data: mockFormations,
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { result } = renderHook(() => useFormations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.formations).toHaveLength(1);
    expect(result.current.formations[0].title).toBe('BNSSA');
    expect(result.current.formations[0].organization).toBe('Test Org');
  });

  it('retourne un tableau vide quand aucune formation', async () => {
    const { result } = renderHook(() => useFormations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.formations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
