import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le flux social
 * Utilise la session authentifiee
 */

test.describe('Flux Social', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/flux');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('affiche la page flux', async ({ page }) => {
    await expect(page).toHaveURL(/\/flux/);

    // Header visible
    const fluxHeader = page.getByText('FLUX');
    await expect(fluxHeader.first()).toBeVisible({ timeout: 15_000 });
  });

  test('affiche des posts ou un etat vide', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Soit on a des posts, soit le message "aucune publication"
    const posts = page.locator('[class*="rounded-xl"][class*="overflow-hidden"][class*="shadow"]');
    const emptyState = page.getByText('Aucune publication pour le moment');

    const hasPosts = (await posts.count()) > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasPosts || hasEmptyState).toBeTruthy();
  });

  test('peut liker un post', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Chercher un bouton "J'aime"
    const likeButton = page.getByRole('button', { name: "J'aime" }).first();

    if (await likeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Recuperer le texte du compteur avant
      const countBefore = await likeButton.textContent();

      await likeButton.click();
      await page.waitForTimeout(1000);

      // Le bouton devrait toujours etre la (pas de crash)
      await expect(likeButton).toBeVisible();

      // Re-cliquer pour annuler le like (nettoyer)
      await likeButton.click();
      await page.waitForTimeout(500);
    } else {
      // Pas de posts - test skip implicite
      test.skip(true, 'Aucun post disponible pour tester le like');
    }
  });

  test('peut ouvrir les commentaires d\'un post', async ({ page }) => {
    await page.waitForTimeout(3000);

    const commentButton = page.getByRole('button', { name: 'Commenter' }).first();

    if (await commentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await commentButton.click();
      await page.waitForTimeout(1000);

      // L'input de commentaire devrait apparaitre
      const commentInput = page.getByPlaceholder('Écrire un commentaire...');
      await expect(commentInput).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'Aucun post disponible pour tester les commentaires');
    }
  });

  test('peut ecrire et envoyer un commentaire', async ({ page }) => {
    await page.waitForTimeout(3000);

    const commentButton = page.getByRole('button', { name: 'Commenter' }).first();

    if (!(await commentButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Aucun post disponible');
      return;
    }

    await commentButton.click();
    await page.waitForTimeout(1000);

    const commentInput = page.getByPlaceholder('Écrire un commentaire...');
    await expect(commentInput).toBeVisible();

    // Ecrire un commentaire de test
    const testComment = `Test E2E ${Date.now()}`;
    await commentInput.fill(testComment);

    // Envoyer
    const sendButton = page.getByRole('button', { name: 'Envoyer le commentaire' });
    if (await sendButton.isVisible()) {
      await sendButton.click();
      await page.waitForTimeout(2000);

      // Le commentaire devrait apparaitre
      const newComment = page.getByText(testComment);
      await expect(newComment).toBeVisible({ timeout: 10_000 });

      // Nettoyer: supprimer le commentaire
      const deleteBtn = page.getByRole('button', { name: 'Supprimer le commentaire' }).first();
      if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});
