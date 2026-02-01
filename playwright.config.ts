import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Charger les credentials de test
dotenv.config({ path: '.env.test' });

/**
 * Configuration Playwright pour les tests E2E
 * Teste contre le vrai Supabase avec un compte de test
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,   // Sequential pour eviter les conflits sur le meme compte
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,             // Un seul worker (meme session Supabase)
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60_000,        // 60s par test (Supabase peut etre lent)

  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
  },

  projects: [
    // Setup: login et sauvegarde de la session
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Tests desktop (authentifies)
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['auth-setup'],
      testIgnore: /auth\.spec\.ts|auth\.setup\.ts|homepage\.spec\.ts|navigation\.spec\.ts|onboarding.*\.spec\.ts|avatar-upload.*\.spec\.ts/,
    },

    // Tests mobile (authentifies)
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['auth-setup'],
      testMatch: /navigation\.spec\.ts/,
    },

    // Tests publics (sans session pre-existante)
    {
      name: 'public-tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth\.spec\.ts|homepage\.spec\.ts|onboarding.*\.spec\.ts|avatar-upload.*\.spec\.ts/,
    },
  ],

  // Demarre le serveur de dev avant les tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
