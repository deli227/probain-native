# CLAUDE.md - Pro Bain App

> Application PWA principale pour Pro Bain Connect
> Pour les règles générales, voir `@../CLAUDE.md` et `@../project-context.md`

---

## Vue d'Ensemble

**Pro Bain Connect** - Plateforme de mise en relation pour la sécurité aquatique en Suisse.

| Info | Valeur |
|------|--------|
| **Stack** | React 18.3, TypeScript 5.5, Vite 5.4 |
| **UI** | Shadcn/UI, Tailwind CSS 3.4, Radix UI |
| **State** | TanStack Query 5 + persistence localStorage |
| **Port dev** | 8080 |
| **GitHub** | https://github.com/deli227/pro-bain |

---

## Routes

| Route | Composant | Accès |
|-------|-----------|-------|
| `/` | Index | Public |
| `/auth` | Auth | Public |
| `/terms` | TermsOfUse | Public |
| `/privacy` | PrivacyPolicy | Public |
| `/select-profile-type` | ProfileTypeSelection | Authentifié |
| `/onboarding` | OnboardingWizard | Authentifié |
| `/profile` | Profile | Sauveteur |
| `/trainer-profile` | TrainerProfile | Formateur |
| `/establishment-profile` | EstablishmentProfile | Établissement |
| `/jobs` | Jobs | Authentifié |
| `/training` | Training | Authentifié |
| `/settings` | Settings | Authentifié |
| `/flux` | Flux | Authentifié |
| `/rescuer/mail` | Mailbox | Sauveteur |
| `/trainer-profile/mail` | Mailbox | Formateur |
| `/establishment-profile/mail` | EstablishmentMailbox | Établissement |

---

## Hooks Principaux

| Hook | Fichier | Usage |
|------|---------|-------|
| `useProfileQuery` | `useProfileQuery.ts` | Profil avec cache persistant |
| `useFormations` | `use-formations.ts` | CRUD formations |
| `useExperiences` | `use-experiences.ts` | CRUD expériences |
| `useAvailabilities` | `use-availabilities.ts` | CRUD disponibilités |
| `useJobPostings` | `use-job-postings.ts` | Offres d'emploi |
| `useDocumentUpload` | `use-document-upload.ts` | Upload CV/documents |
| `useFlux` | `useFlux.ts` | Posts du flux |
| `useRescuerNotifications` | `use-rescuer-notifications.ts` | Notifications |
| `useAppResume` | `useAppResume.ts` | Gestion PWA background |
| `useMobile` | `use-mobile.tsx` | Détection mobile |
| `useToast` | `use-toast.ts` | Notifications toast |

---

## Onboarding Sauveteur "Wahoo"

Flow 6 étapes avec animations (tous champs optionnels):

| Étape | Composant | Données |
|-------|-----------|---------|
| 1 | `RescuerWelcome.tsx` | Bienvenue |
| 2 | `RescuerIdentity.tsx` | Prénom, Nom |
| 3 | `RescuerBirthdate.tsx` | Date de naissance |
| 4 | `RescuerPhoto.tsx` | Photo de profil |
| 5 | `RescuerLocation.tsx` | Canton |
| 6 | `RescuerComplete.tsx` | Confirmation |

**Fichiers:**
```
src/components/onboarding/
├── OnboardingShell.tsx          # Layout avec vagues
├── OnboardingProgress.tsx       # Indicateur progression
├── OnboardingWizard.tsx         # Routeur par type
├── RescuerOnboardingFlow.tsx    # Orchestrateur sauveteur
├── TrainerOnboardingFlow.tsx    # Orchestrateur formateur
└── steps/                       # Composants étapes
```

---

## Onboarding Formateur

Flow 6 étapes (nom organisme obligatoire):

| Étape | Composant | Obligatoire |
|-------|-----------|-------------|
| 1 | `TrainerWelcome.tsx` | - |
| 2 | `TrainerOrganization.tsx` | **OUI** |
| 3 | `TrainerLogo.tsx` | Non |
| 4 | `TrainerDescription.tsx` | Non |
| 5 | `TrainerLocation.tsx` | Non |
| 6 | `TrainerComplete.tsx` | - |

---

## PWA - TanStack Query Cache

Configuration pour profil persistant (24h):

```typescript
// src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes
      gcTime: 24 * 60 * 60 * 1000,     // 24 heures
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
    },
  },
});
```

**Packages:** `@tanstack/react-query-persist-client`, `@tanstack/query-sync-storage-persister`

---

## Contexte Global

```typescript
// src/contexts/ProfileContext.tsx
interface ProfileContextValue {
  profileTypeSelected: boolean;
  onboardingCompleted: boolean;
  profileType: 'maitre_nageur' | 'formateur' | 'etablissement' | null;
  loading: boolean;
  profileVerified: boolean;
  isOnline: boolean;
  updateProfileType: (type: string) => Promise<void>;
}
```

---

## Fichiers Critiques

| Fichier | Rôle |
|---------|------|
| `src/App.tsx` | Router, lazy loading, PersistQueryClientProvider |
| `src/contexts/ProfileContext.tsx` | État global utilisateur |
| `src/contexts/hooks/useProfileState.ts` | Hook interne profil |
| `src/lib/queryClient.ts` | TanStack Query avec persistence |
| `src/hooks/useProfileQuery.ts` | Hook profil avec cache |
| `src/hooks/useAppResume.ts` | Gestion PWA background |
| `src/integrations/supabase/client.ts` | Client Supabase |
| `src/integrations/supabase/types.ts` | Types auto-générés |
| `src/utils/constants.ts` | Constantes (LOGO_PATH, PWA_*) |
| `src/components/shared/ProfileRouter.tsx` | Redirection par type |
| `src/components/ui/sheet.tsx` | Sheet avec fix mobile |

---

## Points d'Attention

### Messagerie
- Sauveteurs: réception uniquement
- Formateurs/Établissements: bidirectionnelle

### Onboarding
- Tous champs optionnels (bouton "Passer")
- Envoyer `null` au lieu de `""` pour champs vides
- Données dans `profiles` ET profil spécifique

### PWA
- `refetchOnWindowFocus: false` (évite requêtes intempestives)
- `MIN_HIDDEN_DURATION = 60` secondes avant refresh

### Lazy Loading
Named exports: `.then(m => ({ default: m.ComponentName }))`

---

## Commandes

```bash
npm run dev          # Port 8080
npm run build
npm run test
npm run lint
```

---

*Pour DB, migrations, triggers: voir `@../docs/database-schema.md`*
*Pour règles générales: voir `@../project-context.md`*
