# Analyse de Structure du Projet Pro-Bain
> Généré le 24 janvier 2026 | Scan Exhaustif

## Vue d'Ensemble

| Métrique | Valeur |
|----------|--------|
| Type de repository | Multi-part (3 applications) |
| Applications | pro-bain-app, admin-dashboard, supabase-mcp-server |
| Pages principales (pro-bain-app) | 13 |
| Composants (pro-bain-app) | 85+ |
| Hooks personnalisés | 15 |
| Pages admin | 10 |

---

## Structure Actuelle des Dossiers

### Racine du Projet
```
dashboard probain/
├── .claude/                    # Config Claude Code (GARDER)
├── .vscode/                    # Config VSCode (GARDER)
├── _bmad/                      # BMAD Method (GARDER - nouvellement installé)
├── _bmad-output/               # Outputs BMAD (GARDER)
├── admin-dashboard/            # Dashboard Admin (ACTIF)
├── docs/                       # Documentation générée (GARDER)
├── pro-bain-app/               # App principale (ACTIF)
├── supabase-mcp-server/        # Serveur MCP (ACTIF - utilitaire)
│
├── DOCUMENTATION.md            # Doc principale (GARDER - À JOUR)
├── SUPABASE_KEY_REGENERATION_GUIDE.md  # Guide sécurité (GARDER)
│
├── analyze-sss-html.ts         # ⚠️ OBSOLÈTE - Script de test
├── database-indexes-migration.sql  # ⚠️ À DÉPLACER vers migrations
├── rls-policies-migration.sql  # ⚠️ À DÉPLACER vers migrations
├── test-dwr-node.js            # ⚠️ OBSOLÈTE - Script de test
├── test-dwr-scraper.ts         # ⚠️ OBSOLÈTE - Script de test
└── nul                         # ⚠️ SUPPRIMER - Fichier vide
```

---

## Fichiers Potentiellement Obsolètes

### À la Racine (À NETTOYER)
| Fichier | Raison | Action Recommandée |
|---------|--------|-------------------|
| `analyze-sss-html.ts` | Script de test/dev ancien | SUPPRIMER |
| `test-dwr-node.js` | Script de test obsolète | SUPPRIMER |
| `test-dwr-scraper.ts` | Script de test obsolète | SUPPRIMER |
| `nul` | Fichier vide (erreur Windows) | SUPPRIMER |
| `database-indexes-migration.sql` | Migration non dans le bon dossier | DÉPLACER → `pro-bain-app/supabase/migrations/` |
| `rls-policies-migration.sql` | Migration non dans le bon dossier | DÉPLACER → `pro-bain-app/supabase/migrations/` |

### Dossiers Dupliqués / Confus
| Dossier | Problème | Action |
|---------|----------|--------|
| `pro-bain-app/migrations/` | Contient 1 fichier, mais migrations principales sont dans `supabase/migrations/` | FUSIONNER ou SUPPRIMER |
| `pro-bain-app/scripts/` | Dossier vide | SUPPRIMER |
| `pro-bain-app/.vite-dev/` | Cache Vite dev | Ignoré par git (OK) |
| `pro-bain-app/.vite/` | Cache Vite | Ignoré par git (OK) |

---

## Structure pro-bain-app (Application Principale)

### Pages (13 actives)
```
src/pages/
├── Auth.tsx                    # Authentification
├── EstablishmentAnnouncements.tsx  # Annonces établissements
├── EstablishmentRescuers.tsx   # Liste sauveteurs (pour établissements)
├── Flux.tsx                    # Fil d'actualités
├── Index.tsx                   # Page d'accueil
├── Jobs.tsx                    # Offres d'emploi
├── Mailbox.tsx                 # Messagerie
├── NotFound.tsx                # 404
├── Offline.tsx                 # Mode hors-ligne
├── Profile.tsx                 # Profil utilisateur
├── ProfileTypeSelection.tsx    # Sélection type de profil
├── Settings.tsx                # Paramètres
└── Training.tsx                # Formations
```

### Composants par Catégorie

#### Auth (2)
- `AuthForm.tsx` - Formulaire connexion/inscription
- `SignupSteps.tsx` - Étapes d'inscription

#### Navbar (3)
- `RescuerNavbar.tsx` - Navbar sauveteur
- `TrainerNavbar.tsx` - Navbar formateur
- `EstablishmentNavbar.tsx` - Navbar établissement

#### Onboarding (4)
- `OnboardingWizard.tsx` - Assistant d'onboarding
- `RescuerOnboarding.tsx` - Onboarding sauveteur
- `TrainerOnboarding.tsx` - Onboarding formateur
- `EstablishmentOnboarding.tsx` - Onboarding établissement

