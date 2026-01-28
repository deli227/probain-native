import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour la persistence localStorage de l'onboarding
 *
 * Note: Ces tests vérifient la persistence localStorage sans authentification.
 * Les tests avec authentification réelle nécessiteraient un environnement de test Supabase.
 */

test.describe('Persistence localStorage Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('localStorage peut stocker et restaurer l\'état sauveteur', async ({ page }) => {
    const STORAGE_KEY = 'probain_rescuer_onboarding';

    // Simuler un état sauvegardé
    await page.evaluate((key) => {
      const state = {
        step: 2,
        firstName: 'Jean',
        lastName: 'Dupont',
        photoUrl: 'https://example.com/photo.jpg',
        isUploading: false
      };
      localStorage.setItem(key, JSON.stringify(state));
    }, STORAGE_KEY);

    // Vérifier la récupération
    const stored = await page.evaluate((key) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }, STORAGE_KEY);

    expect(stored).not.toBeNull();
    expect(stored.step).toBe(2);
    expect(stored.firstName).toBe('Jean');
    expect(stored.lastName).toBe('Dupont');
    expect(stored.photoUrl).toBe('https://example.com/photo.jpg');
  });

  test('localStorage peut stocker et restaurer l\'état formateur', async ({ page }) => {
    const STORAGE_KEY = 'probain_trainer_onboarding';

    await page.evaluate((key) => {
      const state = {
        step: 3,
        firstName: 'Marie',
        lastName: 'Martin',
        phoneNumber: '+41 79 123 45 67',
        photoUrl: null,
        specializationMode: 'common',
        selectedSpecializations: ['aquagym', 'bebe_nageur']
      };
      localStorage.setItem(key, JSON.stringify(state));
    }, STORAGE_KEY);

    const stored = await page.evaluate((key) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }, STORAGE_KEY);

    expect(stored).not.toBeNull();
    expect(stored.step).toBe(3);
    expect(stored.firstName).toBe('Marie');
    expect(stored.selectedSpecializations).toContain('aquagym');
    expect(stored.selectedSpecializations).toContain('bebe_nageur');
  });

  test('localStorage peut stocker et restaurer l\'état établissement', async ({ page }) => {
    const STORAGE_KEY = 'probain_establishment_onboarding';

    await page.evaluate((key) => {
      const state = {
        organizationName: 'Piscine Municipale',
        address: {
          street: '25 Rue de la Piscine',
          cityZip: '1204 Genève',
          canton: 'GE'
        },
        contactName: 'Pierre Durand',
        phone: '+41 22 123 45 67',
        email: 'contact@piscine.ch'
      };
      localStorage.setItem(key, JSON.stringify(state));
    }, STORAGE_KEY);

    const stored = await page.evaluate((key) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }, STORAGE_KEY);

    expect(stored).not.toBeNull();
    expect(stored.organizationName).toBe('Piscine Municipale');
    expect(stored.address.street).toBe('25 Rue de la Piscine');
    expect(stored.address.canton).toBe('GE');
  });

  test('localStorage persiste après reload', async ({ page }) => {
    const STORAGE_KEY = 'probain_rescuer_onboarding';

    // Sauvegarder un état
    await page.evaluate((key) => {
      const state = { step: 4, firstName: 'Test', lastName: 'User' };
      localStorage.setItem(key, JSON.stringify(state));
    }, STORAGE_KEY);

    // Recharger la page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Vérifier que l'état est toujours là
    const stored = await page.evaluate((key) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }, STORAGE_KEY);

    expect(stored).not.toBeNull();
    expect(stored.step).toBe(4);
    expect(stored.firstName).toBe('Test');
  });

  test('localStorage peut être nettoyé', async ({ page }) => {
    const STORAGE_KEY = 'probain_rescuer_onboarding';

    // Sauvegarder puis supprimer
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify({ step: 1 }));
      localStorage.removeItem(key);
    }, STORAGE_KEY);

    const stored = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, STORAGE_KEY);

    expect(stored).toBeNull();
  });
});

test.describe('Performance localStorage', () => {
  test('localStorage gère des données volumineuses', async ({ page }) => {
    await page.goto('/');

    const STORAGE_KEY = 'probain_test_large';

    // Créer un état avec beaucoup de données
    await page.evaluate((key) => {
      const largeState = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: 'A'.repeat(100)
        }))
      };
      localStorage.setItem(key, JSON.stringify(largeState));
    }, STORAGE_KEY);

    const stored = await page.evaluate((key) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }, STORAGE_KEY);

    expect(stored.items).toHaveLength(100);
  });
});
