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
  Content (pb-28 pour tab bar + safe-area)
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
| `JobPostingCard.tsx` / `JobPostingDialog.tsx` | Offre d'emploi (dark theme, badge contrat colore) |
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
| `EstablishmentProfileForm.tsx` | Edition profil etablissement (dark theme, toggles notifications) |
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
| `ImageCropDialog.tsx` | Recadrage photo circulaire (react-easy-crop) avant upload |
| `RescuerProfileSheet.tsx` | Sheet profil sauveteur (etablissements cliquent depuis flux) |
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
| `useConversations.ts` | Hook : fetch, groupement par contact, real-time, mutations, resolution noms etablissements/formateurs |
| `ConversationMailbox.tsx` | Orchestrateur : layout responsive, permissions par profil |
| `ConversationList.tsx` | Panel gauche : liste des conversations + header compact |
| `ConversationListItem.tsx` | Ligne : avatar, nom, apercu, heure, badge non-lu, bouton suppression au hover |
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
| `dateUtils.ts` | `parseDateLocal()` + `formatDateLocal()` — dates timezone-safe (voir section Timezone) |
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
- **Resolution des noms** : les etablissements et formateurs n'ont pas de `first_name` dans `profiles`. `useConversations.ts` fait un post-fetch pour resoudre `organization_name` depuis `establishment_profiles` et `trainer_profiles` (evite d'afficher "Utilisateur")
- **Suppression depuis la liste** : `ConversationListItem` affiche une icone poubelle au hover, `ConversationList` gere la confirmation et l'appel a `onDeleteConversation`

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
- **Badge sizing** : utiliser `h-[18px] min-w-[18px] px-1 text-[10px]` (pas de taille fixe `h-5 w-5`) pour eviter le clipping sur les nombres a 2+ chiffres (ex: 99). Applique dans `NotificationsPopup.tsx` et `NotificationBell.tsx`
- **Toggles par profil** : les 3 profils ont des toggles dans leur formulaire d'edition, via `useNotificationPreferences(userId)` + composant `Switch`. L'etablissement a les toggles "Messages" et "Flux" dans `EstablishmentProfileForm.tsx`

---

## Pieges Techniques Connus

### Locale francaise obligatoire sur TOUS les calendriers et dates
L'application est 100% en francais. Tout composant `<Calendar>` (react-day-picker) DOIT avoir `locale={fr}` (`import { fr } from "date-fns/locale"`). Sans ce prop, les noms de mois et jours s'affichent en anglais. De meme, tout appel a `format()` ou `formatDistanceToNow()` de date-fns DOIT passer `{ locale: fr }`. Les appels natifs `toLocaleDateString()` doivent utiliser `'fr-FR'` ou `'fr-CH'`.

**Composants Calendar avec `locale={fr}`** :
- `src/components/shared/CalendarModal.tsx` — calendrier modal partage (utilise par Jobs, Training, FormationForm, ExperienceForm)
- `src/components/profile/forms/PersonalInfoForm.tsx` — calendrier date de naissance (edition profil)
- `src/components/onboarding/steps/RescuerBirthdate.tsx` — calendrier onboarding sauveteur
- `src/components/profile/AvailabilitySection.tsx` — calendrier disponibilites

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

### Focus ring bleu sur les boutons natifs (Popover/Sheet triggers)
Un `<button>` HTML brut (pas le composant `Button` de Shadcn) garde le focus ring natif du navigateur (bleu) apres interaction. Le `Button` de Shadcn a `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` qui masque ce probleme. **Solution** : ajouter `focus:outline-none focus-visible:outline-none` sur tout `<button>` natif utilise comme trigger de Popover, Sheet, ou Dialog. Fichier exemple : `MobileHeader.tsx` (engrenage settings).

### Controles caches derriere la BottomTabBar sur mobile
**REGLE OBLIGATOIRE** : tous les boutons de l'application doivent etre visibles sur TOUS les ecrans, TOUS les profils. Aucun bouton ne doit etre masque par la BottomTabBar ou la safe-area.

**Solution structurelle (z-index)** : les composants Radix UI (`Dialog`, `Sheet`, `AlertDialog`) utilisent `z-[70]`, AU-DESSUS de la BottomTabBar (`z-[60]`). Les overlays custom (`AddFormation`, `AddExperience`, `CalendarModal`, `ImageCropDialog`) utilisent `z-[70]` ou `z-[100]`. Ainsi, tout overlay se superpose correctement a la navigation.

