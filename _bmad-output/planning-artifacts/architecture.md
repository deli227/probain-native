---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
status: 'complete'
completedAt: '2026-01-25'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - 'pro-bain-app/project-context.md'
  - 'docs/index.md'
  - 'docs/tech-stack.md'
  - 'docs/api-layer.md'
  - 'docs/ui-components.md'
  - 'pro-bain-app/docs/data-models.md'
workflowType: 'architecture'
project_name: 'dashboard probain'
user_name: 'Deli'
date: '2026-01-25'
---

# Architecture Decision Document

_Ce document se construit de manière collaborative à travers une découverte étape par étape. Les sections sont ajoutées au fur et à mesure que nous travaillons ensemble sur chaque décision architecturale._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
52 FRs organisées en 10 domaines fonctionnels couvrant: authentification multi-profils, gestion de profils spécialisés (sauveteurs, formateurs, établissements), marketplace emploi, formations, messagerie interne, flux d'actualités ciblé, et administration complète.

**Non-Functional Requirements:**
24 NFRs axées sur: performance (< 2s), fiabilité (zéro bug critique), sécurité (RLS), scalabilité (1000+ users), et qualité code (TypeScript strict).

**Scale & Complexity:**
- Primary domain: Full-stack Web Application
- Complexity level: Medium
- Estimated architectural components: ~15 modules principaux
- Applications: 2 frontends + 1 backend Supabase

### Technical Constraints & Dependencies

1. **Stack existant:** React + Vite + Supabase (non négociable)
2. **Versions divergentes:** React 18/19, TailwindCSS 3/4 entre apps
3. **Backend unique:** Supabase Cloud partagé
4. **Phase projet:** Stabilisation - focus qualité, pas nouvelles features

### Cross-Cutting Concerns Identified

- Authentification et autorisation (Supabase Auth + RLS)
- Gestion d'erreurs centralisée
- Types TypeScript partagés
- Real-time subscriptions (messages, notifications)
- File storage et CDN (documents, avatars)
- Performance monitoring

---

## Starter Template Evaluation

### Primary Technology Domain

Full-stack Web Application - Projet **brownfield** avec stack existant.

### Existing Architecture (No Starter Required)

Ce projet dispose déjà d'une architecture établie:

**Pro-Bain App:**
- React 18.3 + TypeScript 5.5
- Vite 5.4 avec SWC
- Shadcn/UI (Radix primitives)
- TailwindCSS 3.4
- TanStack Query 5.56
- React Router DOM 6.26
- React Hook Form + Zod

**Admin Dashboard:**
- React 19.2 + TypeScript 5.9
- Vite 7.2
- TailwindCSS 4.1
- Chart.js 4.5
- React Router DOM 7.12

**Backend partagé:**
- Supabase Cloud (PostgreSQL, Auth, Storage, Real-time)

### Architectural Decisions Already Made

**Language & Runtime:**
TypeScript strict mode avec path aliases (`@/*`)

**Styling Solution:**
TailwindCSS utility-first + Shadcn/UI components

**Build Tooling:**
Vite avec optimisation bundle (vendor chunks, lazy loading)

**Testing Framework:**
Vitest + Testing Library (configuration existante)

**Code Organization:**
Structure par domaine: components, hooks, pages, contexts, integrations

**Development Experience:**
ESLint, Husky, lint-staged (pro-bain-app uniquement)

### Recommendations for Phase 2 (Stabilization)

1. Aligner les versions React entre apps (19 recommandé)
2. Créer un package types partagé (`@probain/types`)
3. Ajouter Husky/lint-staged à admin-dashboard
4. Configurer path aliases dans admin-dashboard

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Phase 2 - Stabilization):**
- Gestion des erreurs hybride
- TypeScript strict progressif
- Tests sur fonctionnalités critiques
- Types générés depuis Supabase

**Deferred Decisions (Phase 3+):**
- Alignement versions React/TailwindCSS entre apps
- Package monorepo pour types partagés
- Couverture tests complète (80%+)

### Error Handling Strategy

**Decision:** Approche hybride (ErrorBoundary + gestion locale)

**Implementation:**
- `ErrorBoundary` global au niveau App pour capturer les crashs React
- Hook `useErrorHandler` pour logging centralisé vers Supabase
- Gestion locale avec `toast` pour feedback utilisateur immédiat
- Toutes les erreurs loguées pour monitoring

**Rationale:** Évite les crashs complets tout en donnant du feedback utilisateur approprié.

### TypeScript Strictness

