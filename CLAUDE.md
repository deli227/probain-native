# CLAUDE.md - Pro Bain Native App

> Application PWA native pour Pro Bain Connect (version iOS/Android via Despia)
> Pour les regles de developpement: voir `project-context.md`
> Pour le framework natif: voir `docs/despia.md`
> Pour l'historique de developpement: voir `docs/development-log.md`

---

## Vue d'Ensemble

**Pro Bain Connect** - Plateforme de mise en relation pour la sécurité aquatique en Suisse.

| Info | Valeur |
|------|--------|
| **Stack** | React 18.3, TypeScript 5.5, Vite 5.4 |
| **UI** | Shadcn/UI, Tailwind CSS 3.4, Radix UI |
| **State** | TanStack Query 5 + persistence localStorage |
| **Port dev** | 8080 |
| **GitHub (Native)** | https://github.com/deli227/probain-native |
| **GitHub (Web)** | https://github.com/deli227/pro-bain |

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
| `useTrainerStudents` | `use-trainer-students.ts` | State + fetch page "Mes Eleves" |
| `useRescuerNotifications` | `use-rescuer-notifications.ts` | Notifications |
| `useAppResume` | `useAppResume.ts` | Gestion PWA background |
| `useMobile` | `use-mobile.tsx` | Détection mobile |
| `useToast` | `use-toast.ts` | Notifications toast |
| `useSwipeNavigation` | `useSwipeNavigation.ts` | Swipe horizontal entre onglets mobile |

---

## Pattern de Decoupe Composant (reference: TrainerStudents)

Les gros composants (>300 lignes) sont decoupes en sous-dossier avec barrel export :

```
src/components/profile/
  TrainerStudents.tsx              → Re-export (2 lignes)
  trainer-students/
    index.ts                       → Barrel export
    types.ts                       → Types + helpers partages
    RecyclingStatusBadge.tsx       → Badge statut recyclage
    StudentFormationCard.tsx       → Carte formation formateur
    StudentExternalFormationCard.tsx → Carte formation externe
    CompactHeader.tsx              → Header avec compteurs
    EmptyState.tsx                 → Etat vide
    StudentCard.tsx                → Carte eleve
    StudentList.tsx                → Liste avec selection
    StudentDetailSheet.tsx         → Sheet detail eleve
    FilterPanel.tsx                → Panneau filtres brevet/source
    TrainerStudentsPage.tsx        → Orchestrateur JSX principal
```

Le hook custom `src/hooks/use-trainer-students.ts` contient toute la logique (state, fetch, filtres, handlers).

**Regles de decoupe :**
- Le fichier original devient un re-export (`export { X } from './x'`)
- Les imports externes (App.tsx) ne changent JAMAIS
- Types partages dans `types.ts`, composants feuilles extraits en premier
- Hook custom pour state + data fetching
- Build verifie apres chaque extraction

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

## Architecture Globale

```
App.tsx
  └── ErrorBoundary (root)
      └── PersistQueryClientProvider (TanStack Query + localStorage 24h)
          └── ProfileProvider (contexte global profil)
              └── AppRoutes
                  ├── Routes publiques: /, /auth, /terms, /privacy
                  ├── Routes onboarding: /select-profile-type, /onboarding
                  └── Routes protegees (DashboardLayout)
                      ├── ErrorBoundary (inner, resetKey=pathname)
                      ├── Suspense + lazyRetry()
                      └── Pages lazy-loaded par route
```

### Flux d'Authentification (PKCE)
1. Inscription: email+password → Supabase envoie email → lien avec `?token_hash=...&type=signup`
2. App detecte token_hash → `verifyOtp()` → profil cree dans `profiles`
3. Redirect vers selection type de profil → onboarding → dashboard
4. Login: email+password → session → `onAuthStateChange` → `useFullProfile` → redirect profil

### Layout Responsive
```
Mobile (< 768px):
  MobileHeader (56px sticky top)
  Content (pb-20 pour tab bar)
  BottomTabBar (76px fixed bottom, safe-area)

Desktop (>= 768px):
  Sidebar (256px fixed left)
  Content (pl-64)
```

---

## Contexte Global

```typescript
// src/contexts/ProfileContext.tsx
interface ExtendedProfileContextType {
  // Etat
  profileTypeSelected: boolean;
  onboardingCompleted: boolean;
  profileType: 'maitre_nageur' | 'formateur' | 'etablissement' | null;
  loading: boolean;
  profileVerified: boolean;
  isOnline: boolean;

  // Donnees profil complet (via useFullProfile)
  fullProfile: FullProfileData | null;
  baseProfile: BaseProfile | null;
  rescuerProfile: RescuerProfile | null;
  trainerProfile: TrainerProfile | null;
  establishmentProfile: EstablishmentProfile | null;

  // Actions
  updateProfileType: (type) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  updateProfileOptimistic: (updates) => void;
}
```

**Persistence localStorage:**
- `probain_profile_type` / `probain_profile_selected` / `probain_onboarding_completed`
- `PROBAIN_QUERY_CACHE` (TanStack Query persister)

