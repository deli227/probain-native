import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour la page d'accueil (publique, sans auth)
 */

test.describe('Page d\'accueil', () => {

  test('charge la page d\'accueil correctement', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // La page devrait charger sans crash
    await expect(page).toHaveTitle(/ProBain|Pro Bain|Accueil/i, { timeout: 15_000 });
  });

  test('charge en moins de 5 secondes', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(5000);
  });

  test('la page /auth est accessible', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const loginButton = page.getByRole('button', { name: /se connecter/i });
    await expect(loginButton).toBeVisible({ timeout: 15_000 });
  });

  test('pas de scroll horizontal excessif sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10);
  });
});