**Decision:** Activation progressive du mode strict

**Implementation:**
- Activer `strict: true` dans `tsconfig.json`
- Corriger les erreurs fichier par fichier (priorité: hooks, puis pages, puis components)
- Utiliser `// @ts-expect-error` temporairement si nécessaire avec TODO
- Objectif: 0 erreurs TypeScript, 0 type `any`

**Rationale:** Évite de tout casser d'un coup, permet une transition contrôlée.

### Testing Strategy

**Decision:** Tests sur fonctionnalités critiques uniquement (Phase 2)

**Priorités de test:**
1. Authentification (login, logout, session)
2. Opérations de données sensibles (profils, messages)
3. Hooks critiques (useFlux, useJobPostings, useFormations)
4. Formulaires avec validation (React Hook Form + Zod)

**Framework:** Vitest + Testing Library (déjà configuré)

**Rationale:** Focus sur ce qui peut vraiment casser, pas sur la couverture à 100%.

### Version Alignment Strategy

**Decision:** Garder les versions séparées entre apps

**Pro-Bain App:** React 18, TailwindCSS 3, React Router 6
**Admin Dashboard:** React 19, TailwindCSS 4, React Router 7

**Rationale:** Upgrader comporte des risques (surtout TW3→4 avec Shadcn/UI). Phase 2 = stabilité, pas expérimentation.

### Shared Types Strategy

**Decision:** Types générés depuis Supabase

**Implementation:**
- Utiliser `supabase gen types typescript` pour générer les types DB
- Fichier `src/integrations/supabase/types.ts` auto-généré
- Types métier additionnels dans `src/types/` par domaine

**Rationale:** Types toujours synchronisés avec le schéma DB, moins de bugs de typage.

### Decision Impact Analysis

**Implementation Sequence:**
1. Activer TypeScript strict + corriger erreurs critiques
2. Ajouter ErrorBoundary global + hook useErrorHandler
3. Régénérer types Supabase
4. Ajouter tests sur auth et hooks critiques
5. Audit et fix des bugs existants

**Cross-Component Dependencies:**
- TypeScript strict → révèle les bugs de typage partout
- ErrorBoundary → nécessite standardisation des erreurs dans les hooks
- Types Supabase → affecte tous les composants qui utilisent les données

---

## Implementation Patterns & Consistency Rules

### Naming Conventions

**Database (Supabase):**
- Tables: `snake_case` pluriel → `job_postings`, `trainer_courses`, `flux_posts`
- Colonnes: `snake_case` → `user_id`, `created_at`, `is_published`
- Foreign keys: `{table}_id` → `establishment_id`, `trainer_id`

**Code React:**
- Composants: `PascalCase.tsx` → `ProfileForm.tsx`, `JobPostingCard.tsx`
- Hooks: `use-*.ts` ou `use*.ts` → `use-formations.ts`, `useFlux.ts`
- Pages: `PascalCase.tsx` → `Profile.tsx`, `Flux.tsx`, `Jobs.tsx`
- Types/Interfaces: `PascalCase` → `FluxPost`, `JobPosting`, `RescuerProfile`
- Constantes: `SCREAMING_SNAKE_CASE` → `ACCEPTED_IMAGE_TYPES`

### File Structure Patterns

**Pro-Bain App:**
```
src/
├── components/
│   ├── ui/              # Shadcn/UI (NE PAS MODIFIER)
│   ├── profile/         # Composants profil
│   ├── navbar/          # Navigation par type
│   ├── mailbox/         # Messagerie
│   ├── formations/      # Formations
│   ├── auth/            # Authentification
│   ├── onboarding/      # Onboarding (structure détaillée ci-dessous)
│   └── shared/          # Partagés
├── hooks/               # use-*.ts
├── pages/               # Pages principales
├── contexts/            # React contexts
├── integrations/        # Supabase client + types
└── lib/                 # Utilitaires

# Structure Onboarding Détaillée (Mis à jour 26/01/2026)
src/components/onboarding/
├── OnboardingShell.tsx          # Layout avec animations vagues CSS (variants: rescuer, trainer, establishment)
├── OnboardingProgress.tsx       # Indicateur progression (dots animés)
├── OnboardingWizard.tsx         # Dispatcher + Legacy wizard (établissements uniquement)
├── RescuerOnboardingFlow.tsx    # Orchestrateur sauveteur (6 étapes)
├── TrainerOnboardingFlow.tsx    # Orchestrateur formateur (6 étapes) - NOUVEAU 26/01/2026
└── steps/
    # Steps Sauveteur
    ├── RescuerWelcome.tsx       # Étape 1: Bienvenue
    ├── RescuerIdentity.tsx      # Étape 2: Prénom/Nom (skippable)
    ├── RescuerBirthdate.tsx     # Étape 3: Date naissance (skippable)
    ├── RescuerPhoto.tsx         # Étape 4: Photo profil (upload Supabase)
    ├── RescuerLocation.tsx      # Étape 5: Canton/Ville (skippable)
    ├── RescuerComplete.tsx      # Étape 6: Confirmation finale
    # Steps Formateur - NOUVEAU 26/01/2026
    ├── TrainerWelcome.tsx       # Étape 1: Bienvenue organisation
    ├── TrainerOrganization.tsx  # Étape 2: Nom organisme (OBLIGATOIRE)
    ├── TrainerLogo.tsx          # Étape 3: Upload logo (optionnel)
    ├── TrainerDescription.tsx   # Étape 4: Description (skippable)
    ├── TrainerLocation.tsx      # Étape 5: Adresse complète (skippable)
    └── TrainerComplete.tsx      # Étape 6: Félicitations + redirect
```

