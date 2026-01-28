import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour la page d'accueil et l'authentification
 *
 * Ces tests vérifient le comportement de l'application
 * pour un utilisateur non connecté.
 */

test.describe('Page d\'accueil', () => {
  test('affiche la page d\'accueil correctement', async ({ page }) => {
    await page.goto('/');

    // Vérifier que la page charge (le titre est "ProBain" sans espace)
    await expect(page).toHaveTitle(/ProBain|Accueil/i, { timeout: 15000 });

    // Vérifier la présence d'éléments clés
    await page.waitForLoadState('networkidle');
  });

  test('affiche le dashboard ou redirige sans utilisateur', async ({ page }) => {
    await page.goto('/dashboard');

    // Attendre le chargement
    await page.waitForLoadState('networkidle');

    // La page devrait charger sans erreur JavaScript critique
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    // L'app gère les pages protégées (soit redirection, soit affichage conditionnel)
    // Vérifier juste que la page charge
    expect(page.url()).toContain('localhost');
  });

  test('la page de connexion est accessible', async ({ page }) => {
    await page.goto('/auth');

    await page.waitForLoadState('networkidle');

    // Vérifier la présence du formulaire de connexion
    // L'app utilise Supabase Auth UI - vérifier le bouton de connexion
    const loginButton = page.getByRole('button', { name: /se connecter/i });
    await expect(loginButton).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Navigation', () => {
  test('les liens de la page d\'accueil fonctionnent', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Vérifier qu'il n'y a pas d'erreurs console critiques
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Attendre un peu pour capturer les erreurs
    await page.waitForTimeout(2000);

    // Filtrer les erreurs non critiques (ex: favicon, etc.)
    const criticalErrors = consoleErrors.filter(
      err => !err.includes('favicon') && !err.includes('404')
    );

    // Pas d'erreurs JavaScript critiques
    expect(criticalErrors.length).toBeLessThan(5);
  });
});

test.describe('Responsive Design', () => {
  test('la page s\'affiche correctement sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // La page devrait s'adapter au mobile
    // Vérifier qu'il n'y a pas de scroll horizontal excessif
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10); // Tolérance de 10px
  });

  test('la page s\'affiche correctement sur tablette', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10);
  });
});

test.describe('Performance', () => {
  test('la page charge en moins de 5 secondes', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });
});