**DashboardLayout** : la classe CSS `.dashboard-bottom-safe` dans `index.css` applique automatiquement `padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px) + 16px)` sur mobile (< 768px). Les pages n'ont plus besoin de `pb-XX` pour degager la BottomTabBar — le layout gere tout.

**Boutons fixes dans les Sheets** : les formulaires de profil (ProfileForm, TrainerProfileForm, EstablishmentProfileForm) sont dans des Sheets `z-[70]`. Le bouton save utilise `bottom-0` avec `paddingBottom: max(1rem, env(safe-area-inset-bottom))` via style inline. PAS de `bottom-[100px]` — le Sheet est deja au-dessus de la BottomTabBar.

**Overlays custom** : tout overlay `fixed inset-0` dans le DashboardLayout DOIT utiliser `z-[70]` minimum. Les `z-50` sont reserves aux pages d'onboarding (pas de BottomTabBar).

**Dialogs scrollables** : tout `DialogContent` affiche dans le DashboardLayout doit avoir `max-h-[90vh] overflow-y-auto` pour garantir que les boutons sont accessibles par scroll sur les petits ecrans.

Fichiers impactes : `dialog.tsx`, `sheet.tsx`, `alert-dialog.tsx`, `DashboardLayout.tsx`, `index.css`, `ProfileForm.tsx`, `TrainerProfileForm.tsx`, `EstablishmentProfileForm.tsx`, `AddFormation.tsx`, `AddExperience.tsx`, `PersonalInfoForm.tsx`

### Calendriers coupes en haut sur mobile
**REGLE OBLIGATOIRE** : tous les calendriers doivent etre entierement visibles sur TOUS les ecrans, TOUS les profils (sauveteur, formateur, etablissement).

**Probleme** : les calendriers modaux utilisaient `items-end` (aligne en bas) sur mobile. Sur les petits ecrans, le panneau calendrier (~530px de haut) depassait du viewport par le haut, masque par le header.

**Solution** : centrage vertical (`items-center`) + padding (`p-4`) + contrainte hauteur (`max-h-[calc(100vh-2rem)] overflow-y-auto`). Le calendrier est toujours entierement visible et scrollable si necessaire.

**Pattern a appliquer sur tout calendrier modal** :
```tsx
// Overlay conteneur :
<div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
// Panneau calendrier :
<div className="... rounded-2xl max-w-sm w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
```

**Calendriers fixes** :
| Composant | Utilise par | Fix |
|-----------|-----------|-----|
| `CalendarModal.tsx` | Jobs, Training, FormationForm, ExperienceForm | `items-center p-4` + `max-h` + `overflow-y-auto` |
| `PersonalInfoForm.tsx` (inline) | 3 profils (edition profil) | Meme pattern |
| `RescuerBirthdate.tsx` | Onboarding sauveteur | `max-h` + `overflow-y-auto` (deja centre) |

### Card bg-card blanc invisible sur fond sombre
Le composant `Card` de Shadcn/UI applique `bg-card` (blanc pur) par defaut. Sur un fond sombre, si le texte est `text-white`, tout devient invisible. Le gradient semi-transparent (`from-white/15 to-white/5`) ne masque pas le blanc. **Solution** : ajouter `bg-transparent` au `Card` pour neutraliser `bg-card`. Ne PAS modifier `card.tsx`.

### Shadcn Button variant="outline" invisible sur fond sombre
Le `Button` de Shadcn avec `variant="outline"` applique `bg-background` (blanc) et `text-foreground` (noir) par defaut. Sur un fond sombre (`bg-[#0a1628]`), meme si on ajoute `text-white/70`, la specificite de Shadcn peut l'overrider. **Solution** : utiliser un `<button>` natif avec des classes Tailwind explicites (`bg-white/10 text-white/70 border-white/20`) au lieu du `Button` Shadcn sur les fonds sombres. Meme probleme pour le bouton X de fermeture de `DialogContent` : ajouter `[&>button]:text-white/70 [&>button]:hover:text-white` au `DialogContent` pour styler le bouton enfant.

### Shadcn DialogContent double bouton fermeture
Le composant `DialogContent` de Shadcn/UI genere automatiquement un bouton X de fermeture (`DialogPrimitive.Close`) en haut a droite. Ne PAS ajouter un `<DialogClose>` manuel dans le contenu du dialog, sinon deux boutons X apparaissent. **Fichier reference** : `src/components/ui/dialog.tsx` (lignes 44-48).

---

## Z-Index Hierarchy

