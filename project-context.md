# Pro-Bain Connect - Contexte Projet

> Ce fichier contient les regles critiques que l'IA DOIT suivre lors de tout developpement.
> Derniere mise a jour : 29 janvier 2026
>
> **Document d'architecture complet:** `_bmad-output/planning-artifacts/architecture.md`

---

## Vue d'Ensemble

**Pro-Bain Connect** est une plateforme de mise en relation dans le domaine de la securite aquatique en Suisse.

Ce repo contient l'**application native** (PWA via Despia pour iOS/Android), deployee sur Vercel.
Un repo separe contient la version web (probain.ch, deployee sur Netlify).

### Types d'Utilisateurs
- **Sauveteurs** (`maitre_nageur`) : Recherche d'emploi, profil, certifications
- **Formateurs** (`formateur`) : Gestion formations, suivi étudiants
- **Établissements** (`etablissement`) : Offres d'emploi, recrutement

---

## 🔒 Règles Critiques (OBLIGATOIRES)

### 1. Structure des Fichiers
```
src/
├── components/          # Composants React
│   ├── ui/              # Shadcn/UI (ne pas modifier sauf demande explicite)
│   ├── auth/            # Authentification
│   ├── formations/      # Formations SSS et formateur
│   ├── mailbox/         # Messagerie
│   ├── navbar/          # Navbars par type utilisateur + Navbar principal
│   ├── navigation/      # BottomTabBar, MobileHeader, Sidebar
│   ├── onboarding/      # Onboarding (steps/ pour chaque etape)
│   ├── profile/         # Composants profil (forms/, cartes, dialogues)
│   ├── shared/          # Composants partages (ErrorBoundary, LoadingScreen, etc.)
│   └── skeletons/       # Composants skeleton pour chargement
├── contexts/            # Contextes React (ProfileContext)
├── hooks/               # Hooks personnalises (use-*.ts)
├── integrations/        # Supabase types et client
├── layouts/             # DashboardLayout
├── lib/                 # queryClient, native.ts, utils
├── pages/               # Pages principales
├── types/               # Types TypeScript
└── utils/               # Utilitaires (constants, lazyRetry, etc.)
supabase/
├── migrations/          # TOUTES les migrations SQL ici
└── functions/           # Edge Functions (delete-user, sss-scraper, etc.)
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

## Documentation

| Fichier | Description |
|---------|-------------|
| `CLAUDE.md` | Instructions AI, hooks, routes, patterns techniques |
| `project-context.md` | Ce fichier (regles de developpement) |
| `docs/data-models.md` | Schema base de donnees Supabase |
| `docs/despia.md` | Framework natif iOS/Android |
| `docs/development-log.md` | Historique sessions, bugs resolus |
| `docs/workflow-guide.md` | Guide workflow BMAD |
| `docs/config/netlify.toml` | Config Netlify (reference web app) |

### Mise a Jour Documentation
Apres chaque fonctionnalite majeure, mettre a jour :
1. Ce fichier si nouvelles regles
2. `CLAUDE.md` si nouveaux patterns ou routes
3. `docs/data-models.md` si nouvelles tables
4. `docs/development-log.md` si session significative

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

### Prochaines Priorites
1. [ ] Activer TypeScript strict + corriger erreurs critiques
2. [ ] Regenerer types Supabase (`supabase gen types typescript`)
3. [ ] Ajouter tests sur auth et hooks critiques
4. [ ] Couverture tests etendue

---

*Pour l'historique detaille des sessions, voir `docs/development-log.md`*