---

## Roles et Permissions

### Sauveteur (`maitre_nageur`)
- Profil, formations, experiences, disponibilites
- Recherche d'emploi et formations
- Messagerie: **reception uniquement**
- Onglets: Profil, Emplois, Formations, Messages, Flux

### Formateur (`formateur`)
- Profil organisme, cours, suivi eleves
- Messagerie: **bidirectionnelle**
- Onglets: Profil, Eleves, Messages, Flux

### Etablissement (`etablissement`)
- Profil, offres d'emploi, annonces
- Recherche de sauveteurs
- Messagerie: **bidirectionnelle**
- Onglets: Profil, Annonces, Sauveteurs, Messages, Flux

---

## Composants par Dossier

### `components/navigation/`
| Fichier | Role |
|---------|------|
| `BottomTabBar.tsx` | Navigation mobile (5 onglets par type profil, badges, haptic) |
| `MobileHeader.tsx` | Header sticky (logo, menu settings, cloche notifications) |
| `Sidebar.tsx` | Navigation desktop (256px, liens par profil, deconnexion) |

### `components/auth/`
| Fichier | Role |
|---------|------|
| `AuthForm.tsx` | Login/signup, PKCE flow, verification email, social login |
| `PasswordStrengthIndicator.tsx` | Validation visuelle mot de passe |
| `SignupSteps.tsx` | Wizard inscription multi-etapes |
| `SocialLoginButtons.tsx` | OAuth Google/GitHub |

### `components/profile/`
| Fichier | Role |
|---------|------|
| `ProfileForm.tsx` | Edition profil sauveteur (dark theme) |
| `ProfileHeader.tsx` | Avatar, nom, stats |
| `ProfileCompletion.tsx` | Checklist completude profil |
| `ProfileStats.tsx` | Pourcentage completion |
| `RescuerProfileHeader.tsx` | Header specifique sauveteur |
| `TrainerProfile.tsx` | Dashboard formateur complet |
| `TrainerStudents.tsx` | Gestion eleves (filtre, formations externes, recyclage) |
| `TrainerCourses.tsx` | Cours publies par le formateur |
| `EstablishmentProfile.tsx` | Dashboard etablissement |
| `EstablishmentJobPostings.tsx` | Offres d'emploi de l'etablissement |
| `FormationCard.tsx` | Carte formation (PDF, recyclage) |
| `FormationCarousel.tsx` | Carousel horizontal formations |
| `ExperienceCard.tsx` | Carte experience pro |
| `ExperienceCarousel.tsx` | Carousel horizontal experiences |
| `AvailabilitySection.tsx` | Picker de disponibilites |
| `AddFormationSheet.tsx` | Modal ajout formation |
| `SendMessageDialog.tsx` | Composer un message |
| `SendRescuerMessageDialog.tsx` | Message vers sauveteur |
| `PDFViewerDialog.tsx` | Visionneuse PDF inline |
| `CourseParticipantsDialog.tsx` | Participants d'un cours |
| `JobPostingCard.tsx` / `JobPostingDialog.tsx` | Offre d'emploi |
| `MyCourses.tsx` / `AvailableCourses.tsx` | Cours formateur |
| `ErrorState.tsx` / `LoadingState.tsx` | Etats placeholder |

### `components/profile/forms/`
| Fichier | Role |
|---------|------|
| `PersonalInfoForm.tsx` | Nom, email, telephone (darkMode prop) |
| `AddressForm.tsx` | Rue, ville, canton (darkMode prop) |
| `FormationForm.tsx` | Ajout/edition formation (CalendarModal) |
| `ExperienceForm.tsx` | Ajout/edition experience (CalendarModal) |
| `TrainerProfileForm.tsx` | Edition profil formateur (dark theme) |
| `EstablishmentProfileForm.tsx` | Edition profil etablissement |
| `JobPostingsForm.tsx` | Creation offre d'emploi |
| `OrganizationForm.tsx` | Details organisme |
| `FileUploadField.tsx` | Picker document/photo |

### `components/shared/`
| Fichier | Role |
|---------|------|
| `ErrorBoundary.tsx` | Capture erreurs React, auto-recovery via resetKey |
| `ProfileRouter.tsx` | Redirect vers le bon profil selon le type |
| `LoadingScreen.tsx` | Ecran chargement plein page |
| `OfflineIndicator.tsx` | Banniere hors-ligne |
| `InstallPWAPrompt.tsx` | Prompt installation PWA |
| `NotificationsPopup.tsx` | Dropdown notifications (gate isReady) |
| `NotificationBell.tsx` | Icone cloche avec badge |
| `CalendarModal.tsx` | Calendrier interactif francais |
| `PhotoPickerSheet.tsx` | Picker photo mobile |
| `SimpleFileUpload.tsx` | Upload fichier basique |
| `PullToRefresh.tsx` | Pull-to-refresh mobile |

### `components/mailbox/` (Messagerie Instagram/WhatsApp)

