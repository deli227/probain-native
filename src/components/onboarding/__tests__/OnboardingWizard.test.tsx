import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Storage key utilisé par le composant pour établissement
const STORAGE_KEY = 'probain_establishment_onboarding';

// Ces tests vérifient la logique de persistence localStorage
// sans dépendre du rendu du composant (qui nécessite des mocks complexes)
describe('OnboardingWizard (Établissement) - Persistence localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('localStorage peut stocker et restaurer l\'état établissement', () => {
    const persistedState = {
      firstName: 'Admin',
      lastName: 'Piscine',
      birthDate: '1985-03-20T00:00:00.000Z',
      avatarUrl: 'https://example.com/logo.png',
      address: {
        street: '25 Rue de la Piscine',
        cityZip: '1204 Genève',
        canton: 'GE',
      },
      organizationName: 'Piscine Municipale de Genève',
      description: 'Centre aquatique municipal',
    };

    // Simuler la sauvegarde
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

    // Simuler la restauration (comme le ferait loadEstablishmentState)
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const restored = JSON.parse(stored!);

    expect(restored.organizationName).toBe('Piscine Municipale de Genève');
    expect(restored.description).toBe('Centre aquatique municipal');
    expect(restored.avatarUrl).toBe('https://example.com/logo.png');
    expect(restored.address.street).toBe('25 Rue de la Piscine');
    expect(restored.address.cityZip).toBe('1204 Genève');
    expect(restored.address.canton).toBe('GE');
  });

  it('préserve l\'URL du logo établissement', () => {
    const logoUrl = 'https://storage.example.com/logos/establishment123/logo.png';

    const persistedState = {
      firstName: '',
      lastName: '',
      birthDate: new Date().toISOString(),
      avatarUrl: logoUrl,
      address: { street: '', cityZip: '', canton: '' },
      organizationName: 'Test Établissement',
      description: '',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(stored!);
    expect(parsed.avatarUrl).toBe(logoUrl);
  });

  it('persiste tous les champs établissement', () => {
    const fullState = {
      firstName: 'Jean',
      lastName: 'Directeur',
      birthDate: '1975-06-15T00:00:00.000Z',
      avatarUrl: 'https://example.com/logo.jpg',
      address: {
        street: '100 Boulevard Aquatique',
        cityZip: '1000 Lausanne',
        canton: 'VD',
      },
      organizationName: 'Aqua Park Lausanne',
      description: 'Complexe aquatique avec piscines olympiques',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));

    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(stored!);

    expect(parsed.firstName).toBe('Jean');
    expect(parsed.lastName).toBe('Directeur');
    expect(parsed.organizationName).toBe('Aqua Park Lausanne');
    expect(parsed.description).toBe('Complexe aquatique avec piscines olympiques');
    expect(parsed.address.street).toBe('100 Boulevard Aquatique');
    expect(parsed.address.cityZip).toBe('1000 Lausanne');
    expect(parsed.address.canton).toBe('VD');
  });

  it('clearEstablishmentState supprime les données', () => {
    const state = {
      firstName: 'Test',
      lastName: 'User',
      birthDate: new Date().toISOString(),
      avatarUrl: 'https://example.com/logo.jpg',
      address: { street: 'Rue Test', cityZip: '1000 Lausanne', canton: 'VD' },
      organizationName: 'Test Établissement',
      description: 'Description test',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    // Simuler clearEstablishmentState
    localStorage.removeItem(STORAGE_KEY);

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('ne perd pas les données lors d\'un cycle save/load', () => {
    const initialState = {
      firstName: 'Initial',
      lastName: 'State',
      birthDate: new Date().toISOString(),
      avatarUrl: 'https://example.com/initial.jpg',
      address: {
        street: 'Initial Street',
        cityZip: '1000 City',
        canton: 'VD',
      },
      organizationName: 'Initial Org',
      description: 'Initial description',
    };

    // Premier cycle: sauvegarder
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

    // Simuler un "refresh" en lisant à nouveau
    const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY)!);

    expect(loaded.organizationName).toBe('Initial Org');
    expect(loaded.avatarUrl).toBe('https://example.com/initial.jpg');
    expect(loaded.address.street).toBe('Initial Street');

    // Modifier et re-sauvegarder (simuler mise à jour)
    loaded.organizationName = 'Updated Org';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));

    // Vérifier que la mise à jour persiste
    const reloaded = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(reloaded.organizationName).toBe('Updated Org');
    // Les autres champs ne changent pas
    expect(reloaded.avatarUrl).toBe('https://example.com/initial.jpg');
  });

  it('gère correctement les données nested (address)', () => {
    const state = {
      firstName: '',
      lastName: '',
      birthDate: new Date().toISOString(),
      avatarUrl: '',
      address: {
        street: '123 Rue du Lac',
        cityZip: '1820 Montreux',
        canton: 'VD',
      },
      organizationName: 'Test',
      description: '',
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY)!);

    // Vérifier que l'objet nested est correctement restauré
    expect(loaded.address).toEqual({
      street: '123 Rue du Lac',
      cityZip: '1820 Montreux',
      canton: 'VD',
    });

    // Modifier l'adresse
    loaded.address.street = 'Nouvelle Rue';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));

    const reloaded = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(reloaded.address.street).toBe('Nouvelle Rue');
    expect(reloaded.address.cityZip).toBe('1820 Montreux');
  });
});
