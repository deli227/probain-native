# Pro-Bain Connect - Contexte Projet

> Ce fichier contient les règles critiques que l'IA DOIT suivre lors de tout développement.
> Dernière mise à jour : 27 janvier 2026
>
> **Document d'architecture complet:** `_bmad-output/planning-artifacts/architecture.md`

---

## 📋 Vue d'Ensemble

**Pro-Bain Connect** est une plateforme de mise en relation dans le domaine de la sécurité aquatique en Suisse.

### Applications
| App | Chemin | Description |
|-----|--------|-------------|
| **pro-bain-app** | `/pro-bain-app` | Application principale (React 18) |
| **admin-dashboard** | `/admin-dashboard` | Interface admin (React 19) |
| **supabase-mcp-server** | `/supabase-mcp-server` | Serveur MCP migrations |

### Types d'Utilisateurs
- **Sauveteurs** (`maitre_nageur`) : Recherche d'emploi, profil, certifications
- **Formateurs** (`formateur`) : Gestion formations, suivi étudiants
- **Établissements** (`etablissement`) : Offres d'emploi, recrutement

---

## 🔒 Règles Critiques (OBLIGATOIRES)

### 1. Structure des Fichiers
```
pro-bain-app/
├── src/
│   ├── components/     # Composants React
│   │   ├── ui/         # Shadcn/UI (ne pas modifier sauf demande explicite)
│   │   ├── profile/    # Composants profil
│   │   ├── navbar/     # Navbars par type utilisateur
│   │   ├── onboarding/ # Onboarding (voir structure ci-dessous)
│   │   └── ...
│   ├── hooks/          # Hooks personnalisés (use-*.ts)
│   ├── pages/          # Pages principales
│   ├── contexts/       # Contextes React
│   └── integrations/   # Supabase types et client
└── supabase/
    ├── migrations/     # TOUTES les migrations SQL ici
    └── functions/      # Edge Functions (delete-user, etc.)

# Onboarding Structure (Ajouté 27/01/2026)
src/components/onboarding/
├── OnboardingShell.tsx          # Layout avec animations vagues
├── OnboardingProgress.tsx       # Indicateur progression (dots)
├── RescuerOnboardingFlow.tsx    # Orchestrateur sauveteur (6 étapes)
└── steps/
    ├── RescuerWelcome.tsx       # Bienvenue
    ├── RescuerIdentity.tsx      # Prénom/Nom (skippable)
    ├── RescuerBirthdate.tsx     # Date naissance (skippable)
    ├── RescuerPhoto.tsx         # Photo profil
    ├── RescuerLocation.tsx      # Canton (skippable)
    └── RescuerComplete.tsx      # Confirmation
```

### 2. Conventions de Code

#### Nommage
- **Composants** : PascalCase (`ProfileForm.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useFormations.ts`)
- **Pages** : PascalCase (`Profile.tsx`)
- **Types** : PascalCase avec suffixe descriptif (`FluxPost`, `JobPosting`)

#### Patterns OBLIGATOIRES

**Data Fetching (TanStack Query):**
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

**Error Handling:**
```typescript
try {
  const { data, error } = await supabase.from('table').select()
  if (error) throw error
  return data
} catch (error) {
  toast({ title: "Erreur", description: error.message, variant: "destructive" })
}
```

**State Management:**
| Type | Solution |
|------|----------|
| Server state | TanStack Query |
| Form state | React Hook Form + Zod |
| UI state local | `useState` |
| Global state | React Context (`ProfileContext`, `AuthContext`) |

#### Règles Agents IA

**DOIVENT:**
- Utiliser les hooks existants avant d'en créer de nouveaux
- Suivre les conventions de nommage ci-dessus
- Typer en TypeScript strict (pas de `any`)
- Utiliser les composants Shadcn/UI existants
- Valider avec Zod pour les formulaires

**NE DOIVENT JAMAIS:**
- Modifier les composants dans `components/ui/`
- Créer de nouveaux patterns de state management
- Bypasser RLS avec des requêtes directes
- Laisser des `console.log` en production
- Utiliser `any` ou `@ts-ignore`

#### Anti-Patterns à Éviter

| ❌ Éviter | ✅ Utiliser |
|-----------|-------------|
| `any` type | Types explicites ou générés |
| `console.log` en prod | Toast ou logger centralisé |
| Fetch direct | TanStack Query |
| Props drilling | Context ou composition |
| Inline styles | TailwindCSS classes |

### 3. Base de Données