| Composant | Z-Index | Note |
|-----------|---------|------|
| CalendarModal overlay | `z-[100]` | Au-dessus de tout |
| ImageCropDialog | `z-[100]` | Au-dessus de tout |
| PersonalInfoForm calendar | `z-[100]` | Au-dessus de tout |
| Dialog overlay + content | `z-[70]` | Au-dessus de BottomTabBar |
| Sheet overlay + content | `z-[70]` | Au-dessus de BottomTabBar |
| AlertDialog overlay + content | `z-[70]` | Au-dessus de BottomTabBar |
| AddFormation / AddExperience | `z-[70]` | Overlays custom |
| Bottom Tab Bar | `z-[60]` | Navigation mobile |
| FAB bouton message | `z-[55]` | Flottant |
| Sheet header (sticky interne) | `z-20` | Interne au Sheet |

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

### Timezone — Dates YYYY-MM-DD (GLOBAL)
- **IMPORTANT** : Toutes les dates en BDD sont stockees en `YYYY-MM-DD` (date sans timezone)
- `new Date("2026-01-31")` cree une date UTC minuit = 30 jan 23h en CET (UTC+1) → **BUG : la date recule d'un jour**
- `date.toISOString().split('T')[0]` extrait la date UTC → meme bug en sens inverse a la sauvegarde
- **Solution** : utiliser les fonctions de `src/utils/dateUtils.ts` :
  - `parseDateLocal("YYYY-MM-DD")` → `new Date(year, month-1, day)` (date locale, pas UTC)
  - `formatDateLocal(date)` → `"YYYY-MM-DD"` via `getFullYear()/getMonth()/getDate()` (pas `toISOString()`)
- **Regle** : JAMAIS `new Date("YYYY-MM-DD")` pour parser une date BDD. JAMAIS `toISOString().split('T')[0]` pour sauvegarder.
- **Fichiers concernes** :
  - `src/utils/dateUtils.ts` — fonctions utilitaires timezone-safe
  - `src/hooks/use-availabilities.ts` — CRUD dates disponibilites
  - `src/pages/Profile.tsx` — calcul age + defaultValues birthDate
  - `src/components/profile/ProfileForm.tsx` — sauvegarde birth_date
  - `src/components/onboarding/RescuerOnboardingFlow.tsx` — persistence localStorage + sauvegarde Supabase

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
  - Etablissement : `EstablishmentProfileForm.tsx` (dark mode)
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

### Bug 6 : onChange perdu sur Android WebView (Despia) — inputs dans Portal Radix
`PhotoPickerSheet.tsx` placait les `<input type="file">` a l'interieur du `SheetContent`, qui est rendu dans un Portal Radix (`@radix-ui/react-dialog`). Sur Android WebView (app Despia via Google Play), quand le picker natif retourne le fichier selectionne, l'evenement `onChange` est silencieusement perdu car le DOM du Portal est detache du flux principal. Resultat : l'utilisateur choisit une photo mais rien ne se passe (pas de photo, pas d'erreur, pas de loader).

**Fix** : `PhotoPickerSheet` accepte maintenant des props `externalCameraRef` et `externalGalleryRef`. Quand fournies, le composant utilise ces refs au lieu de creer des inputs internes dans le Portal. Le composant parent place les `<input type="file">` a la racine de son propre DOM (hors du Portal). Applique a `RescuerPhoto.tsx` (onboarding etape 3). Retrocompatible : sans les props, le composant fonctionne comme avant.

**Fichiers modifies** :
- `src/components/shared/PhotoPickerSheet.tsx` — nouvelles props `externalCameraRef`/`externalGalleryRef`, inputs internes rendus conditionnellement
- `src/components/onboarding/steps/RescuerPhoto.tsx` — cree 2 refs + 2 inputs a la racine, passe les refs au Sheet

### Pattern d'upload photo — Regle

- **Android WebView (Despia)** : les `<input type="file">` doivent etre places HORS d'un Portal Radix (Sheet/Dialog). Utiliser les props `externalCameraRef`/`externalGalleryRef` de `PhotoPickerSheet` pour externaliser les inputs.
- **Onboarding (mobile)** : utiliser `PhotoPickerSheet` avec refs externes (inputs a la racine du composant). Ne PAS utiliser `usePhotoPicker` seul car le menu natif de l'OS est masque par les boutons de navigation.
- **Profil (post-onboarding)** : `RescuerProfileHeader` utilise `PhotoPickerSheet` sur mobile + `usePhotoPicker` sur desktop. Les inputs sont deja a la racine du composant.
- **Reset input** : `usePhotoPicker.ts` et `PhotoPickerSheet` font tous deux `event.target.value = ''` apres chaque selection.
- **Fichiers concernes** :
  - `src/components/onboarding/steps/RescuerPhoto.tsx` → `PhotoPickerSheet` + refs externes
  - `src/components/shared/PhotoPickerSheet.tsx` → Sheet Radix (camera + galerie + refs externes optionnelles)
  - `src/hooks/usePhotoPicker.ts` → Hook simple (input file + reset)
  - `src/components/profile/RescuerProfileHeader.tsx` → `PhotoPickerSheet` mobile + `usePhotoPicker` desktop