**Architecture refaite** : l'ancien systeme d'onglets "Recus/Envoyes" a ete remplace par une interface de conversations groupees par contact avec bulles de messages.

| Fichier | Role |
|---------|------|
| `EstablishmentMailbox.tsx` | Re-export vers `conversation/ConversationMailbox` |
| `RescuerMailbox.tsx` | Ancien composant (obsolete, garde pour reference) |
| `MessageCard.tsx` | Ancien composant (obsolete) |
| `MessageDialog.tsx` | Ancien composant (obsolete) |

### `components/mailbox/conversation/` (Nouveau systeme messagerie)

| Fichier | Role |
|---------|------|
| `index.ts` | Barrel export |
| `types.ts` | `ConversationContact`, `Conversation`, helpers groupement |
| `useConversations.ts` | Hook : fetch, groupement par contact, real-time, mutations |
| `ConversationMailbox.tsx` | Orchestrateur : layout responsive, permissions par profil |
| `ConversationList.tsx` | Panel gauche : liste des conversations + header compact |
| `ConversationListItem.tsx` | Ligne : avatar, nom, apercu, heure, badge non-lu |
| `ConversationView.tsx` | Panel droit : bulles + input + separateurs de date |
| `MessageBubble.tsx` | Bulle individuelle (envoye=droite cyan, recu=gauche glass) |
| `ConversationHeader.tsx` | Barre haut conversation : avatar, nom, retour, suppression |
| `ConversationInput.tsx` | Textarea auto-resize + bouton envoyer |
| `EmptyState.tsx` | Etats vides (pas de conversation, pas de selection) |
| `DeleteConfirmDialog.tsx` | Dialogs confirmation suppression (message ou conversation) |

**Points techniques :**
- Conversations derivees cote client en groupant les messages par "l'autre participant" (pas de thread_id en BDD)
- Query key `["messages", userId]` : meme que l'ancien code, les `invalidateQueries` de `SendMessageDialog` et `SendRescuerMessageDialog` continuent de fonctionner
- Real-time via canal Supabase `conversations-${userId}` (INSERT/UPDATE/DELETE)
- `avatar_url` joint depuis les tables `*_profiles` selon `profile_type`
- Mobile : navigation par etat (liste OU conversation), `bg-[#0a1628]`
- Desktop : split view (liste 320px + conversation) avec glassmorphism
- Sauveteurs : reception + reponse uniquement (pas de bouton "nouveau message")
- `Mailbox.tsx` (page) = re-export 1 ligne vers `ConversationMailbox`

### `components/formations/`
| Fichier | Role |
|---------|------|
| `SSSFormationsList.tsx` | Liste formations SSS (cache externe) |
| `SSSCalendarEmbed.tsx` | Calendrier SSS integre |
| `TrainerCoursesList.tsx` | Cours publies du formateur |

### `components/onboarding/`
Wizard 6 etapes par type (voir section Onboarding ci-dessous).

### `components/skeletons/`
| Fichier | Role |
|---------|------|
| `ProfileSkeleton.tsx` | Placeholder shimmer profil |
| `PostSkeleton.tsx` | Placeholder shimmer post flux |

### `components/ui/` (31 composants Shadcn/UI)
Ne PAS modifier sauf demande explicite. Inclut: alert, avatar, badge, button, calendar, card, carousel, checkbox, dialog, form, input, label, popover, radio-group, rich-text-editor, select, separator, sheet, skeleton, switch, tabs, textarea, toast, toaster, toggle, tooltip, moving-border, neon-button, lazy-image.

---

## Hooks Complets

| Hook | Table Supabase | Role |
|------|---------------|------|
| `useFullProfile` | profiles + *_profiles | Source de verite profil complet, optimistic updates |
| `useProfileQuery` | profiles | Profil de base avec cache |
| `useFormations` | formations, trainer_students | CRUD formations + sync liens formateur |
| `useExperiences` | experiences | CRUD experiences pro |
| `useAvailabilities` | availabilities | CRUD dates disponibles |
| `useJobPostings` | job_postings | CRUD offres emploi |
| `useFlux` | flux_posts, flux_likes, flux_comments | Feed social, likes, commentaires, real-time |
| `useDocumentUpload` | Storage bucket | Upload PDF (max 20MB) |
| `useFileUpload` | Storage bucket | Upload fichiers generique |
| `useRescuerNotifications` | sss_formations_cache, job_postings | Compteurs nouvelles formations/emplois, real-time |
| `useUnreadMessages` | internal_messages | Badge messages non lus, real-time |
| `useFluxNotifications` | flux_posts | Badge nouveaux posts (localStorage last_seen) |
| `useNotificationPreferences` | notification_preferences | Toggle notifs (recyclage, email, push) |
| `useAppResume` | - | Gestion PWA background (refresh >60s) |
| `usePullToRefresh` | - | Pull-to-refresh mobile |
| `usePhotoPicker` | - | Picker photo natif/web |
| `useCalendarModal` | - | Etat calendrier modal |
| `useTabReset` | - | Scroll top sur re-clic onglet |
| `useMobile` | - | Detection mobile (< 768px) |
| `useToast` | - | Systeme toast en memoire |
| `useOrganizations` | trainer_profiles | Liste organismes formateurs |
| `useEstablishmentProfile` | establishment_profiles | Profil etablissement |
| `useSSSFormations` | sss_formations_cache | Cache formations SSS externes |
| `useRecyclingReminders` | formations | Alertes recyclage certifications |
| `useConversations` | internal_messages + *_profiles | Messagerie : fetch, groupement, real-time, mutations |
| `useSwipeNavigation` | - | Swipe horizontal entre onglets mobile (touch events natifs) |

