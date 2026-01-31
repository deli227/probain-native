import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour la navigation mobile
 * Utilise le viewport Pixel 5 (projet mobile)
 */

test.describe('Navigation Mobile', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Masquer les overlays dev (Eruda, TanStack DevTools) qui interceptent les clics
    await page.evaluate(() => {
      const eruda = document.getElementById('eruda');
      if (eruda) eruda.style.display = 'none';
      const tsqd = document.querySelector('.tsqd-parent-container');
      if (tsqd) (tsqd as HTMLElement).style.display = 'none';
    });
  });

  test('affiche la bottom tab bar sur mobile', async ({ page }) => {
    const tabBar = page.getByRole('navigation', { name: 'Navigation principale' });
    await expect(tabBar).toBeVisible({ timeout: 10_000 });
  });

  test('affiche le header mobile', async ({ page }) => {
    // Le logo devrait etre visible dans le header
    const logo = page.locator('img[alt="Probain Logo"]').first();
    await expect(logo).toBeVisible({ timeout: 10_000 });
  });

  test('peut naviguer vers Emplois via la tab bar', async ({ page }) => {
    const emploisTab = page.getByRole('tab', { name: /Emplois/ });
    await expect(emploisTab).toBeVisible({ timeout: 10_000 });
    await emploisTab.click();

    await page.waitForURL(/\/jobs/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/jobs/);
  });

  test('peut naviguer vers Formations via la tab bar', async ({ page }) => {
    const formationsTab = page.getByRole('tab', { name: /Formations/ });
    await expect(formationsTab).toBeVisible({ timeout: 10_000 });
    await formationsTab.click();

    await page.waitForURL(/\/training/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/training/);
  });

  test('peut naviguer vers Messages via la tab bar', async ({ page }) => {
    const messagesTab = page.getByRole('tab', { name: /Messages/ });
    await expect(messagesTab).toBeVisible({ timeout: 10_000 });
    await messagesTab.click();

    await page.waitForURL(/\/rescuer\/mail|\/mail/, { timeout: 15_000 });
  });

  test('peut naviguer vers Flux via la tab bar', async ({ page }) => {
    // Re-masquer les overlays dev
    await page.evaluate(() => {
      document.querySelectorAll('#eruda, .tsqd-parent-container').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    });
    const fluxTab = page.getByRole('tab', { name: /Flux/ });
    await expect(fluxTab).toBeVisible({ timeout: 10_000 });
    await fluxTab.click();

    await page.waitForURL(/\/flux/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/flux/);
  });

  test('le tab actif est surligne sur la page profil', async ({ page }) => {
    // Sur /profile, le tab "Profil" devrait avoir aria-selected="true"
    const profilTab = page.getByRole('tab', { name: 'Profil' });
    await expect(profilTab).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 });
  });

  test('peut ouvrir les parametres depuis le header', async ({ page }) => {
    const settingsBtn = page.getByRole('button', { name: 'Paramètres' });
    if (await settingsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settingsBtn.click();
      await page.waitForTimeout(1000);

      // Le popover settings devrait etre ouvert - chercher differentes variantes
      const deconnexion = page.getByText(/d[eé]connecter/i);
      const modifierProfil = page.getByText(/modifier.*profil/i);

      const found = await deconnexion.isVisible().catch(() => false)
        || await modifierProfil.isVisible().catch(() => false);

      expect(found).toBeTruthy();
    }
  });

  test('pas de scroll horizontal excessif', async ({ page }) => {
    await page.waitForTimeout(2000);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // 20px tolerance mobile
  });

  test('navigation complete : aller sur chaque page et revenir', async ({ page }) => {
    // Helper pour masquer les overlays dev apres chaque navigation
    const hideDevOverlays = async () => {
      await page.evaluate(() => {
        document.querySelectorAll('#eruda, .tsqd-parent-container').forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      });
    };

    // Profil -> Emplois
    await page.getByRole('tab', { name: /Emplois/ }).click();
    await page.waitForURL(/\/jobs/, { timeout: 10_000 });
    await page.waitForTimeout(1000);
    await hideDevOverlays();

    // Emplois -> Formations
    await page.getByRole('tab', { name: /Formations/ }).click();
    await page.waitForURL(/\/training/, { timeout: 10_000 });
    await page.waitForTimeout(1000);
    await hideDevOverlays();

    // Formations -> Messages
    await page.getByRole('tab', { name: /Messages/ }).click();
    await page.waitForTimeout(2000);
    await hideDevOverlays();

    // Messages -> Flux
    await page.getByRole('tab', { name: /Flux/ }).click();
    await page.waitForURL(/\/flux/, { timeout: 10_000 });
    await page.waitForTimeout(1000);
    await hideDevOverlays();

    // Flux -> Profil
    await page.getByRole('tab', { name: 'Profil' }).click();
    await page.waitForURL(/\/profile/, { timeout: 10_000 });

    // On est revenu au depart sans crash
    await expect(page).toHaveURL(/\/profile/);
  });
});