---

## Recadrage Photo Avatar (ImageCropDialog)

### Fonctionnement
Quand un sauveteur selectionne une photo de profil, un dialog de recadrage circulaire s'ouvre avant l'upload. L'utilisateur peut zoomer et deplacer l'image pour cadrer son visage.

### Flow
```
Selection photo (PhotoPickerSheet mobile / file picker desktop)
    ↓
Validation taille (5 MB max) — rejet immediat si trop gros
    ↓
ImageCropDialog s'ouvre (crop circulaire + slider zoom)
    ↓
Utilisateur ajuste le cadrage → "Valider"
    ↓
Canvas API genere un Blob JPEG (quality 0.9) aux dimensions du crop
    ↓
Upload vers Supabase Storage (pipeline existant)
```

### Details techniques
- **Lib** : `react-easy-crop` (~12kb gzip, zero dep) — `cropShape="round"`, `aspect={1}`
- **Zoom** : slider range (min 1, max 3, step 0.1) avec icone ZoomIn
- **Export** : `getCroppedImg()` utilise un `<canvas>` pour extraire la zone croppee → `canvas.toBlob('image/jpeg', 0.9)`
- **Layout mobile** : `fixed inset-0 z-[100]` (au-dessus de tout), padding-bottom `max(6rem, calc(env(safe-area-inset-bottom) + 5rem))` pour degager la BottomTabBar et la barre de geste
- **Cleanup** : `URL.revokeObjectURL()` a la fermeture (valider ou annuler)

### Scope
- **Actif** : profil sauveteur uniquement (`RescuerProfileHeader.tsx`)
- **Pas actif** : onboarding sauveteur, profil formateur, profil etablissement (upload direct sans crop)

### Fichiers
| Fichier | Role |
|---------|------|
| `src/components/shared/ImageCropDialog.tsx` | Dialog plein ecran avec react-easy-crop + Canvas API |
| `src/components/profile/RescuerProfileHeader.tsx` | Intercepte le fichier → ouvre crop → upload blob recadre |

### Regle mobile-first pour les overlays plein ecran
Tout overlay `fixed inset-0` avec des controles en bas (boutons, sliders) doit avoir un padding-bottom suffisant pour degager la BottomTabBar (76px) ET la safe-area. Utiliser `max(6rem, calc(env(safe-area-inset-bottom) + 5rem))` comme reference. Ne JAMAIS mettre des boutons d'action en `fixed bottom-0` sans prendre en compte la BottomTabBar.

---

## Flux — Commentaires : bugs corriges

### Bug 1 : Nom "Utilisateur" au lieu du vrai nom dans les commentaires
La RPC `get_flux_comments` ne faisait un `LEFT JOIN` que sur `rescuer_profiles`. Les formateurs et etablissements apparaissaient comme "Utilisateur" car leurs noms sont dans `trainer_profiles.organization_name` ou `establishment_profiles.organization_name`.

**Fix** : nouvelle migration SQL (`20260201000000_fix_flux_comments_all_profiles.sql`) qui joint les 4 tables de profil (`profiles`, `rescuer_profiles`, `trainer_profiles`, `establishment_profiles`) avec COALESCE pour resoudre le nom et l'avatar depuis la bonne table. Le fallback N+1 dans `useFlux.ts` a aussi ete corrige pour chercher dans les 4 tables.

**IMPORTANT** : La migration doit etre appliquee manuellement sur Supabase (SQL Editor ou `supabase db push`). Sans ca, seul le fallback N+1 fonctionne.

### Bug 2 : Commentaires visibles uniquement en cliquant "Commenter"
Le compteur de commentaires (`X commentaire(s)`) n'etait pas cliquable. La seule facon de voir les commentaires etait de cliquer le bouton "Commenter". **Fix** : le compteur est maintenant cliquable (`cursor-pointer`, `hover:underline`, `onClick → handleToggleComments`).

**Fichiers modifies** :
- `supabase/migrations/20260201000000_fix_flux_comments_all_profiles.sql` — RPC avec 4 LEFT JOINs
- `src/hooks/useFlux.ts` — fallback N+1 avec `trainer_profiles` et `establishment_profiles`
- `src/pages/Flux.tsx` — compteur de commentaires cliquable

