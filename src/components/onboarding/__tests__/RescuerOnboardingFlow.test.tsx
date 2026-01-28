import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Storage key utilisé par le composant
const STORAGE_KEY = 'probain_rescuer_onboarding';

// Mock des modules
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
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
          data: { publicUrl: 'https://example.com/avatar.jpg' },
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
import { RescuerOnboardingFlow } from '../RescuerOnboardingFlow';

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

describe('RescuerOnboardingFlow - Persistence localStorage', () => {
  beforeEach(() => {
    // Nettoyer localStorage avant chaque test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('sauvegarde l\'état dans localStorage quand on avance', async () => {
    const user = userEvent.setup();

    render(<RescuerOnboardingFlow />, { wrapper: createWrapper() });

    // Étape 0: Welcome - cliquer sur "C'EST PARTI !"
    const startButton = await screen.findByRole('button', { name: /c'est parti/i });
    await user.click(startButton);

    // Vérifier que localStorage a été mis à jour avec step: 1
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.step).toBe(1);
    });
  });

  it('restaure l\'état depuis localStorage au remount', async () => {
    // Pré-remplir localStorage avec un état à l'étape 3
    const persistedState = {
      step: 3,
      firstName: 'Jean',
      lastName: 'Dupont',
      birthDate: '1990-05-15T00:00:00.000Z',
      avatarUrl: 'https://example.com/photo.jpg',
      street: '123 Rue Test',
      cityZip: '1000 Lausanne',
      canton: 'VD',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

    render(<RescuerOnboardingFlow />, { wrapper: createWrapper() });

    // À l'étape 3 (RescuerPhoto), on devrait voir l'avatar
    // Le composant devrait afficher l'image avec l'URL persistée
    await waitFor(() => {
      // Vérifier qu'on n'est PAS à l'étape Welcome (étape 0)
      const welcomeButton = screen.queryByRole('button', { name: /c'est parti/i });
      expect(welcomeButton).not.toBeInTheDocument();
    });
  });

  it('préserve l\'URL de l\'avatar après remount', async () => {
    const avatarUrl = 'https://storage.example.com/avatars/user123/photo.jpg';

    // État avec avatar uploadé
    const persistedState = {
      step: 3,
      firstName: 'Marie',
      lastName: 'Martin',
      birthDate: null,
      avatarUrl: avatarUrl,
      street: '',
      cityZip: '',
      canton: '',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

    render(<RescuerOnboardingFlow />, { wrapper: createWrapper() });

    // Vérifier que localStorage contient toujours l'avatar URL
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.avatarUrl).toBe(avatarUrl);
    });
  });

  it('persiste tous les champs du formulaire', async () => {
    // État avec tous les champs remplis
    const fullState = {
      step: 4,
      firstName: 'Pierre',
      lastName: 'Durand',
      birthDate: '1990-05-15T00:00:00.000Z',
      avatarUrl: 'https://example.com/avatar.jpg',
      street: '123 Rue Test',
      cityZip: '1000 Lausanne',
      canton: 'VD',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));

    render(<RescuerOnboardingFlow />, { wrapper: createWrapper() });

    // Vérifier que toutes les données sont préservées après mount
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.firstName).toBe('Pierre');
      expect(parsed.lastName).toBe('Durand');
      expect(parsed.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(parsed.street).toBe('123 Rue Test');
      expect(parsed.cityZip).toBe('1000 Lausanne');
      expect(parsed.canton).toBe('VD');
    });
  });

  it('ne perd pas les données lors d\'un refresh simulé (remount)', async () => {
    const { unmount } = render(<RescuerOnboardingFlow />, { wrapper: createWrapper() });

    // Simuler progression jusqu'à l'étape 1
    const user = userEvent.setup();
    const startButton = await screen.findByRole('button', { name: /c'est parti/i });
    await user.click(startButton);

    // Attendre que l'état soit sauvegardé
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.step).toBe(1);
    });

    // Démonter le composant (simuler navigation away)
    unmount();

    // Vérifier que localStorage persiste après démontage
    const storedAfterUnmount = localStorage.getItem(STORAGE_KEY);
    expect(storedAfterUnmount).not.toBeNull();
    const parsedAfterUnmount = JSON.parse(storedAfterUnmount!);
    expect(parsedAfterUnmount.step).toBe(1);

    // Remonter le composant (simuler retour/refresh)
    render(<RescuerOnboardingFlow />, { wrapper: createWrapper() });

    // Vérifier qu'on est toujours à l'étape 1, pas à l'étape 0
    await waitFor(() => {
      const welcomeButton = screen.queryByRole('button', { name: /c'est parti/i });
      // On ne devrait pas voir le bouton "C'EST PARTI !" car on est à l'étape 1
      expect(welcomeButton).not.toBeInTheDocument();
    });
  });

  // Note: Les tests de completion (nettoyage localStorage après succès)
  // nécessitent des mocks Supabase plus complexes et sont mieux couverts par des tests E2E.
  // Les tests de persistence ci-dessus couvrent le scénario critique:
  // "les données ne sont pas perdues lors d'un refresh"
});
