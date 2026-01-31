import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour la messagerie
 * Utilise la session authentifiee (sauveteur)
 */

test.describe('Messagerie Sauveteur', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/rescuer/mail');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('affiche la page messagerie', async ({ page }) => {
    // Le header "MESSAGERIE" devrait etre visible
    const header = page.getByText('MESSAGERIE');
    await expect(header.first()).toBeVisible({ timeout: 15_000 });
  });

  test('affiche une liste de conversations ou un etat vide', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Soit il y a des conversations, soit l'etat vide
    const emptyState = page.getByText(/Aucune conversation|Pas de messages|Votre boîte est vide/);
    const conversationItems = page.locator('[role="button"], [role="listitem"]').filter({
      has: page.locator('img, [class*="avatar"]'),
    });

    const hasConversations = (await conversationItems.count()) > 0;
    const isEmpty = await emptyState.isVisible().catch(() => false);

    // L'un ou l'autre devrait etre vrai
    expect(hasConversations || isEmpty).toBeTruthy();
  });

  test('peut ouvrir une conversation existante', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Chercher un item de conversation cliquable
    // Les ConversationListItem sont des divs cliquables avec un avatar
    const firstConversation = page.locator('[class*="cursor-pointer"]').filter({
      has: page.locator('img, [class*="avatar"], [class*="Avatar"]'),
    }).first();

    if (await firstConversation.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstConversation.click();
      await page.waitForTimeout(2000);

      // On devrait voir la vue conversation (avec un input de message)
      const messageInput = page.locator('textarea[placeholder], input[placeholder*="message" i]');
      const backButton = page.locator('button').filter({
        has: page.locator('[class*="arrow-left"], [class*="chevron-left"]'),
      });

      // Soit l'input soit un bouton retour devrait etre visible
      const hasInput = await messageInput.isVisible().catch(() => false);
      const hasBack = await backButton.first().isVisible().catch(() => false);

      expect(hasInput || hasBack).toBeTruthy();
    } else {
      test.skip(true, 'Pas de conversations existantes');
    }
  });

  test('pas d\'erreurs console critiques sur la messagerie', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') &&
            !text.includes('404') &&
            !text.includes('net::ERR') &&
            !text.includes('ResizeObserver') &&
            !text.includes('WebSocket')) {
          errors.push(text);
        }
      }
    });

    await page.goto('/rescuer/mail');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    expect(errors.length).toBeLessThan(3);
  });
});