#### Tables Principales
- `profiles` → Table centrale utilisateurs
- `rescuer_profiles`, `trainer_profiles`, `establishment_profiles` → Extensions profil
- `job_postings` → Offres d'emploi
- `formations` → Formations des sauveteurs
- `trainer_courses` → Cours des formateurs
- `internal_messages` → Messagerie
- `notifications` → Notifications
- `flux_posts` → Posts du fil d'actualités

#### Règles SQL
- **Migrations** : Toujours dans `supabase/migrations/` avec format `YYYYMMDDHHMMSS_description.sql`
- **RLS** : Toujours activer Row Level Security sur les nouvelles tables
- **Relations** : Utiliser des foreign keys vers `profiles.id`

### 4. Sécurité

- Ne JAMAIS exposer les clés Supabase dans le code client
- Toujours valider les données côté serveur (RLS)
- Utiliser `supabase.auth.getUser()` pour vérifier l'authentification

---

## 📝 Après Chaque Développement

### Checklist Post-Développement
- [ ] Code testé localement
- [ ] Types TypeScript corrects (pas de `any`)
- [ ] Pas de console.log en production
- [ ] Documentation mise à jour si nécessaire
- [ ] Commit avec message descriptif

### Format de Commit
```
<type>: <description courte>

<détails si nécessaire>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Types : `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

---

## 🔄 Workflows Recommandés

### Pour une Nouvelle Fonctionnalité
1. `/bmad:bmm:workflows:quick-spec` → Spécifier la fonctionnalité
2. Développer selon la spec
3. `/bmad:bmm:workflows:code-review` → Review adversariale

### Pour un Bug Fix
1. Identifier le problème
2. Corriger
3. Tester
4. Commit avec `fix: description`

### Pour une Refactorisation
1. `/bmad:bmm:workflows:quick-spec` → Documenter l'approche
2. Refactoriser par petits commits
3. Tester après chaque étape

---

## 📚 Documentation

### Fichiers de Documentation
| Fichier | Description |
|---------|-------------|
| `DOCUMENTATION.md` | Doc principale du projet |
| `docs/index.md` | Index de la documentation générée |
| `docs/data-models.md` | Schéma base de données |
| `docs/project-structure-analysis.md` | Analyse structure |
| `project-context.md` | Ce fichier (règles IA) |

### Mise à Jour Documentation
Après chaque fonctionnalité majeure, mettre à jour :
1. Ce fichier si nouvelles règles
2. `DOCUMENTATION.md` si architecture change
3. `docs/data-models.md` si nouvelles tables

---

## 🚀 État Actuel du Projet

### Fonctionnalités Actives
- ✅ Authentification (Supabase Auth)
- ✅ 3 types de profils (sauveteur, formateur, établissement)
- ✅ Messagerie interne
- ✅ Offres d'emploi
- ✅ Formations et certifications
- ✅ Fil d'actualités (Flux) avec visibilité ciblée
- ✅ Notifications
- ✅ Dashboard Admin

### Phase 2 - Stabilisation (Priorités)
1. [ ] Activer TypeScript strict + corriger erreurs critiques
2. [ ] Ajouter ErrorBoundary global + hook useErrorHandler
3. [ ] Régénérer types Supabase (`supabase gen types typescript`)
4. [ ] Ajouter tests sur auth et hooks critiques
5. [ ] Audit et fix des bugs existants

### Phase 3+ (Future)
- [ ] Package monorepo pour types partagés (`@probain/types`)
- [ ] Alignement versions React/TailwindCSS entre apps
- [ ] Couverture tests étendue (80%+)

---

## 📅 Historique des Changements

| Date | Changement |
|------|------------|
| 2026-01-24 | Création du fichier, nettoyage projet, documentation générée |
| 2026-01-24 | Ajout visibilité flux, upload CV, coins arrondis UI |
| 2026-01-25 | PRD complété (52 FRs, 24 NFRs) |
| 2026-01-25 | Architecture complète - Phase 2 Stabilisation définie |
| 2026-01-27 | **Onboarding Sauveteur "Wahoo"** - 6 étapes avec animations vagues |
| 2026-01-27 | **Migration handle_new_user** - Trigger création profil automatique |
| 2026-01-27 | **Edge Function delete-user** - Suppression propre auth.users |
| 2026-01-27 | **Fix 406 error** - select('*') dans useProfileState |
| 2026-01-27 | **Skip onboarding** - Tous les champs skippables, null au lieu de "" |