### Bug 3 : Avatar des commentaires depasse du cercle
L'avatar dans les commentaires du flux utilisait un `<img>` brut avec seulement `rounded-full`, sans contraindre l'image a remplir le conteneur. Les photos non-carrees depassaient du cercle.

**Fix** : ajout de `h-full w-full object-cover` sur l'`<img>` et `shrink-0` sur l'`<Avatar>` pour empecher l'ecrasement dans le flex.

**Fichier** : `src/pages/Flux.tsx` (ligne ~222)

---

## Flux — Profil sauveteur cliquable (etablissements)

### Fonctionnement
Les etablissements peuvent cliquer sur les noms/avatars des sauveteurs dans les commentaires du flux pour voir leur profil dans un bottom sheet.

### Conditions d'affichage
- Le viewer est un **etablissement** (`profile_type === 'etablissement'`)
- L'auteur du commentaire est un **sauveteur** (`comment.profile_type === 'maitre_nageur'`)
- Ce n'est **pas** le propre commentaire de l'utilisateur (`comment.user_id !== userId`)

### RescuerProfileSheet
- Bottom sheet (Radix Sheet) en dark theme
- Fetch les tables `profiles` + `rescuer_profiles` en parallele
- Affiche : avatar, prenom/nom, email, telephone (si phone_visible), canton
- Bouton "Envoyer un message" → ouvre `SendRescuerMessageDialog`
- Le `SendRescuerMessageDialog` est rendu HORS du Sheet (evite le piege Radix Dialog + portail)

### Migration SQL requise
`supabase/migrations/20260201100000_add_profile_type_to_flux_comments.sql` — ajoute `p.profile_type::TEXT` au retour de `get_flux_comments`. **Doit etre appliquee avec `DROP FUNCTION` puis `CREATE`** car la signature de retour change. Sans migration, le fallback N+1 dans `useFlux.ts` fonctionne mais est plus lent.

### Fichiers
| Fichier | Role |
|---------|------|
| `src/components/shared/RescuerProfileSheet.tsx` | Bottom sheet profil sauveteur |
| `src/pages/Flux.tsx` | Noms/avatars cliquables + sheet |
| `src/hooks/useFlux.ts` | `profile_type` dans `FluxComment` interface + RPC/fallback |
| `supabase/migrations/20260201100000_add_profile_type_to_flux_comments.sql` | Migration RPC |

---

## Cartes d'emploi invisibles sur mobile (fix)

### Probleme
Les cartes d'offres d'emploi sur la page Jobs apparaissaient vides sur mobile : texte blanc (`text-white`) sur fond blanc. Le composant `Card` de Shadcn/UI applique `bg-card` par defaut (`--card: 0 0% 100%` = blanc pur). Le gradient `from-white/15 to-white/5` est semi-transparent et ne masque pas le fond blanc.

### Fix
Ajout de `bg-transparent` aux 3 instances de `Card` dans `src/pages/Jobs.tsx` pour neutraliser `bg-card`. `tailwind-merge` (via `cn()`) resout `bg-transparent` en supprimant `bg-card` car ils sont dans la meme categorie CSS (`background-color`). Le `bg-gradient-to-br` (`background-image`) reste intact.

### Regle
Tout `Card` utilise sur un fond sombre avec du texte `text-white` DOIT avoir `bg-transparent` pour neutraliser le `bg-card` blanc par defaut. Ne PAS modifier `card.tsx` (composant Shadcn/UI partage).

**Fichier** : `src/pages/Jobs.tsx` (3 instances de Card)

---

## Descriptions HTML des offres d'emploi (fix)

### Probleme
Les descriptions d'offres d'emploi sont creees avec le `RichTextEditor` (qui produit du HTML : `<p>`, `<ul>`, `<li>`, etc.). La page `Jobs.tsx` les affichait en texte brut avec `{job.description}`, ce qui montrait les balises HTML visibles aux utilisateurs.

### Fix
- **Cartes (preview)** : utilisation de `stripHtml()` (via `DOMParser`) pour extraire le texte brut depuis le HTML. Applique sur les cartes mobile ET desktop.
- **Dialog detail** : utilisation de `DOMPurify.sanitize()` + `dangerouslySetInnerHTML` avec classes `prose prose-sm prose-invert` pour un rendu HTML propre et securise.
- **Securite** : DOMPurify empêche les attaques XSS en nettoyant le HTML avant injection.

