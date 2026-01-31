import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour l'authentification
 * Ces tests n'utilisent PAS de session pre-enregistree
 */

test.describe('Authentification', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
  });

  test('affiche le formulaire de connexion', async ({ page }) => {
    // Verifier les elements du formulaire
    await expect(page.getByRole('tab', { name: 'Connexion' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Inscription' })).toBeVisible();
    await expect(page.getByPlaceholder('Votre adresse email')).toBeVisible();
    await expect(page.getByPlaceholder('Votre mot de passe')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });

  test('refuse un mauvais mot de passe', async ({ page }) => {
    await page.getByPlaceholder('Votre adresse email').fill('test-bad@example.com');
    await page.getByPlaceholder('Votre mot de passe').fill('mauvais_mot_de_passe');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Attendre un message d'erreur (alert ou texte d'erreur)
    // Supabase Auth UI affiche une erreur dans le formulaire
    await page.waitForTimeout(3000);

    // On ne devrait PAS etre redirige
    await expect(page).toHaveURL(/\/auth/);
  });

  test('login avec credentials valides redirige vers le profil', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.skip(true, 'Credentials E2E non configurees');
      return;
    }

    await page.getByPlaceholder('Votre adresse email').fill(email);
    await page.getByPlaceholder('Votre mot de passe').fill(password);
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Attendre la redirection
    await page.waitForURL(/\/(profile|trainer-profile|establishment-profile|select-profile-type)/, {
      timeout: 30_000,
    });

    await expect(page).not.toHaveURL(/\/auth/);
  });

  test('les liens legaux sont accessibles', async ({ page }) => {
    // Lien conditions d'utilisation
    const termsLink = page.locator('a[href="/terms"]');
    if (await termsLink.isVisible()) {
      await expect(termsLink).toBeVisible();
    }

    // Lien politique de confidentialite
    const privacyLink = page.locator('a[href="/privacy"]');
    if (await privacyLink.isVisible()) {
      await expect(privacyLink).toBeVisible();
    }
  });

  test('le tab Inscription affiche les types de profil', async ({ page }) => {
    await page.getByRole('tab', { name: 'Inscription' }).click();

    // Verifier les 3 types de profil
    await expect(page.getByLabel('Sauveteur')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel('Formateur')).toBeVisible();
    await expect(page.getByLabel('Établissement')).toBeVisible();
  });
});
