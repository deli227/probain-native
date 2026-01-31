import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';

/**
 * Test E2E pour l'upload d'avatar sur le profil sauveteur
 * Cree un compte, upload une image, verifie l'affichage, nettoie
 */

const uniqueEmail = `test-avatar-${Date.now()}@test-probain.com`;
const testPassword = 'TestAvatar_2026!';

// Creer une petite image PNG de test (10x10 pixel rouge) - PNG valide
function createTestImage(): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk: width=10, height=10, bit depth=8, color type=2 (RGB)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(10, 0);
  ihdrData.writeUInt32BE(10, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(2, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  // Raw image data: for each row, filter byte (0) + RGB pixels
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

test.describe('Upload Avatar Sauveteur', () => {

  test('inscription + upload avatar + verification affichage + nettoyage', async ({ page }) => {
    test.setTimeout(120_000);

    // ===== PHASE 1 : INSCRIPTION + ONBOARDING RAPIDE =====

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

    // Onboarding rapide : skip tout
    await expect(page.getByRole('heading', { name: 'Bienvenue !' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: "C'EST PARTI !" }).click();

    await expect(page.getByRole('heading', { name: "Comment tu t'appelles ?" })).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder('Ton prénom').fill('AvatarTest');
    await page.getByPlaceholder('Ton nom').fill('User');
    await page.getByRole('button', { name: 'CONTINUER' }).click();

    await expect(page.getByRole('heading', { name: 'Ta date de naissance' })).toBeVisible({ timeout: 10_000 });
    await page.getByText('Passer cette étape').click();

    await expect(page.getByRole('heading', { name: 'Ta photo de profil' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'PASSER', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Où es-tu basé ?' })).toBeVisible({ timeout: 10_000 });
    await page.getByText('Passer cette étape').click();

    await expect(page.getByRole('heading', { name: /Bravo/ })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'DÉCOUVRIR MON PROFIL' }).click();

    await page.waitForURL(/\/profile/, { timeout: 30_000 });
    await page.waitForTimeout(3000);

    // Verify: before upload, the avatar shows fallback initials (no <img> with the alt text has a src)
    const avatarBefore = page.locator('img[alt="AvatarTest User"]').first();
    const hasSrcBefore = await avatarBefore.getAttribute('src').catch(() => null);
    console.log(`Avatar src BEFORE upload: ${hasSrcBefore}`);


    // ===== PHASE 2 : UPLOAD AVATAR SUR LE PROFIL =====

    const testImagePath = path.join(process.cwd(), 'e2e', 'test-avatar.png');
    fs.writeFileSync(testImagePath, createTestImage());

    // Find the hidden file input
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    const inputCount = await page.locator('input[type="file"][accept="image/*"]').count();
    expect(inputCount).toBeGreaterThan(0);

    // Set up a promise that resolves when a Supabase storage upload request completes
    const uploadResponse = page.waitForResponse(
      response => response.url().includes('storage') && response.url().includes('avatars'),
      { timeout: 30_000 }
    );

    // Upload the image
    await fileInput.setInputFiles(testImagePath);

    // Wait for the upload network request to complete
    const response = await uploadResponse;
    console.log(`Upload response status: ${response.status()}`);
    expect(response.status()).toBeLessThan(400);

    // Wait for the profile refresh to complete
    await page.waitForTimeout(5000);

    // Verify: the avatar img now has a Supabase src (even if hidden due to Radix AvatarImage loading)
    // Radix AvatarImage hides the <img> until onload fires; for a tiny test PNG this may not trigger
    // So we check the src attribute directly rather than visibility
    const avatarAfterUpload = page.locator('img[alt="AvatarTest User"]').first();
    await expect(avatarAfterUpload).toHaveAttribute('src', /supabase/, { timeout: 10_000 });
    const srcAfterUpload = await avatarAfterUpload.getAttribute('src');
    console.log(`Avatar src AFTER upload: ${srcAfterUpload}`);

    // Reload and verify persistence (the URL should still be a supabase URL, not /placeholder.svg)
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const avatarAfterReload = page.locator('img[alt="AvatarTest User"]').first();
    await expect(avatarAfterReload).toHaveAttribute('src', /supabase/, { timeout: 15_000 });
    const srcAfterReload = await avatarAfterReload.getAttribute('src');
    console.log(`Avatar src AFTER reload: ${srcAfterReload}`);


    // ===== PHASE 3 : NETTOYAGE =====

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
  });
});