### Regle
Tout affichage de contenu cree via `RichTextEditor` doit :
- En mode apercu (carte) : utiliser `stripHtml()` pour du texte brut
- En mode complet (dialog/page) : utiliser `DOMPurify.sanitize()` + `dangerouslySetInnerHTML` + classes `prose prose-invert`

**Fichier** : `src/pages/Jobs.tsx`

---

## OTA Updates — Mise a jour instantanee Despia

### Probleme
Apres un deploiement Vercel, l'app Android (Despia WebView) continuait d'afficher l'ancienne version. Le service worker utilisait `CACHE_NAME = 'probain-v1'` (statique) avec une strategie cache-first aveugle : une fois les fichiers caches, ils n'etaient jamais re-telecharges.

### Solution
4 couches de correction pour des mises a jour instantanees et transparentes :

1. **Service worker reecrit** (`public/service-worker.js`)
   - `__BUILD_TIMESTAMP__` remplace par un timestamp unique a chaque build → nouveau CACHE_NAME → purge automatique
   - Strategie **network-first** pour HTML (toujours la derniere version si reseau dispo)
   - Strategie **cache-first** pour assets JS/CSS hashes (safe, les noms changent a chaque build)
   - `skipWaiting()` + `clients.claim()` : activation immediate du nouveau SW

2. **Script post-build** (`scripts/inject-sw-version.js`)
   - Execute apres `vite build` via `package.json` : `"build": "vite build && node scripts/inject-sw-version.js"`
   - Remplace `__BUILD_TIMESTAMP__` dans `dist/service-worker.js` par `Date.now()`

3. **Headers Vercel** (`vercel.json`)
   - `Cache-Control: no-cache` sur `index.html`, `service-worker.js`, `manifest.json`
   - Force le WebView a reverifier ces fichiers avec le serveur a chaque requete

4. **Detection des mises a jour** (`src/utils/registerServiceWorker.ts`)
   - `registration.update()` toutes les 5 minutes
   - Listener `updatefound` → quand le nouveau SW s'active → `window.location.reload()` automatique
   - Condition `navigator.serviceWorker.controller` : ne reload que si un ancien SW etait actif (pas au premier chargement)

### Fichiers
| Fichier | Role |
|---------|------|
| `public/service-worker.js` | SW avec version dynamique, network-first HTML, cache-first assets |
| `scripts/inject-sw-version.js` | Post-build : injecte timestamp dans dist/service-worker.js |
| `vercel.json` | Headers no-cache pour HTML, SW, manifest |
| `src/utils/registerServiceWorker.ts` | Detection mises a jour + reload auto |
| `package.json` | Script build modifie (`vite build && node scripts/inject-sw-version.js`) |

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

## Onglet Sauveteurs (etablissement) — Filtres et dialog profil

### Filtres
- **Canton** : `Select` dropdown avec les 26 cantons suisses (`CANTONS_SUISSES`), filtre par ID 2 lettres (ex: "GE", pas "Geneve"). Remplace l'ancien `Input` texte qui ne matchait jamais
- **Brevets** : les valeurs du filtre correspondent aux titres en BDD (`"Base Pool"`, `"Plus Pool"`, `"Pro Pool"`, `"BLS-AED"`, `"Module Lac"`, `"Module Riviere"`, `"Expert Pool"`, `"Expert BLS-AED"`, `"Expert Lac"`, `"Expert Riviere"`). Ne PAS prefixer par "Brevet"
- **Disponibilite** : filtre base sur `is_available_today` (calcule cote client a partir de `availability_status`, `is_always_available` et dates dans `availabilities`)

### Dialog profil sauveteur (dark theme)
Le dialog qui s'ouvre quand un etablissement clique sur un sauveteur utilise le dark theme de l'app :
- Fond `bg-[#0a1628]` + `border-white/10`
- Header gradient `from-primary via-probain-blue to-primary-dark`
- Avatar avec fallback gradient cyan/bleu, pastille disponibilite
- Badges glassmorphism (`bg-white/10`, `border-white/10`)
- Cartes formations/experiences en `bg-white/10 backdrop-blur-xl`
- Onglets sombres (`bg-white/10`, actif `bg-white/15`)
- Bouton "Envoyer un message" gradient cyan-bleu
- Bouton X fermeture : `[&>button]:text-white/70`
- **Composant extrait** : `RescuerProfileDialog` (dans le meme fichier, au-dessus de `EstablishmentRescuers`)

