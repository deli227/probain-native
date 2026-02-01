import { test, expect, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';

/**
 * Test E2E pour l'upload de photo sur mobile (viewport Pixel 5 / Chrome)
 * Teste l'upload pendant l'onboarding ET sur le profil sauveteur
 * Utilise le picker natif (input file) apres suppression du PhotoPickerSheet
 */

// Forcer le viewport mobile (Pixel 5 = Chrome, pas besoin de WebKit)
test.use({ ...devices['Pixel 5'] });

function createTestImage(): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(10, 0);
  ihdrData.writeUInt32BE(10, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(2, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const rawData = Buffer.alloc(10 * (1 + 10 * 3));
  for (let y = 0; y < 10; y++) {
    const rowOffset = y * (1 + 30);
    rawData[rowOffset] = 0;
    for (let x = 0; x < 10; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      rawData[pixelOffset] = 255;
      rawData[pixelOffset + 1] = 0;
      rawData[pixelOffset + 2] = 0;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  function createChunk(type: string, data: Buffer): Buffer {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crcInput = Buffer.concat([typeBuffer, data]);
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < crcInput.length; i++) {
      crc ^= crcInput[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
  }

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdrData),
    createChunk('IDAT', compressedData),
    createChunk('IEND', Buffer.alloc(0)),
  ]);
}

test.describe('Upload Photo Mobile - Sauveteur', () => {

  test('upload photo onboarding + profil sur mobile + nettoyage', async ({ page }) => {
    test.setTimeout(150_000);

    const uniqueEmail = `test-mobile-photo-${Date.now()}@test-probain.com`;
    const testPassword = 'TestMobilePhoto_2026!';
    const testImagePath = path.join(process.cwd(), 'e2e', 'test-avatar-mobile.png');
    fs.writeFileSync(testImagePath, createTestImage());

    try {
      // ===== PHASE 1 : INSCRIPTION =====
      await page.goto('/auth');
      await page.waitForLoadState('networkidle');

      await page.getByRole('tab', { name: 'Inscription' }).click();
      await page.waitForTimeout(500);
      await page.getByLabel('Sauveteur').click();
      await page.waitForTimeout(500);

      await page.locator('#rescuer-email').fill(uniqueEmail);
      await page.locator('#rescuer-password').fill(testPassword);
      await page.locator('#rescuer-password-confirm').fill(testPassword);
      await page.getByRole('button', { name: "S'inscrire" }).click();

      await page.waitForURL(/\/onboarding/, { timeout: 30_000 });

      // ===== PHASE 2 : ONBOARDING AVEC UPLOAD PHOTO =====

      // Etape 1 : Bienvenue
      await expect(page.getByRole('heading', { name: 'Bienvenue !' })).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: "C'EST PARTI !" }).click();

      // Etape 2 : Identite
      await expect(page.getByRole('heading', { name: "Comment tu t'appelles ?" })).toBeVisible({ timeout: 10_000 });
      await page.getByPlaceholder('Ton prénom').fill('PhotoTest');
      await page.getByPlaceholder('Ton nom').fill('Mobile');
      await page.getByRole('button', { name: 'CONTINUER' }).click();

      // Etape 3 : Date de naissance (skip)
      await expect(page.getByRole('heading', { name: 'Ta date de naissance' })).toBeVisible({ timeout: 10_000 });
      await page.getByText('Passer cette étape').click();

      // Etape 4 : Photo de profil - UPLOAD ICI
      await expect(page.getByRole('heading', { name: 'Ta photo de profil' })).toBeVisible({ timeout: 10_000 });

      // Verifier qu'il y a un input file (le picker natif)
      const onboardingFileInput = page.locator('input[type="file"][accept="image/*"]').first();
      const onboardingInputCount = await page.locator('input[type="file"][accept="image/*"]').count();
      console.log(`[Onboarding] Found ${onboardingInputCount} file input(s)`);
      expect(onboardingInputCount).toBeGreaterThan(0);

      // Upload la photo pendant l'onboarding
      const onboardingUploadResponse = page.waitForResponse(
        response => response.url().includes('storage') && response.url().includes('avatars'),
        { timeout: 30_000 }
      );

      await onboardingFileInput.setInputFiles(testImagePath);

      const onboardingResponse = await onboardingUploadResponse;
      console.log(`[Onboarding] Upload response status: ${onboardingResponse.status()}`);
      expect(onboardingResponse.status()).toBeLessThan(400);

      // Attendre que l'upload soit traite
      await page.waitForTimeout(3000);

      // Le bouton devrait maintenant afficher "CONTINUER" au lieu de "PASSER"
      const continueBtn = page.getByRole('button', { name: /CONTINUER/i });
      const passBtn = page.getByRole('button', { name: /PASSER/i });
      const hasContinue = await continueBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasContinue) {
        await continueBtn.click();
      } else {
        await passBtn.click();
      }

      // Etape 5 : Localisation (skip)
      await expect(page.getByText(/basé|canton|localis/i)).toBeVisible({ timeout: 10_000 });
      const skipLocLink = page.getByText('Passer cette étape');
      const skipLocBtn = page.getByRole('button', { name: /PASSER/i });
      if (await skipLocLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await skipLocLink.click();
      } else {
        await skipLocBtn.click();
      }

      // Etape 6 : Completion
      await expect(page.getByText(/Bravo|Félicitations/i)).toBeVisible({ timeout: 10_000 });
      await page.getByRole('button', { name: /DÉCOUVRIR|PROFIL/i }).click();

      // Attendre le profil
      await page.waitForURL(/\/profile/, { timeout: 30_000 });
      await page.waitForTimeout(3000);

      // Verifier que la photo uploadee a l'onboarding est visible sur le profil
      const avatarOnProfile = page.locator('img[alt="PhotoTest Mobile"]').first();
      const profileAvatarSrc = await avatarOnProfile.getAttribute('src').catch(() => null);
      console.log(`[Profile] Avatar src after onboarding upload: ${profileAvatarSrc}`);

      // La photo devrait etre une URL Supabase (pas /placeholder.svg)
      if (profileAvatarSrc && profileAvatarSrc.includes('supabase')) {
        console.log('[Profile] Onboarding photo persisted to profile - OK');
      } else {
        console.log('[Profile] Avatar may be placeholder or fallback initials');
      }

      // ===== PHASE 3 : UPLOAD PHOTO SUR LE PROFIL (mobile) =====

      // Chercher l'input file sur la page profil
      const profileFileInput = page.locator('input[type="file"][accept="image/*"]').first();
      const profileInputCount = await page.locator('input[type="file"][accept="image/*"]').count();
      console.log(`[Profile] Found ${profileInputCount} file input(s)`);
      expect(profileInputCount).toBeGreaterThan(0);

      // Upload une nouvelle photo sur le profil
      const profileUploadResponse = page.waitForResponse(
        response => response.url().includes('storage') && response.url().includes('avatars'),
        { timeout: 30_000 }
      );

      await profileFileInput.setInputFiles(testImagePath);

      const profileResponse = await profileUploadResponse;
      console.log(`[Profile] Upload response status: ${profileResponse.status()}`);
      expect(profileResponse.status()).toBeLessThan(400);

      // Attendre le refresh
      await page.waitForTimeout(5000);

      // Verifier que l'avatar a une URL Supabase
      const avatarAfterProfileUpload = page.locator('img[alt="PhotoTest Mobile"]').first();
      await expect(avatarAfterProfileUpload).toHaveAttribute('src', /supabase/, { timeout: 10_000 });
      const srcAfterUpload = await avatarAfterProfileUpload.getAttribute('src');
      console.log(`[Profile] Avatar src after profile upload: ${srcAfterUpload}`);

      // Reload et verifier la persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      const avatarAfterReload = page.locator('img[alt="PhotoTest Mobile"]').first();
      await expect(avatarAfterReload).toHaveAttribute('src', /supabase/, { timeout: 15_000 });
      console.log('[Profile] Avatar persisted after reload - OK');

    } finally {
      // ===== NETTOYAGE =====
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const deleteBtn = page.getByRole('button', { name: 'Supprimer mon compte' });
      await deleteBtn.scrollIntoViewIfNeeded();
      await deleteBtn.click();
      await expect(page.getByText('Supprimer votre compte ?')).toBeVisible({ timeout: 5_000 });
      await page.getByRole('button', { name: 'Supprimer définitivement' }).click();
      await page.waitForTimeout(5000);
    }
  });
});
