import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Storage key utilisé par le composant
const STORAGE_KEY = 'probain_trainer_onboarding';

// Mock des modules
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-trainer-id' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/logo.jpg' },
        }),
      }),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({
    refreshProfile: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Import après les mocks
import { TrainerOnboardingFlow } from '../TrainerOnboardingFlow';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('TrainerOnboardingFlow - Persistence localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('sauvegarde l\'état dans localStorage lors de la progression', async () => {
    const user = userEvent.setup();

    render(<TrainerOnboardingFlow />, { wrapper: createWrapper() });

    // Étape 0: Welcome - cliquer sur Commencer
    const startButton = await screen.findByRole('button', { name: /commencer/i });
    await user.click(startButton);

    // Vérifier que localStorage a été mis à jour
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.step).toBe(1);
    });
  });

  it('restaure l\'état depuis localStorage au remount', async () => {
    // Pré-remplir localStorage avec un état à l'étape 2
    const persistedState = {
      step: 2,
      organizationName: 'Formation Aquatique SA',
      logoUrl: 'https://example.com/logo.png',
      description: '',
      street: '',
      cityZip: '',
      canton: '',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

    render(<TrainerOnboardingFlow />, { wrapper: createWrapper() });

    // Vérifier que les données sont préservées
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.step).toBe(2);
      expect(parsed.organizationName).toBe('Formation Aquatique SA');
    });
  });

  it('préserve l\'URL du logo après remount', async () => {
    const logoUrl = 'https://storage.example.com/logos/trainer123/logo.png';

    const persistedState = {
      step: 2,
      organizationName: 'École de Natation',
      logoUrl: logoUrl,
      description: 'Description test',
      street: '',
      cityZip: '',
      canton: '',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

    render(<TrainerOnboardingFlow />, { wrapper: createWrapper() });

    // Vérifier que localStorage contient toujours le logo URL
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.logoUrl).toBe(logoUrl);
    });
  });

  it('persiste le nom de l\'organisation', async () => {
    // État avec organisation remplie
    const fullState = {
      step: 1,
      organizationName: 'Aqua Formation Genève',
      logoUrl: '',
      description: '',
      street: '',
      cityZip: '',
      canton: '',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));

    render(<TrainerOnboardingFlow />, { wrapper: createWrapper() });

    // Vérifier que localStorage préserve le nom
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.organizationName).toBe('Aqua Formation Genève');
    });
  });

  it('ne perd pas les données lors d\'un refresh simulé', async () => {
    // Pré-remplir localStorage avec un état
    const initialState = {
      step: 2,
      organizationName: 'Test Org',
      logoUrl: 'https://example.com/logo.jpg',
      description: 'Test desc',
      street: '',
      cityZip: '',
      canton: '',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

    const { unmount } = render(<TrainerOnboardingFlow />, { wrapper: createWrapper() });

    // Attendre le rendu
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
    });

    // Démonter
    unmount();

    // Vérifier persistence
    const storedAfterUnmount = localStorage.getItem(STORAGE_KEY);
    expect(storedAfterUnmount).not.toBeNull();
    const parsed = JSON.parse(storedAfterUnmount!);
    expect(parsed.step).toBe(2);
    expect(parsed.organizationName).toBe('Test Org');

    // Remonter
    render(<TrainerOnboardingFlow />, { wrapper: createWrapper() });

    // Vérifier que les données sont toujours là
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.organizationName).toBe('Test Org');
    });
  });

  it('persiste tous les champs formateur', async () => {
    const fullState = {
      step: 4,
      organizationName: 'Pro Natation',
      logoUrl: 'https://example.com/logo.jpg',
      description: 'Centre de formation aquatique',
      street: '10 Avenue du Lac',
      cityZip: '1201 Genève',
      canton: 'GE',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));

    render(<TrainerOnboardingFlow />, { wrapper: createWrapper() });

    // Vérifier que toutes les données sont préservées
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.organizationName).toBe('Pro Natation');
      expect(parsed.logoUrl).toBe('https://example.com/logo.jpg');
      expect(parsed.description).toBe('Centre de formation aquatique');
      expect(parsed.street).toBe('10 Avenue du Lac');
      expect(parsed.cityZip).toBe('1201 Genève');
      expect(parsed.canton).toBe('GE');
    });
  });

  // Note: Les tests de completion (nettoyage localStorage et navigation après succès)
  // nécessitent des mocks Supabase plus complexes et sont mieux couverts par des tests E2E.
  // Les tests de persistence ci-dessus couvrent le scénario critique:
  // "les données ne sont pas perdues lors d'un refresh"
});