### Disponibilites "Voir plus/moins"
Quand un sauveteur a beaucoup de dates de disponibilite specifiques, seules les 6 premieres sont affichees. Un bouton "Voir X dates de plus" / "Voir moins" permet de toggler l'affichage complet.
- Constante `MAX_VISIBLE_AVAILABILITIES = 6`
- State local `showAllAvailabilities` dans `RescuerProfileDialog`

### Fichiers
| Fichier | Role |
|---------|------|
| `src/pages/EstablishmentRescuers.tsx` | Page Sauveteurs + `RescuerProfileDialog` + filtres |
| `src/utils/swissCantons.ts` | `CANTONS_SUISSES` (26 cantons, value=ID, label=nom) |

---

## JobPostingDialog — Dark theme

### Probleme initial
Le dialog d'annonce avait 3 bugs :
1. **Double bouton X** : un `<DialogClose>` manuel + le X auto de `DialogContent` → deux croix
2. **Style light** sur fond sombre : couleurs par defaut de Shadcn (blanc/noir)
3. **Bouton "Partager" invisible** : `Button variant="outline"` applique `bg-background` (blanc)

### Fix
- Suppression du `<DialogClose>` manuel (le `DialogContent` gere deja le X)
- Restyle complet dark theme : `bg-[#0a1628]`, `border-white/10`, `text-white`
- Badge colore par type de contrat (meme pattern que `JobPostingCard`)
- Prose inversee (`prose-invert`) pour le HTML sanitize
- Bouton X rendu visible : `[&>button]:text-white/70 [&>button]:hover:text-white`
- Bouton "Partager" : remplace `Button variant="outline"` par `<button>` natif avec `bg-white/10 text-white/70`

### Fichier
`src/components/profile/JobPostingDialog.tsx`

---

## Profil etablissement — Completude et notifications

### Checklist de completude
Les items "Site web" et "Reseaux sociaux" ont ete retires de la checklist de completude du profil etablissement. Ces champs restent editables mais ne sont plus requis pour le pourcentage de completude.

**Fichier** : `src/components/profile/EstablishmentProfile.tsx` (array `items` de `ProfileCompletion`)

### Toggles notifications
La page d'edition du profil etablissement inclut une section "Notifications" avec deux toggles Switch :
- **Messages** (`notify_messages`) : notifications pour les nouveaux messages
- **Flux** (`notify_formations`) : notifications pour les nouveaux posts du flux

Ces toggles utilisent le hook `useNotificationPreferences(userId)` avec optimistic updates. Le `userId` est recupere via `supabase.auth.getSession()` a l'interieur du formulaire.

**Fichier** : `src/components/profile/forms/EstablishmentProfileForm.tsx`

---

## Suppression d'annonce — Refresh UI immediat

### Probleme
Quand un etablissement supprimait une annonce depuis l'onglet profil, la liste ne se mettait pas a jour immediatement. Le `AlertDialogAction` de Radix ferme automatiquement le dialog au `onClick`, AVANT que la mutation async ne s'execute.

### Fix
- `e.preventDefault()` sur le `AlertDialogAction` pour empecher la fermeture prematuree
- Le dialog ne se ferme qu'une fois la suppression terminee (`isDeleting` gere le state)
- Ajout de `queryClient.invalidateQueries({ queryKey: ['establishment-stats'] })` dans les 3 mutations (add, update, delete) de `useJobPostings` pour mettre a jour les compteurs en temps reel

### Fichiers
| Fichier | Role |
|---------|------|
| `src/components/profile/EstablishmentJobPostings.tsx` | `e.preventDefault()` sur AlertDialogAction |
| `src/hooks/use-job-postings.ts` | Invalidation `establishment-stats` dans onSuccess |

---

## Flux — Reponses aux commentaires

### Fonctionnement
Les utilisateurs de tous les profils peuvent repondre a un commentaire specifique dans le flux. Le systeme utilise des mentions `@Username` (pas de `parent_id` en BDD, les commentaires restent plats).

### Mecanisme
- Bouton "Repondre" (icone `Reply`) affiche sous chaque commentaire, a cote de la date
- Cliquer "Repondre" pre-remplit l'input avec `@NomUtilisateur ` et focus l'input
- Un indicateur "Reponse a **NomUtilisateur**" s'affiche au-dessus de l'input avec un bouton ✕ pour annuler
- Les mentions `@` dans les commentaires sont affichees en bleu (`text-blue-600 font-medium`)
- L'etat de reponse est efface apres envoi du commentaire