**Supabase Edge Functions (Ajouté 27/01/2026):**
```
supabase/functions/
└── delete-user/
    └── index.ts                 # Suppression propre auth.users + profiles
```

### Data Fetching Patterns

**Pattern obligatoire:** TanStack Query

```typescript
// Lecture
const { data, isLoading, error } = useQuery({
  queryKey: ['entity', id],
  queryFn: () => supabase.from('table').select()
})

// Mutation
const mutation = useMutation({
  mutationFn: async (data) => { ... },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entity'] })
})
```

### Error Handling Patterns

**Pattern obligatoire:**
```typescript
try {
  const { data, error } = await supabase.from('table').select()
  if (error) throw error
  return data
} catch (error) {
  toast({ title: "Erreur", description: error.message, variant: "destructive" })
  // Log pour monitoring (à implémenter)
}
```

### State Management Patterns

| Type | Solution |
|------|----------|
| Server state | TanStack Query |
| Form state | React Hook Form |
| UI state local | `useState` |
| Global state | React Context (`ProfileContext`, `AuthContext`) |

### Enforcement Guidelines

**Agents IA DOIVENT:**
- Utiliser les hooks existants avant d'en créer de nouveaux
- Suivre les conventions de nommage ci-dessus
- Typer en TypeScript strict (pas de `any`)
- Utiliser les composants Shadcn/UI existants
- Valider avec Zod pour les formulaires

**Agents IA NE DOIVENT JAMAIS:**
- Modifier les composants dans `components/ui/`
- Créer de nouveaux patterns de state management
- Bypasser RLS avec des requêtes directes
- Laisser des `console.log` en production
- Utiliser `any` ou `@ts-ignore`

### Anti-Patterns à Éviter

❌ `any` type → ✅ Types explicites ou générés
❌ `console.log` en prod → ✅ Logger centralisé
❌ Fetch direct → ✅ TanStack Query
❌ Props drilling → ✅ Context ou composition
❌ Inline styles → ✅ TailwindCSS classes

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
dashboard-probain/
├── pro-bain-app/                    # Application principale utilisateurs
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  # Shadcn/UI (NE PAS MODIFIER)
│   │   │   ├── profile/             # Profils utilisateurs
│   │   │   ├── navbar/              # Navigation par type utilisateur
│   │   │   ├── mailbox/             # Messagerie interne
│   │   │   ├── formations/          # Formations
│   │   │   ├── auth/                # Authentification
│   │   │   ├── onboarding/          # Onboarding utilisateurs
│   │   │   └── shared/              # Composants partagés
│   │   ├── hooks/                   # Hooks custom (use-*.ts)
│   │   ├── pages/                   # Pages principales
│   │   ├── contexts/                # React contexts
│   │   ├── integrations/            # Supabase client + types
│   │   ├── lib/                     # Utilitaires
│   │   └── types/                   # Types métier additionnels
│   ├── public/                      # Assets statiques
│   └── docs/                        # Documentation technique
│
├── admin-dashboard/                 # Dashboard administrateur
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  # Composants UI admin
│   │   │   ├── dashboard/           # Widgets dashboard
│   │   │   └── layouts/             # Layouts partagés
│   │   ├── pages/                   # Pages admin
│   │   ├── lib/                     # Utilitaires
│   │   └── hooks/                   # Hooks admin
│   └── public/
│
├── docs/                            # Documentation partagée
│   ├── index.md                     # Index documentation
│   ├── tech-stack.md                # Stack technique
│   ├── api-layer.md                 # Documentation API/hooks
│   └── ui-components.md             # Composants UI
│
└── _bmad-output/                    # Artefacts de planification
    └── planning-artifacts/
        ├── prd.md                   # Product Requirements
        └── architecture.md          # Ce document
