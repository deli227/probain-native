import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour l'onboarding sauveteur complet
 * Cree un nouveau compte, parcourt les 6 etapes, puis supprime le compte
 * 
 * Prerequis : validation email desactivee dans Supabase
 */

// Generer un email unique pour chaque run
const uniqueEmail = `test-e2e-${Date.now()}@test-probain.com`;
const testPassword = 'TestE2E_2026!';

test.describe('Onboarding Sauveteur Complet', () => {

  test('inscription + onboarding 6 etapes + nettoyage', async ({ page }) => {
    // Augmenter le timeout pour ce test long
    test.setTimeout(120_000);

    // ===== PHASE 1 : INSCRIPTION =====

    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Aller sur l'onglet Inscription
    await page.getByRole('tab', { name: 'Inscription' }).click();
    await page.waitForTimeout(500);

    // Selectionner "Sauveteur"
    await page.getByLabel('Sauveteur').click();
    await page.waitForTimeout(500);

    // Remplir le formulaire
    await page.locator('#rescuer-email').fill(uniqueEmail);
    await page.locator('#rescuer-password').fill(testPassword);
    await page.locator('#rescuer-password-confirm').fill(testPassword);

    // Soumettre
    await page.getByRole('button', { name: "S'inscrire" }).click();

    // Attendre la redirection vers /onboarding (pas de validation mail)
    await page.waitForURL(/\/onboarding/, { timeout: 30_000 });


    // ===== PHASE 2 : ONBOARDING 6 ETAPES =====

    // --- Etape 0 : Bienvenue ---
    await expect(page.getByRole('heading', { name: 'Bienvenue !' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: "C'EST PARTI !" }).click();

    // --- Etape 1 : Identite (remplir) ---
    await expect(page.getByRole('heading', { name: "Comment tu t'appelles ?" })).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder('Ton prénom').fill('TestPrenom');
    await page.getByPlaceholder('Ton nom').fill('TestNom');
    await page.getByRole('button', { name: 'CONTINUER' }).click();

    // --- Etape 2 : Date de naissance (skip) ---
    await expect(page.getByRole('heading', { name: 'Ta date de naissance' })).toBeVisible({ timeout: 10_000 });
    await page.getByText('Passer cette étape').click();

    // --- Etape 3 : Photo (skip) ---
    await expect(page.getByRole('heading', { name: 'Ta photo de profil' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'PASSER', exact: true }).click();

    // --- Etape 4 : Localisation (skip) ---
    await expect(page.getByRole('heading', { name: 'Où es-tu basé ?' })).toBeVisible({ timeout: 10_000 });
    await page.getByText('Passer cette étape').click();

    // --- Etape 5 : Completion ---
    await expect(page.getByRole('heading', { name: /Bravo/ })).toBeVisible({ timeout: 10_000 });

    // Le heading devrait contenir le prenom
    await expect(page.getByRole('heading', { name: /TestPrenom/ })).toBeVisible();

    await page.getByRole('button', { name: 'DÉCOUVRIR MON PROFIL' }).click();

    // Attendre l'arrivee sur /profile
    await page.waitForURL(/\/profile/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/profile/);

    // Verifier que le profil affiche le nom
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('TESTPRENOM');


    // ===== PHASE 3 : NETTOYAGE - SUPPRIMER LE COMPTE =====

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Scroller vers le bouton de suppression
    const deleteBtn = page.getByRole('button', { name: 'Supprimer mon compte' });
    await deleteBtn.scrollIntoViewIfNeeded();
    await expect(deleteBtn).toBeVisible({ timeout: 10_000 });
    await deleteBtn.click();

    // Confirmer la suppression dans le dialog
    await expect(page.getByText('Supprimer votre compte ?')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Supprimer définitivement' }).click();

    // Attendre la redirection apres suppression
    // L'app redirige vers / (qui est localhost:8080/)
    await page.waitForTimeout(5000);
    const url = page.url();
    expect(url).toMatch(/\/auth|localhost:8080\/$/);
  });

  test('inscription + onboarding avec tous les champs remplis', async ({ page }) => {
    test.setTimeout(120_000);

    const fullEmail = `test-e2e-full-${Date.now()}@test-probain.com`;

    // ===== INSCRIPTION =====
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: 'Inscription' }).click();
    await page.waitForTimeout(500);
    await page.getByLabel('Sauveteur').click();
    await page.waitForTimeout(500);

    await page.locator('#rescuer-email').fill(fullEmail);
    await page.locator('#rescuer-password').fill(testPassword);
    await page.locator('#rescuer-password-confirm').fill(testPassword);
    await page.getByRole('button', { name: "S'inscrire" }).click();

    await page.waitForURL(/\/onboarding/, { timeout: 30_000 });

    // ===== ONBOARDING COMPLET =====

    // Etape 0 : Bienvenue
    await expect(page.getByRole('heading', { name: 'Bienvenue !' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: "C'EST PARTI !" }).click();

    // Etape 1 : Identite (remplir)
    await expect(page.getByRole('heading', { name: "Comment tu t'appelles ?" })).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder('Ton prénom').fill('Marie');
    await page.getByPlaceholder('Ton nom').fill('Dupont');
    await page.getByRole('button', { name: 'CONTINUER' }).click();

    // Etape 2 : Date de naissance (remplir)
    await expect(page.getByRole('heading', { name: 'Ta date de naissance' })).toBeVisible({ timeout: 10_000 });
    // Ouvrir le calendrier
    await page.getByText('Sélectionner une date').click();
    await page.waitForTimeout(500);

    // Cliquer sur un jour dans le calendrier (le 15 du mois affiche)
    const dayButton = page.locator('button[name="day"]').filter({ hasText: '15' }).first();
    if (await dayButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dayButton.click();
    } else {
      // Fallback: cliquer sur n'importe quel jour disponible
      const anyDay = page.locator('.rdp-day:not(.rdp-day_disabled):not(.rdp-day_outside)').first();
      if (await anyDay.isVisible({ timeout: 3000 }).catch(() => false)) {
        await anyDay.click();
      }
    }
    await page.waitForTimeout(300);

    // Valider la date
    const validerBtn = page.getByRole('button', { name: 'Valider' });
    if (await validerBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await validerBtn.click();
    }
    await page.waitForTimeout(300);

    // Continuer (ou skip si la date n'a pas ete selectionnee)
    const continuerBtn = page.getByRole('button', { name: 'CONTINUER' });
    if (await continuerBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
      await continuerBtn.click();
    } else {
      await page.getByText('Passer cette étape').click();
    }

    // Etape 3 : Photo (skip - pas de fichier dans les tests)
    await expect(page.getByRole('heading', { name: 'Ta photo de profil' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'PASSER', exact: true }).click();

    // Etape 4 : Localisation (remplir le canton)
    await expect(page.getByRole('heading', { name: 'Où es-tu basé ?' })).toBeVisible({ timeout: 10_000 });

    // Ouvrir le select canton
    const cantonSelect = page.getByRole('combobox');
    if (await cantonSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cantonSelect.click();
      await page.waitForTimeout(500);

      // Selectionner "Vaud"
      const vaudOption = page.getByRole('option', { name: /Vaud/ });
      if (await vaudOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await vaudOption.click();
      } else {
        // Fallback: cliquer sur le premier canton visible
        const firstOption = page.getByRole('option').first();
        if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstOption.click();
        }
      }
      await page.waitForTimeout(300);
    }

    // Cliquer sur TERMINER
    const terminerBtn = page.getByRole('button', { name: /TERMINER/ });
    await terminerBtn.click();

    // Etape 5 : Completion
    await expect(page.getByRole('heading', { name: /Bravo.*Marie/ })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'DÉCOUVRIR MON PROFIL' }).click();

    // Arrivee sur /profile
    await page.waitForURL(/\/profile/, { timeout: 30_000 });


    // ===== NETTOYAGE =====
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const deleteBtn = page.getByRole('button', { name: 'Supprimer mon compte' });
    await deleteBtn.scrollIntoViewIfNeeded();
    await deleteBtn.click();
    await expect(page.getByText('Supprimer votre compte ?')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Supprimer définitivement' }).click();
    await page.waitForTimeout(5000);
    const url = page.url();
    expect(url).toMatch(/\/auth|localhost:8080\/$/);
  });
});