### Implementation technique
- `replyingTo` : state `Record<string, FluxComment | null>` par post
- `commentInputRefs` : `useRef<Record<string, HTMLInputElement | null>>` pour focus programmatique
- `handleReply(postId, comment)` : set le replyingTo + pre-fill input + focus avec setTimeout(50ms)
- `cancelReply(postId)` : clear replyingTo + clear input
- Pas de modification BDD necessaire (mentions textuelles uniquement)

### Commentaires optimistes (pas de flash de page)
L'ajout d'un commentaire utilise une insertion optimiste locale :
1. Un objet `FluxComment` avec `id: optimistic-${Date.now()}` est insere dans le state local immediatement
2. Le vrai `addComment()` est appele en arriere-plan
3. En cas de succes, `fetchComments()` est appele en background pour synchroniser le vrai ID
4. En cas d'echec, le commentaire optimiste est retire du state local

Le nom et l'avatar de l'utilisateur courant sont derives du `ProfileContext` (`rescuerProfile`, `trainerProfile`, `establishmentProfile`).

**Important** : le `addCommentMutation.onSuccess` dans `useFlux.ts` ne contient PAS de toast de succes. Le toast creait un portail DOM hors du flux, causant une perturbation visuelle (meme piege Radix Dialog + Toast documente plus haut). Le commentaire visible dans la liste suffit comme feedback.

### Fichiers
- `src/pages/Flux.tsx` — UI replies, optimistic insertion, @mentions
- `src/hooks/useFlux.ts` — mutation sans toast succes (erreur uniquement)

---

## Page Jobs — Vue complete offre + dark theme

### Probleme
Les sauveteurs ne pouvaient pas lire la description complete d'une offre d'emploi. La description etait tronquee a 3 lignes (`line-clamp-3`) et cliquer directement ouvrait le dialog de candidature sans pouvoir lire l'offre.

### Solution
- Ajout d'un **dialog de detail** (`isDetailDialogOpen`) en dark theme qui affiche l'offre complete
- Les cartes sont maintenant **cliquables** pour ouvrir la vue detail
- Deux boutons par carte : "VOIR L'OFFRE" (detail) + "POSTULER" (candidature directe)
- Depuis la vue detail, bouton "POSTULER A CETTE OFFRE" ouvre le dialog de candidature
- Bouton "Partager cette offre" (native share API) dans la vue detail
- Dialog de candidature egalement restyle en dark theme (`bg-[#0a1628]`, `border-white/10`, `text-white`)
- Upload CV et textarea restyled : borders `white/20`, texte `white`, placeholders `white/40`

### Dark theme applique
- Dialog detail : `bg-[#0a1628] border-white/10 text-white [&>button]:text-white/70`
- Dialog candidature : meme pattern dark
- Upload CV : `border-dashed border-white/20`, etats colores semi-transparents (`green-400/50`, `red-400/50`)
- Bouton annuler : `<button>` natif (evite `bg-background` blanc de Shadcn)

### Fichier
`src/pages/Jobs.tsx`

---

## BottomTabBar — Solution structurelle (DashboardLayout)

### Architecture
Le `DashboardLayout` gere automatiquement le degagement de la BottomTabBar sur mobile via une classe CSS `.dashboard-bottom-safe` definie dans `index.css` :

```css
@media (max-width: 767px) {
  .dashboard-bottom-safe {
    padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px) + 16px);
  }
}
```

- 76px = hauteur BottomTabBar
- `env(safe-area-inset-bottom)` = safe-area de l'appareil (0 a 34px selon le modele)
- 16px = marge de confort
- Total : 92px a 126px selon l'appareil

**Les pages n'ont plus besoin de `pb-XX` pour degager la BottomTabBar** — le layout gere tout. Les pages gardent uniquement `md:pb-6` pour l'espacement desktop si necessaire.

### Regle
- **Nouvelles pages** : ne PAS ajouter de `pb-XX` pour la BottomTabBar. Le `DashboardLayout` le gere automatiquement.
- **Overlays/Sheets** : les overlays (`ProfileForm`, `TrainerProfileForm`, etc.) gardent leurs propres `pb-44 md:pb-24` + `bottom-[100px]` car ils ne sont pas dans le flux normal du layout.

### Fichiers
| Fichier | Role |
|---------|------|
| `src/index.css` | Classe `.dashboard-bottom-safe` avec `calc()` + `env(safe-area-inset-bottom)` |
| `src/layouts/DashboardLayout.tsx` | Applique `.dashboard-bottom-safe md:pb-0 md:pl-64` |

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
| `docs/workflow-guide.md` | Guide workflow BMAD quotidien |
| `docs/archive/development-log.md` | Historique sessions (archive) |
| `docs/archive/README-legacy.md` | Ancien README complet (archive) |
