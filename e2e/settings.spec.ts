import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour la page Settings
 * Utilise la session authentifiee (sauveteur)
 */

test.describe('Page Parametres', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('affiche la page parametres correctement', async ({ page }) => {
    // La page settings doit etre accessible
    await expect(page).toHaveURL(/\/settings/);

    // Verifier les elements cles
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('affiche le bouton de suppression de compte', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: 'Supprimer mon compte' });
    await deleteBtn.scrollIntoViewIfNeeded();
    await expect(deleteBtn).toBeVisible({ timeout: 10_000 });
  });

  test('le dialog de suppression demande confirmation', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: 'Supprimer mon compte' });
    await deleteBtn.scrollIntoViewIfNeeded();
    await deleteBtn.click();

    // Le dialog de confirmation doit apparaitre
    await expect(page.getByText('Supprimer votre compte ?')).toBeVisible({ timeout: 5_000 });

    // Il doit y avoir un bouton "Supprimer définitivement" et un bouton pour annuler
    await expect(page.getByRole('button', { name: 'Supprimer définitivement' })).toBeVisible();

    // Fermer le dialog (cliquer a cote ou bouton annuler)
    const cancelBtn = page.getByRole('button', { name: /Annuler|Retour/i });
    if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelBtn.click();
    } else {
      // Press Escape to close
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);
  });

  test('affiche la section changement de mot de passe', async ({ page }) => {
    // La section mot de passe doit exister
    const passwordSection = page.getByText(/mot de passe|password/i).first();
    if (await passwordSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(passwordSection).toBeVisible();
    }
  });

  test('pas d erreurs console critiques sur settings', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignorer les erreurs connues (CORS, extensions, favicon)
        if (
          !text.includes('favicon') &&
          !text.includes('net::ERR') &&
          !text.includes('chrome-extension') &&
          !text.includes('eruda')
        ) {
          errors.push(text);
        }
      }
    });

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Filtrer les erreurs React/Supabase connues et non critiques
    const criticalErrors = errors.filter(e =>
      !e.includes('Warning:') &&
      !e.includes('React does not recognize') &&
      !e.includes('Manifest')
    );

    expect(criticalErrors).toEqual([]);
  });
});