---

## Utilitaires (`src/utils/`)

| Fichier | Role |
|---------|------|
| `constants.ts` | LOGO_PATH, PWA_NAME, PWA_THEME_COLOR, etc. |
| `lazyRetry.ts` | Wrapper lazy() avec retry + auto-reload |
| `asyncHelpers.ts` | withTimeout(), safeGetUser(), safeQuery() avec retry |
| `logger.ts` | Logger dev/prod (log/info = dev only, warn/error = always) |
| `swissCantons.ts` | 26 cantons suisses avec villes |
| `formationCategories.ts` | 4 categories de formation SSS |
| `recyclingUtils.ts` | Statut recyclage (not_due, due_soon, overdue) |
| `recyclingConfig.ts` | Config recyclage par type certification |
| `sortingUtils.ts` | Tri formations, emplois |
| `authErrors.ts` | Traduction erreurs Supabase → messages FR |
| `navigation.ts` | Helpers navigation |
| `registerServiceWorker.ts` | Enregistrement service worker PWA |

---

## Real-Time (Supabase Subscriptions)

| Table | Evenements | Utilise par |
|-------|-----------|-------------|
| `internal_messages` | INSERT, UPDATE, DELETE | useUnreadMessages, useConversations |
| `flux_posts` | INSERT, UPDATE | useFlux |
| `sss_formations_cache` | INSERT | useRescuerNotifications |
| `job_postings` | INSERT | useRescuerNotifications |

---

## Strategie de Cache

| Couche | Mecanisme | Duree |
|--------|-----------|-------|
| TanStack Query | staleTime | 5 minutes |
| TanStack Query | gcTime | 24 heures |
| localStorage persister | PROBAIN_QUERY_CACHE | Survit fermeture app |
| localStorage profil | probain_profile_* | Fallback si query echoue |
| sessionStorage | probain_profile_loaded_session | Survit remount, pas fermeture |

---

## Tables Supabase Principales

| Table | Role |
|-------|------|
| `profiles` | Table centrale utilisateurs (liee a auth.users) |
| `rescuer_profiles` | Extension sauveteur (phone, canton, brevet, avatar) |
| `trainer_profiles` | Extension formateur (organization_name, certifications) |
| `establishment_profiles` | Extension etablissement (pool_types, opening_hours) |
| `formations` | Certifications auto-declarees par sauveteurs |
| `experiences` | Experiences professionnelles |
| `availabilities` | Dates de disponibilite |
| `job_postings` | Offres d'emploi des etablissements |
| `trainer_courses` | Cours publies par formateurs |
| `course_registrations` | Inscriptions aux cours |
| `trainer_students` | Relations formateur-eleve (JAMAIS supprimees) |
| `internal_messages` | Messagerie interne |
| `notifications` | Notifications systeme |
| `notification_preferences` | Preferences notifs (email, push, recyclage) |
| `flux_posts` | Posts du fil d'actualites |
| `flux_likes` / `flux_comments` | Interactions sur les posts |
| `sss_formations_cache` | Cache formations SSS (scraper GitHub Actions) |
| `user_notification_status` | Timestamps derniere consultation |
| `admins` / `admin_audit_logs` | Administration |
| `account_claim_requests` | Reclamations de comptes |

---

## Lib (`src/lib/`)

| Fichier | Role |
|---------|------|
| `queryClient.ts` | TanStack Query config + persister localStorage |
| `native.ts` | Bridge Despia natif (haptics, biometrics, share, push) |
| `utils.ts` | `cn()` = clsx + tailwind-merge |

---

## Points d'Attention

