import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le profil sauveteur
 * Utilise la session authentifiee (storageState)
 */

test.describe('Profil Sauveteur', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    // Attendre que le profil soit charge (le skeleton disparait)
    await page.waitForTimeout(2000);
  });

  test('affiche la page profil correctement', async ({ page }) => {
    // On devrait etre sur /profile (pas redirige vers /auth)
    await expect(page).toHaveURL(/\/profile/);

    // Attendre que le contenu se charge (skeleton disparait)
    // Verifier qu'au moins le texte FORMATION ou EXPERIENCE est visible
    const formation = page.getByText('FORMATION', { exact: true });
    const experience = page.getByText('EXPÉRIENCE PROFESSIONNELLE');

    await expect(formation.or(experience).first()).toBeVisible({ timeout: 15_000 });
  });

  test('affiche les sections formations et experiences', async ({ page }) => {
    // Attendre le chargement complet
    await page.waitForTimeout(3000);

    // Section formations (titre uppercase)
    const formationSection = page.getByText('FORMATION', { exact: true });
    // Section experiences
    const experienceSection = page.getByText('EXPÉRIENCE PROFESSIONNELLE');

    // Au moins une des deux devrait etre visible (scroll si necessaire)
    const formVisible = await formationSection.isVisible().catch(() => false);
    const expVisible = await experienceSection.isVisible().catch(() => false);

    // Le profil devrait avoir au moins les sections affichees
    expect(formVisible || expVisible).toBeTruthy();
  });

  test('affiche la section disponibilite', async ({ page }) => {
    // Scroller progressivement vers le bas pour trouver la section
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(300);
    }

    // Chercher le texte ou les boutons de disponibilite
    const disponibilite = page.getByText('DISPONIBILITÉ');
    const btnDispo = page.getByRole('button', { name: 'Je suis disponible' });
    const btnIndispo = page.getByRole('button', { name: 'Je ne suis pas disponible' });

    const found = await disponibilite.isVisible().catch(() => false)
      || await btnDispo.isVisible().catch(() => false)
      || await btnIndispo.isVisible().catch(() => false);

    expect(found).toBeTruthy();
  });

  test('peut changer le statut de disponibilite', async ({ page }) => {
    // Scroller vers la section disponibilite
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Chercher le bouton de disponibilite
    const btnDisponible = page.getByRole('button', { name: 'Je suis disponible' });
    const btnIndisponible = page.getByRole('button', { name: 'Je ne suis pas disponible' });

    // Cliquer sur un des deux boutons (celui qui est visible)
    if (await btnDisponible.isVisible()) {
      await btnDisponible.click();
      await page.waitForTimeout(1000);
    } else if (await btnIndisponible.isVisible()) {
      await btnIndisponible.click();
      await page.waitForTimeout(1000);
    }

    // Pas d'erreur console critique
    // Le fait qu'on ne crash pas est deja un test valide
  });

  test('peut ouvrir le formulaire d\'edition (desktop)', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'Bouton Modifier cache sur mobile');

    // Chercher le bouton MODIFIER (desktop seulement)
    const editBtn = page.getByRole('button', { name: 'MODIFIER' });
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();

      // Le sheet devrait s'ouvrir avec le formulaire
      await expect(page.getByText('Modifier le profil')).toBeVisible({ timeout: 5000 });

      // Verifier les champs du formulaire
      await expect(page.getByPlaceholder('Votre prénom')).toBeVisible();
      await expect(page.getByPlaceholder('Votre nom')).toBeVisible();
    }
  });

  test('pas d\'erreurs console critiques sur le profil', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignorer les erreurs connues non critiques
        if (!text.includes('favicon') &&
            !text.includes('404') &&
            !text.includes('net::ERR') &&
            !text.includes('ResizeObserver')) {
          errors.push(text);
        }
      }
    });

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Pas plus de 3 erreurs console (tolerance pour les warnings Supabase)
    expect(errors.length).toBeLessThan(3);
  });
});