```

### Architectural Boundaries

**API Boundaries (Supabase):**
- Toutes les requêtes passent par le client Supabase (`src/integrations/supabase/`)
- RLS (Row Level Security) appliqué sur toutes les tables
- Storage via Supabase Storage (bucket `documents`)
- Auth via Supabase Auth avec profils multi-types

**Component Boundaries:**
- `components/ui/` → Primitives Shadcn/UI (READ-ONLY)
- `components/{domain}/` → Composants métier par domaine
- `components/shared/` → Composants réutilisables cross-domain

**Data Boundaries:**
- Server state → TanStack Query uniquement
- Form state → React Hook Form + Zod
- UI state → useState local
- Global state → React Context (Auth, Profile)

### Requirements to Structure Mapping

| Domaine Fonctionnel | Fichiers Principaux |
|---------------------|---------------------|
| Authentification (FR-AUTH) | `pages/Auth.tsx`, `hooks/use-auth.ts`, `contexts/AuthContext.tsx` |
| Profils (FR-PROF) | `pages/Profile.tsx`, `components/profile/`, `hooks/use-profile-data.ts` |
| Marketplace Emploi (FR-MARK) | `pages/Jobs.tsx`, `hooks/use-job-postings.ts`, `components/jobs/` |
| Formations (FR-FORM) | `pages/Formations.tsx`, `hooks/use-formations.ts`, `components/formations/` |
| Messagerie (FR-MSG) | `pages/Mailbox.tsx`, `hooks/use-mailbox.ts`, `components/mailbox/` |
| Flux Actualités (FR-FLUX) | `pages/Flux.tsx`, `hooks/useFlux.ts`, `components/flux/` |
| Administration (FR-ADMIN) | `admin-dashboard/src/pages/`, `admin-dashboard/src/components/` |

### Cross-Cutting Concerns Mapping

| Concern | Location |
|---------|----------|
| Error Handling | `components/shared/ErrorBoundary.tsx` (à créer), toast via Shadcn |
| Auth State | `contexts/AuthContext.tsx` |
| Profile State | `contexts/ProfileContext.tsx` |
| Types Supabase | `integrations/supabase/types.ts` (généré) |
| Real-time | Subscriptions dans hooks spécifiques |
| Storage | Supabase Storage via hooks dédiés |

### Integration Points

**Frontend ↔ Backend:**
- Client Supabase unique par app (`src/integrations/supabase/client.ts`)
- Types générés automatiquement depuis le schéma DB

**Pro-Bain App ↔ Admin Dashboard:**
- Base de données Supabase partagée
- Pas de communication directe entre les deux frontends
- Types DB identiques (générés depuis même schéma)

**External Services:**
- Supabase Auth (authentication)
- Supabase Storage (fichiers/images)
- Supabase Realtime (messages, notifications)

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Stack React + Supabase + TailwindCSS + TanStack Query parfaitement cohérente
- TypeScript strict compatible avec types générés Supabase
- Shadcn/UI compatible avec TailwindCSS 3.4 (pro-bain-app)
- Décision de garder versions séparées entre apps évite les conflits

**Pattern Consistency:**
- Conventions de nommage alignées (snake_case DB, PascalCase composants)
- Patterns TanStack Query cohérents avec gestion d'erreurs hybride
- Structure par domaine supporte le mapping FR→fichiers

**Structure Alignment:**
- Project structure supports tous les patterns définis
- Boundaries clairement établies (UI read-only, domain components, shared)
- Integration points bien définis (Supabase client unique par app)

### Requirements Coverage Validation ✅

**Functional Requirements Coverage (52 FRs):**
- FR-AUTH → Auth hooks + Supabase Auth + RLS ✅
- FR-PROF → Profile components + hooks dédiés ✅
- FR-MARK → Jobs pages + use-job-postings hook ✅
- FR-MSG → Mailbox + real-time subscriptions ✅
- FR-FORM → Formations hooks + components ✅
- FR-FLUX → Flux page + useFlux hook ✅
- FR-ADMIN → admin-dashboard complet ✅

**Non-Functional Requirements Coverage (24 NFRs):**
- Performance (<2s) → TanStack Query caching + lazy loading ✅
- Sécurité → RLS sur toutes les tables ✅
- TypeScript strict → décision progressive adoptée ✅
- Scalabilité (1000+ users) → Supabase Cloud + optimisations ✅

### Implementation Readiness Validation ✅

**Decision Completeness:**
- Toutes les décisions critiques documentées avec versions
- Patterns d'implémentation complets avec exemples de code
- Règles de consistance claires et applicables

**Structure Completeness:**
- Structure projet complète et spécifique
- Tous les fichiers et répertoires définis
- Points d'intégration clairement spécifiés

**Pattern Completeness:**
- Tous les points de conflit potentiels adressés
- Conventions de nommage complètes
- Patterns de communication spécifiés
- Anti-patterns explicitement documentés

### Gap Analysis Results

**Critical Gaps:** Aucun

**Important Gaps (Phase 3+):**
- ErrorBoundary global à créer (`components/shared/ErrorBoundary.tsx`)
- Hook `useErrorHandler` à créer pour logging centralisé
- Couverture tests à étendre après stabilisation Phase 2

**Nice-to-Have (Future):**
- Package monorepo pour types partagés (`@probain/types`)
- Alignement versions React/TailwindCSS entre apps

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium, ~15 modules)
- [x] Technical constraints identified (stack existant, versions divergentes)
- [x] Cross-cutting concerns mapped (auth, errors, types, real-time)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined (TanStack Query + Supabase)
- [x] Performance considerations addressed (caching, lazy loading)

**✅ Implementation Patterns**
- [x] Naming conventions established (DB, API, Code)
- [x] Structure patterns defined (domain-based)
- [x] Communication patterns specified (Query/Mutation)
- [x] Process patterns documented (error handling, state)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
- Architecture brownfield bien documentée avec stack mature
- Patterns clairs et exemples de code concrets
- Règles explicites pour agents IA (MUST/MUST NOT)
- Mapping direct FR→fichiers pour traçabilité

**Areas for Future Enhancement:**
- Monitoring et logging centralisé (Phase 3)
- Package types partagé entre apps (Phase 3)
- Couverture tests étendue (après stabilisation)

### Implementation Handoff

**AI Agent Guidelines:**
- Suivre toutes les décisions architecturales exactement comme documentées
- Utiliser les patterns d'implémentation de manière consistante
- Respecter la structure projet et les boundaries
- Référencer ce document pour toutes questions architecturales
- Ne JAMAIS modifier `components/ui/`

**Phase 2 Implementation Priority:**
1. Activer TypeScript strict + corriger erreurs critiques
2. Ajouter ErrorBoundary global + hook useErrorHandler
3. Régénérer types Supabase
4. Ajouter tests sur auth et hooks critiques
5. Audit et fix des bugs existants

---

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-25
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**📋 Complete Architecture Document**
- Toutes les décisions architecturales documentées avec versions spécifiques
- Patterns d'implémentation assurant la consistance des agents IA
- Structure projet complète avec tous les fichiers et répertoires
- Mapping requirements → architecture
- Validation confirmant cohérence et complétude

**🏗️ Implementation Ready Foundation**
- 6 décisions architecturales majeures
- 5 catégories de patterns d'implémentation
- 15+ modules architecturaux spécifiés
- 52 FRs + 24 NFRs entièrement supportés

**📚 AI Agent Implementation Guide**
- Stack technique avec versions vérifiées
- Règles de consistance prévenant les conflits
- Structure projet avec boundaries claires
- Patterns d'intégration et standards de communication

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] Toutes les décisions fonctionnent ensemble sans conflits
- [x] Choix technologiques compatibles
- [x] Patterns supportent les décisions architecturales
- [x] Structure alignée avec tous les choix

**✅ Requirements Coverage**
- [x] Tous les FRs supportés architecturalement
- [x] Tous les NFRs adressés
- [x] Cross-cutting concerns gérés
- [x] Points d'intégration définis

**✅ Implementation Readiness**
- [x] Décisions spécifiques et actionnables
- [x] Patterns préviennent les conflits entre agents
- [x] Structure complète et non-ambiguë
- [x] Exemples fournis pour clarté

---

**Architecture Status:** ✅ READY FOR IMPLEMENTATION

**Next Phase:** Commencer l'implémentation Phase 2 (Stabilisation) en suivant les décisions et patterns documentés.

**Document Maintenance:** Mettre à jour cette architecture lors de décisions techniques majeures pendant l'implémentation.

