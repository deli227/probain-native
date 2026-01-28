import { http, HttpResponse } from 'msw';

// URL de base Supabase (sera remplacée par les vraies valeurs en test)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';

// Données de test
const testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

const testProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Jean',
  last_name: 'Test',
  profile_type: 'maitre_nageur',
  avatar_url: null,
  onboarding_completed: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const handlers = [
  // Auth - Sign up
  http.post(`${SUPABASE_URL}/auth/v1/signup`, () => {
    return HttpResponse.json({
      user: testUser,
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
      },
    });
  }),

  // Auth - Sign in
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      user: testUser,
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
    });
  }),

  // Auth - Get user
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json(testUser);
  }),

  // Profiles - Get
  http.get(`${SUPABASE_URL}/rest/v1/profiles`, ({ request }) => {
    const url = new URL(request.url);
    const select = url.searchParams.get('select');

    if (select) {
      return HttpResponse.json([testProfile]);
    }
    return HttpResponse.json([testProfile]);
  }),

  // Profiles - Update (PATCH)
  http.patch(`${SUPABASE_URL}/rest/v1/profiles`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const updatedProfile = { ...testProfile, ...body };
    return HttpResponse.json([updatedProfile]);
  }),

  // Storage - Upload
  http.post(`${SUPABASE_URL}/storage/v1/object/*`, () => {
    return HttpResponse.json({
      Key: 'avatars/test-user-id/photo.jpg',
    });
  }),

  // Storage - Get public URL
  http.post(`${SUPABASE_URL}/storage/v1/object/public/*`, () => {
    return HttpResponse.json({
      publicUrl: 'https://test.supabase.co/storage/v1/object/public/avatars/test.jpg',
    });
  }),

  // Certifications
  http.get(`${SUPABASE_URL}/rest/v1/certifications`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/certifications`, () => {
    return HttpResponse.json([{
      id: 'cert-1',
      user_id: testUser.id,
      certification_type: 'BNSSA',
      obtained_date: '2024-01-01',
    }]);
  }),

  // Formations
  http.get(`${SUPABASE_URL}/rest/v1/formations`, () => {
    return HttpResponse.json([]);
  }),
];

// Handlers spécifiques pour les tests d'onboarding
export const onboardingHandlers = [
  ...handlers,

  // Profil non complété (pour tester l'onboarding)
  http.get(`${SUPABASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json([{
      ...testProfile,
      onboarding_completed: false,
      first_name: null,
      last_name: null,
    }]);
  }),
];

// Handlers pour profil établissement
export const establishmentHandlers = [
  ...handlers,

  http.get(`${SUPABASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json([{
      ...testProfile,
      profile_type: 'etablissement',
      onboarding_completed: false,
      organization_name: null,
    }]);
  }),
];

// Handlers pour profil formateur
export const trainerHandlers = [
  ...handlers,

  http.get(`${SUPABASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json([{
      ...testProfile,
      profile_type: 'formateur',
      onboarding_completed: false,
    }]);
  }),
];