### Messagerie (style Instagram/WhatsApp)
- **Redesign complet** : conversations groupees par contact avec bulles de messages
- Sauveteurs: reception + reponse uniquement (pas d'initiation de conversation)
- Formateurs/Etablissements: bidirectionnelle
- Apres envoi d'un message, TOUJOURS invalider le cache: `queryClient.invalidateQueries({ queryKey: ["messages"] })`
- Le groupement par conversation est fait cote client (pas de `thread_id` en BDD)
- `Mailbox.tsx` et `EstablishmentMailbox.tsx` sont des re-exports vers `ConversationMailbox`
- Les anciens fichiers (`RescuerMailbox.tsx`, `MessageCard.tsx`, `MessageDialog.tsx`) sont obsoletes mais encore presents

### Inscription par type de profil
- **Sauveteurs** : inscription directe (email + mot de passe) via `AuthForm.tsx` → `handleRescuerSignup()`. IDs des champs : `#rescuer-email`, `#rescuer-password`, `#rescuer-password-confirm`
- **Formateurs** : **claim request uniquement**. L'utilisateur selectionne son organisme dans un dropdown (`#trainer-select`) et laisse son email (`#claim-email`). Un admin cree le compte manuellement. Pas de champ mot de passe.
- **Etablissements** : **claim request uniquement**. L'utilisateur laisse son email pro (`#establishment-email`). Un admin le contacte. Pas de champ mot de passe.
- Table BDD : `account_claim_requests` (type, email, selected_trainer_name, status)
- **Consequence** : seuls les sauveteurs peuvent etre testes en E2E complet (inscription → onboarding → profil)

### Onboarding
- Tous champs optionnels (bouton "Passer")
- Envoyer `null` au lieu de `""` pour champs vides
- Donnees dans `profiles` ET profil specifique
- Nom organisation formateur: verrouille apres onboarding (disabled + cadenas)

### PWA / App Resume
- `refetchOnWindowFocus: false` (evite requetes intempestives)
- `MIN_HIDDEN_DURATION = 60` secondes avant refresh
- Si session expiree au resume: `signOut()` propre (voir `useAppResume.ts`)
- Lazy loading via `lazyRetry()` avec retry + auto-reload (protection chunks invalides apres deploiement)

### Lazy Loading
Utiliser `lazyRetry()` de `src/utils/lazyRetry.ts` (PAS `React.lazy()` directement).
Named exports: `.then(m => ({ default: m.ComponentName }))`

### Notifications
- Badge de la cloche: gated par `isNotificationsReady` (attend toutes les sources)
- `notifyRecycling` default `false` pendant le chargement (pas `true`)
- Ne PAS utiliser de toast succes dans un Sheet (Radix Dialog focus management)

---

## Pieges Techniques Connus

### Radix Dialog + Toast = Sheet qui se ferme
Le Toast cree un portail DOM en dehors du Sheet. Le Sheet detecte l'interaction exterieure via `onFocusOutside` et ferme. **Solution**: pas de toast succes dans un Sheet, le Switch qui change suffit.

### Heritage CSS traverse position:fixed
Un composant `position: fixed` reste enfant DOM de son parent. Si le parent a `text-white`, le fixed l'herite. **Solution**: forcer `text-gray-900` sur le conteneur blanc du modal.

### Hooks React et return conditionnel
TOUS les hooks doivent etre appeles AVANT tout `return` conditionnel. Sinon: "Rendered more hooks than during the previous render".

### useRef pour listener stable
Pour lire un state dans un callback sans re-souscrire au listener: stocker dans un `useRef`, lire `ref.current` dans le callback, garder deps `[]`.

### Debounce asymetrique pour layout
Passer a `true` immediatement, retarder `false` de 300ms. Evite les demontages transitoires quand `session` est momentanement `null`.

### window.open() bloque sur mobile
Appeler `window.open()` uniquement dans un `onClick` direct (geste utilisateur). Jamais dans `useEffect` ou callback async.

### Flash blanc entre transitions de route (mobile)
`DashboardLayout` et `App.tsx` utilisaient `bg-blue-50` sur mobile, visible brievement lors des changements de route car les pages lazy-loaded ne couvrent pas immediatement le viewport. **Solution** : remplacer `bg-blue-50` par `bg-primary-dark` dans `DashboardLayout.tsx` et `App.tsx`. Toutes les pages internes utilisent deja des fonds sombres sur mobile.

### Flash couleur sur la messagerie (mobile)
`ConversationMailbox` utilisait `bg-[#0a1628]` (bleu-marine) alors que `DashboardLayout`, `LoadingScreen` et le Suspense fallback utilisent `bg-primary-dark` (`#0A1033`, violet-marine). Lors du lazy-loading du chunk JS, le fond `#0A1033` du Suspense etait visible, puis changement brusque vers `#0a1628` au montage du composant. **Solution** : aligner `ConversationMailbox` sur `bg-primary-dark` pour unifier la couleur avec le reste du layout. **Regle** : toute page lazy-loaded doit utiliser `bg-primary-dark` comme fond principal mobile, jamais un hex hardcode different.

---

## Z-Index Hierarchy

| Composant | Z-Index |
|-----------|---------|
| CalendarModal overlay | `z-[100]` |
| Bottom Tab Bar | `z-[60]` |
| FAB bouton message | `z-[55]` |
| Sheet overlay | `z-50` |
| Sheet header | `z-20` |

---

## Dark Mode Pattern

```
Background: #0a1628
Orbes: bg-blue-500/20, bg-cyan-500/15, bg-violet-500/10 (blur-3xl)
Card: backdrop-blur-xl bg-white/10 border-white/10
Input: bg-white/10 border-white/20 text-white placeholder:text-white/40
Label: text-white/70
Focus: ring-cyan-400/30 border-cyan-400/50
Bouton save: from-cyan-500 to-blue-600
```

---

## Header Compact (pattern unifie)

Toutes les pages principales (Jobs, Training, Flux, Messagerie) utilisent le meme style de header compact horizontal :

```
Structure : icone glassmorphism a gauche + titre + sous-titre a droite
Fond : bg-gradient-to-br from-primary via-probain-blue to-primary-dark
Icone : p-2 bg-[couleur]/20 rounded-xl border border-white/10
        Icone Lucide h-5 w-5 text-cyan-400
Titre : text-sm font-bold text-white tracking-tight
Sous-titre : text-[11px] text-white/40
Padding : px-4 py-3
```

| Page | Icone | Titre | Sous-titre |
|------|-------|-------|------------|
| Jobs | Briefcase | OFFRES D'EMPLOI | Trouvez votre prochain poste |
| Training | GraduationCap | FORMATIONS (ou N NOUVELLES OPPORTUNITES) | Formations et offres disponibles |
| Flux | MessageCircle | FLUX | Publications et actualites |
| Messagerie | Mail | MESSAGERIE | N conversation(s) |

**Important** : si une page a un etat de chargement (`loading`), le header dans le loading state doit etre IDENTIQUE au header final (meme layout horizontal) pour eviter un flash visuel.

---

## Bouton Modifier Profil (mobile vs desktop)

- Le bouton jaune "MODIFIER" (avec icone crayon) est **masque sur mobile** sur les 3 profils
- Il reste visible uniquement sur **desktop** (dans le layout `hidden md:flex` a cote du nom)
- Les utilisateurs mobiles editent via l'engrenage Settings
- Fichiers concernes :
  - `src/components/profile/RescuerProfileHeader.tsx`
  - `src/components/profile/TrainerProfile.tsx` (bloc `fixed bottom-0 md:hidden` supprime)
  - `src/components/profile/EstablishmentProfile.tsx` (bloc `fixed bottom-0 md:hidden` supprime)

---

## Disponibilite Sauveteur

### Architecture
- **Etat local** : `isAvailable`, `isAlwaysAvailable`, `selectedDates`, `userAvailabilityDates` dans `Profile.tsx`
- **Source de verite** : les etats locaux (pas le context `rescuerProfile`), initialises UNE SEULE FOIS via `hasInitializedRef`
- **Calcul pastille** : `isActuallyAvailableToday` derive des etats locaux dans un `useEffect`
- **Rechargement BDD** : `availabilityVersion` (compteur) incremente apres chaque validation pour forcer le `useEffect` de chargement

### Logique de la pastille verte/rouge
```
!isAvailable                        → rouge (indisponible)
isAlwaysAvailable                   → vert (toujours dispo)
userAvailabilityDates.length > 0    → vert si aujourd'hui est dans les dates, sinon rouge
pas de dates specifiques            → vert (disponible par defaut)
```

### Boutons disponibilite
- Les boutons "Je suis disponible" / "Je ne suis pas disponible" appellent `setAvailability(true)` / `setAvailability(false)` (setters explicites, PAS un toggle `!isAvailable`)
- Evite les race conditions et les sauts d'etat

### Timezone
- **IMPORTANT** : Les dates de disponibilite sont stockees en `YYYY-MM-DD` (date sans timezone)
- `new Date("2026-01-31")` cree une date UTC = 30 jan 23h en CET → **BUG**
- Utiliser `new Date(year, month - 1, day)` pour creer des dates locales
- Utiliser `getFullYear()/getMonth()/getDate()` pour formater (PAS `toISOString()`)
- Fichier : `src/hooks/use-availabilities.ts`

### Fichiers
| Fichier | Role |
|---------|------|
| `src/pages/Profile.tsx` | Etat local + logique toggle + calcul pastille |
| `src/components/profile/AvailabilitySection.tsx` | UI boutons + calendrier + chargement dates |
| `src/components/profile/AvailabilityValidation.tsx` | Sauvegarde dates + effacement |
| `src/hooks/use-availabilities.ts` | CRUD dates (fetch/save/clear) avec dates locales |

---

## Changement de mot de passe

- Composant `ChangePasswordSection` ajoute aux 3 profils :
  - Sauveteur : `ProfileForm.tsx` (dark mode)
  - Formateur : `TrainerProfileForm.tsx` (dark mode)
  - Etablissement : `EstablishmentProfileForm.tsx` (light mode)
- Prop `darkMode` pour adapter le theme
- Independant du formulaire principal (bouton propre, pas de submit form)
- **AlertDialog de confirmation** avant le changement effectif (demande validation utilisateur)

---

## Avatar Upload — Bugs corrigés

### Bug 1 : ProfileHeader hardcodait `establishment_profiles`
`ProfileHeader.tsx` mettait a jour la table `establishment_profiles` pour TOUS les types de profil lors de l'upload d'avatar. **Fix** : le composant ne met plus a jour que la table partagee `profiles`, et delegue la mise a jour du profil specifique au parent via le callback `onAvatarUpdate`.

### Bug 2 : Pas de validation taille fichier (5MB)
Aucun des handlers d'upload d'avatar ne validait la taille du fichier. Un fichier >5MB provoquait une erreur Supabase silencieuse. **Fix** : validation 5MB ajoutee aux 5 handlers :
- `src/components/profile/RescuerProfileHeader.tsx`
- `src/components/profile/ProfileHeader.tsx`
- `src/components/onboarding/RescuerOnboardingFlow.tsx`
- `src/components/onboarding/TrainerOnboardingFlow.tsx`
- `src/components/onboarding/OnboardingWizard.tsx`

### Bug 3 : Options de cache manquantes sur l'upload onboarding
Les 3 handlers d'upload dans les flows d'onboarding n'utilisaient pas `cacheControl` ni `upsert`, causant des doublons dans le storage si l'utilisateur re-uploadait. **Fix** : ajout de `{ cacheControl: '3600', upsert: true }` aux 3 fichiers d'onboarding.

### Bug 4 : Input file pas reset apres selection
`usePhotoPicker.ts` ne remettait pas `event.target.value = ''` apres la selection d'un fichier. Si l'upload echouait et que l'utilisateur re-selectionnait le meme fichier, le browser ne declenchait pas `onChange` (optimisation navigateur). **Fix** : ajout de `event.target.value = ''` dans `handleFileSelected` de `usePhotoPicker.ts`. Le `PhotoPickerSheet` faisait deja ce reset correctement.

### Bug 5 : Menu natif camera/galerie masque par le footer sur mobile (onboarding)
`RescuerPhoto.tsx` utilisait `usePhotoPicker` + un `<input type="file">` cache. Sur mobile, cela declenchait le menu natif de l'OS (choix camera/galerie) qui apparaissait en bas de l'ecran et etait masque par le bouton "CONTINUER/PASSER". **Fix** : remplacement par `PhotoPickerSheet` (bottom sheet Radix, z-50, portail DOM) qui s'affiche proprement au-dessus de tout avec deux boutons explicites "Prendre une photo" / "Choisir depuis la galerie".

### Pattern d'upload photo — Regle

- **Onboarding (mobile)** : toujours utiliser `PhotoPickerSheet` (bottom sheet avec boutons camera/galerie). Ne PAS utiliser `usePhotoPicker` + input cache car le menu natif de l'OS est masque par les boutons de navigation.
- **Profil (post-onboarding)** : `usePhotoPicker` est OK car le layout est different (pas de bouton plein ecran en bas).
- **Reset input** : `usePhotoPicker.ts` reset automatiquement `event.target.value = ''` apres chaque selection.
- **Fichiers concernes** :
  - `src/components/onboarding/steps/RescuerPhoto.tsx` → `PhotoPickerSheet`
  - `src/components/shared/PhotoPickerSheet.tsx` → Sheet Radix (camera + galerie + reset input)
  - `src/hooks/usePhotoPicker.ts` → Hook simple (input file + reset)
  - `src/components/profile/RescuerProfileHeader.tsx` → `usePhotoPicker` (profil)

---

## Swipe Navigation Mobile

Navigation par swipe horizontal entre onglets sur mobile, activee dans `DashboardLayout`.

### Fonctionnement
- Hook `useSwipeNavigation(profileType)` appele dans `DashboardLayout.tsx`
- Ecoute les touch events natifs (`touchstart`, `touchmove`, `touchend`) sur `document`
- Seuil minimum : 50px horizontal, ratio direction 1.5x (horizontal > vertical)
- Verrouillage de direction apres 10px de mouvement (evite conflits avec scroll vertical)
- Haptic feedback (`light`) a chaque changement d'onglet
- Actif uniquement sur mobile (media query `max-width: 767px`)

### Routes par profil
```
maitre_nageur:  /profile → /jobs → /training → /rescuer/mail → /flux
formateur:      /trainer-profile → /trainer-profile/students → /trainer-profile/mail → /flux
etablissement:  /establishment-profile → /establishment-profile/announcements → /establishment-profile/rescuers → /establishment-profile/mail → /flux
```

### Fichiers
| Fichier | Role |
|---------|------|
| `src/hooks/useSwipeNavigation.ts` | Hook swipe (touch events, direction lock, seuils) |
| `src/layouts/DashboardLayout.tsx` | Appel du hook avec `profileType` |

---

## Formations SSS - Filtrage donnees scrapees

Les formations SSS proviennent d'un scraper GitHub Actions qui alimente `sss_formations_cache`. Le champ `formation.places` contient parfois le texte "Consulter sur le site SSS" au lieu d'une vraie info de disponibilite.

### Filtre applique
```typescript
formation.places && !formation.places.toLowerCase().includes('consulter')
```

Ce filtre est applique dans **4 endroits** (carte + dialog, x2 composants) :
- `src/components/formations/SSSFormationsList.tsx` : `FormationCard` (carte + dialog)
- `src/pages/Training.tsx` : `FormationCardLocal` (carte + dialog)

---

## Deploiement

| Environnement | URL | Methode | Repo GitHub |
|---------------|-----|---------|-------------|
| **Native (production)** | https://www.probain.ch | Vercel | `deli227/probain-native` |
| **Web (legacy)** | - | - | `deli227/pro-bain` (plus utilise) |

---

## Commandes

```bash
npm run dev          # Port 8080
npm run build
npm run test
npm run lint
npx vitest run       # 137 unit tests (~5s)
npx playwright test  # 39 E2E tests (~5min)
```

---

## Tests

### Tests Unitaires (Vitest) — 137 tests, 14 fichiers

| Fichier | Tests | Couverture |
|---------|-------|------------|
| `src/utils/__tests__/recyclingUtils.test.ts` | 24 | resolveCertName, getRecyclingInfo, alerts, labels |
| `src/hooks/__tests__/sss-unicode.test.ts` | 23 | Decodage unicode SSS |
| `src/utils/__tests__/sortingUtils.test.ts` | 14 | Tri certifications, emplois, priorites |
| `src/hooks/__tests__/useSwipeNavigation.test.ts` | 13 | Routes par profil, seuils swipe, direction lock |
| `src/components/mailbox/conversation/__tests__/types.test.ts` | 13 | Groupement conversations |
| `src/utils/__tests__/asyncHelpers.test.ts` | 9 | withTimeout, safeQuery avec retry |
| `src/hooks/__tests__/use-availabilities.test.ts` | 9 | Dates timezone-safe, CRUD disponibilites |
| `src/utils/__tests__/authErrors.test.ts` | 6 | Traduction erreurs Supabase → francais |
| `src/components/onboarding/__tests__/OnboardingWizard.test.tsx` | 6 | Routage par type profil |
| `src/components/onboarding/__tests__/TrainerOnboardingFlow.test.tsx` | 6 | Persistence localStorage formateur |
| `src/components/onboarding/__tests__/RescuerOnboardingFlow.test.tsx` | 5 | Persistence localStorage sauveteur |
| `src/components/shared/__tests__/ErrorBoundary.test.tsx` | 4 | Capture erreurs, recovery |
| `src/hooks/__tests__/use-file-upload.test.ts` | 3 | Upload fichier, validation taille |
| `src/hooks/__tests__/use-formations.test.tsx` | 2 | Chargement formations |

### Tests E2E (Playwright) — 39 tests, 7 fichiers

**Config** : `playwright.config.ts` avec 4 projets :
- `auth-setup` : login + sauvegarde session (`.auth/user.json`)
- `public-tests` : tests sans auth (homepage, auth, onboarding, avatar upload)
- `desktop` : tests authentifies viewport desktop (1280x720)
- `mobile` : tests authentifies viewport mobile (390x844)

| Fichier | Tests | Couverture |
|---------|-------|------------|
| `e2e/auth.spec.ts` | 5 | Formulaire connexion, mauvais password, login valide, liens legaux, types profil |
| `e2e/homepage.spec.ts` | 4 | Chargement page, perf <5s, page /auth, scroll mobile |
| `e2e/onboarding.spec.ts` | 2 | Inscription sauveteur + 6 etapes skip / champs remplis + nettoyage |
| `e2e/avatar-upload.spec.ts` | 1 | Inscription + upload avatar + persistence apres reload + nettoyage |
| `e2e/profile.spec.ts` | 6 | Page profil, formations, disponibilite, toggle dispo, edition desktop, console errors |
| `e2e/navigation.spec.ts` | 10 | Tab bar, header, navigation 5 onglets, tab actif, settings, scroll, navigation complete |
| `e2e/messagerie.spec.ts` | 4 | Page messagerie, liste conversations, console errors (+ 1 skipped: ouvrir conversation) |
| `e2e/flux.spec.ts` | 2 | Page flux, posts ou etat vide (+ 3 skipped: like, commentaires, envoi commentaire) |
| `e2e/settings.spec.ts` | 5 | Page settings, suppression compte, dialog confirmation, mot de passe, console errors |

### Regles de test

- **`.env.test`** (gitignored) contient `E2E_USER_EMAIL` et `E2E_USER_PASSWORD` pour les tests authentifies
- Email verification est **DESACTIVEE** dans Supabase pour les comptes de test
- Les E2E qui creent des comptes **DOIVENT les supprimer** via Settings → "Supprimer mon compte" en fin de test
- Seuls les **sauveteurs** peuvent etre testes en E2E complet (inscription → onboarding → profil) car formateurs et etablissements utilisent un systeme de claim request (voir section Inscription)
- Les tests skipped dependent de donnees existantes en BDD (posts, conversations)
- `window.matchMedia` est mocke dans `src/setupTests.ts` pour les tests unitaires

---

## Documentation

| Document | Contenu |
|----------|---------|
| `project-context.md` | Regles de developpement, conventions, securite |
| `docs/data-models.md` | Schema base de donnees Supabase complet |
| `docs/despia.md` | Framework natif iOS/Android (Despia) |
| `docs/development-log.md` | Historique sessions, bugs resolus, patterns |
| `docs/workflow-guide.md` | Guide workflow BMAD quotidien |
| `docs/config/netlify.toml` | Config Netlify (reference web app) |