#### Profile (20+)
- Gestion profils, formulaires, dialogues
- Gestion formations, expériences, disponibilités

#### Mailbox (4)
- `RescuerMailbox.tsx`
- `EstablishmentMailbox.tsx`
- `MessageDialog.tsx`
- `MessageCard.tsx`

#### Formations (3)
- `SSSFormationsList.tsx` - Liste formations SSS
- `SSSCalendarEmbed.tsx` - Calendrier SSS intégré
- `TrainerCoursesList.tsx` - Cours du formateur

#### UI (28 composants Shadcn)
- Composants réutilisables (Button, Card, Dialog, etc.)

#### Shared (6)
- `LoadingScreen.tsx`
- `SimpleFileUpload.tsx`
- `ProfileRouter.tsx`
- `NotificationBell.tsx`
- `InstallPWAPrompt.tsx`
- Popups de notifications (3 variants)

### Hooks Personnalisés (15)
```
src/hooks/
├── use-toast.ts                # Notifications toast
├── use-document-upload.ts      # Upload documents
├── use-file-upload.ts          # Upload fichiers
├── use-job-postings.ts         # Offres d'emploi
├── use-availabilities.ts       # Disponibilités
├── use-sss-formations.ts       # Formations SSS
├── use-experiences.ts          # Expériences
├── use-formations.ts           # Formations
├── use-establishment-profile.ts # Profil établissement
├── use-rescuer-notifications.ts # Notifications sauveteur
├── useAppResume.ts             # Reprise app
├── useNotificationPreferences.ts # Préférences notifs
├── useUnreadMessages.ts        # Messages non lus
├── useFluxNotifications.ts     # Notifications flux
└── useFlux.ts                  # Gestion flux
```

### Contextes
```
src/contexts/
├── ProfileContext.tsx          # Contexte profil global
├── hooks/                      # Hooks liés aux contextes
├── types/                      # Types TypeScript
└── utils/                      # Utilitaires
```

---

## Structure admin-dashboard

### Pages (10)
```
src/pages/
├── LoginPage.tsx               # Connexion admin
├── DashboardPage.tsx           # Tableau de bord
├── UsersPage.tsx               # Gestion utilisateurs
├── StatsPage.tsx               # Statistiques
├── LogsPage.tsx                # Logs système
├── AuditPage.tsx               # Audit
├── AdminManagementPage.tsx     # Gestion admins
├── BootstrapAdminPage.tsx      # Premier admin
├── ClaimsPage.tsx              # Réclamations
└── FluxPage.tsx                # Gestion du flux
```

### Structure
```
src/
├── components/
│   ├── Sidebar.tsx             # Sidebar navigation
│   ├── DynamicUserForm.tsx     # Formulaire utilisateur
│   └── ErrorBoundary.tsx       # Gestion erreurs
├── config/                     # Configuration
├── contexts/                   # Contextes React
├── utils/                      # Utilitaires
└── test/                       # Tests
```

---

## Migrations Supabase (14 actives)

```
pro-bain-app/supabase/migrations/
├── 20260120000000_create_notifications_system.sql
├── 20260120000001_create_trainer_courses.sql
├── 20260121000000_fix_course_participants_trigger.sql
├── 20260123000000_create_sss_cache.sql
├── 20260123000001_add_active_field.sql
├── 20260123100000_fix_unicode_escapes.sql
├── 20260124000000_create_user_notification_status.sql
├── 20260125000000_create_account_claim_requests.sql
├── 20260125100000_create_notification_preferences.sql
├── 20260125200000_create_flux_system.sql
├── 20260126000000_add_flux_avatar.sql
├── 20260126100000_add_flux_scheduled.sql
├── 20260126200000_fix_storage_mime_types.sql
└── 20260127000000_add_flux_visibility.sql
```

---

## Recommandations de Nettoyage

### Priorité Haute (Faire maintenant)
1. **Supprimer** les fichiers de test obsolètes à la racine
2. **Déplacer** les migrations SQL orphelines vers `supabase/migrations/`
3. **Supprimer** le fichier `nul` vide
4. **Supprimer** le dossier `scripts/` vide

### Priorité Moyenne (Cette semaine)
1. **Fusionner** `pro-bain-app/migrations/` avec `supabase/migrations/`
2. **Nettoyer** les dossiers de cache `.vite*` si nécessaire
3. **Vérifier** les dossiers `dist/` et les ajouter au `.gitignore`

### Priorité Basse (Plus tard)
1. Réorganiser les composants si nécessaire
2. Consolider la documentation

---

## Prochaines Étapes

1. ✅ Structure analysée
2. ⏳ Générer documentation architecture détaillée
3. ⏳ Créer guide de développement
4. ⏳ Créer index de navigation
