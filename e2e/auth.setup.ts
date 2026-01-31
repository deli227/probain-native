import { test as setup, expect } from '@playwright/test';

/**
 * Auth setup - se connecte une fois et sauvegarde la session
 * Reutilise par tous les projets via storageState
 */
setup('login et sauvegarde session', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_USER_EMAIL et E2E_USER_PASSWORD doivent etre definis dans .env.test'
    );
  }

  // Aller sur la page de connexion
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  // Cliquer sur l'onglet Connexion (au cas ou on serait sur Inscription)
  const connexionTab = page.getByRole('tab', { name: 'Connexion' });
  if (await connexionTab.isVisible()) {
    await connexionTab.click();
  }

  // Remplir le formulaire Supabase Auth UI
  await page.getByPlaceholder('Votre adresse email').fill(email);
  await page.getByPlaceholder('Votre mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  // Attendre la redirection vers le profil (preuve que le login a reussi)
  await page.waitForURL(/\/(profile|trainer-profile|establishment-profile|select-profile-type)/, {
    timeout: 30_000,
  });

  // Verifier qu'on est bien connecte
  await expect(page).not.toHaveURL(/\/auth/);

  // Sauvegarder l'etat de la session (cookies + localStorage)
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
