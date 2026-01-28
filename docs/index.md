# Pro-Bain Connect - Index Documentation
> Point d'entrée principal pour la documentation du projet

---

## Aperçu du Projet

| Information | Valeur |
|------------|--------|
| **Nom** | Pro-Bain Connect |
| **Type** | Plateforme de mise en relation aquatique |
| **Architecture** | Multi-part (3 applications) |
| **Stack Principal** | React + TypeScript + Supabase |
| **Dernière analyse** | 27 janvier 2026 |

---

## Applications

### 1. Pro-Bain App (Application Principale)
- **Chemin** : `/pro-bain-app`
- **Type** : Application web React
- **Utilisateurs** : Sauveteurs, Formateurs, Établissements
- **Stack** : React 18, Vite, TypeScript, Shadcn/UI, TailwindCSS, Supabase

### 2. Admin Dashboard
- **Chemin** : `/admin-dashboard`
- **Type** : Interface d'administration
- **Utilisateurs** : Administrateurs
- **Stack** : React 19, Vite, TypeScript, TailwindCSS, Chart.js, Supabase

### 3. Supabase MCP Server
- **Chemin** : `/supabase-mcp-server`
- **Type** : Serveur utilitaire
- **Usage** : Gestion automatique des migrations Supabase
- **Stack** : Node.js, MCP SDK, Supabase

---

## Documentation Générée

### Structure & Architecture
| Document | Description |
|----------|-------------|
| [project-structure-analysis.md](./project-structure-analysis.md) | Analyse complète de la structure, fichiers obsolètes identifiés |
| [data-models.md](./data-models.md) | Schéma de base de données complet avec relations |
| [cleanup-action-plan.md](./cleanup-action-plan.md) | Plan d'action pour nettoyer le projet |
| [workflow-guide.md](./workflow-guide.md) | Guide de workflow quotidien avec BMAD |

### Contexte Projet
| Document | Description |
|----------|-------------|
| [project-context.md](../project-context.md) | Règles critiques que l'IA suit automatiquement |
| [implementation-log.md](../../docs/implementation-log.md) | Journal des implémentations par session |

### Documentation Existante
| Document | Description |
|----------|-------------|
| [DOCUMENTATION.md](../DOCUMENTATION.md) | Documentation principale du projet |
| [pro-bain-app/README.md](../pro-bain-app/README.md) | Guide développeur app principale |
| [admin-dashboard/README.md](../admin-dashboard/README.md) | Guide dashboard admin |
| [SUPABASE_KEY_REGENERATION_GUIDE.md](../SUPABASE_KEY_REGENERATION_GUIDE.md) | Guide sécurité Supabase |

---

## Quick Reference

### Commandes de Développement

```bash
# Pro-Bain App
cd pro-bain-app
npm install
npm run dev          # Démarrer en développement
npm run build        # Build production
npm run test         # Lancer les tests

# Admin Dashboard
cd admin-dashboard
npm install
npm run dev
npm run build
```

### Variables d'Environnement

```env
# pro-bain-app/.env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# admin-dashboard utilise des variables similaires
```

### Structure des Pages (Pro-Bain App)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Index | Page d'accueil |
| `/auth` | Auth | Connexion/Inscription |
| `/onboarding/rescuer` | RescuerOnboardingFlow | Onboarding sauveteurs (6 étapes) |
| `/profile` | Profile | Profil utilisateur |
| `/profile-type-selection` | ProfileTypeSelection | Choix du type |
| `/flux` | Flux | Fil d'actualités |
| `/jobs` | Jobs | Offres d'emploi |
| `/training` | Training | Formations |
| `/mailbox` | Mailbox | Messagerie |
| `/settings` | Settings | Paramètres |

### Composants Onboarding (Nouveau - 27/01/2026)

| Composant | Description |
|-----------|-------------|
| `OnboardingShell` | Layout avec vagues animées et dégradé |
| `OnboardingProgress` | Indicateur de progression (dots animés) |
| `RescuerOnboardingFlow` | Orchestrateur du flow sauveteur (6 étapes) |
| `RescuerWelcome` | Étape 1: Bienvenue |
| `RescuerIdentity` | Étape 2: Prénom/Nom (skippable) |
| `RescuerBirthdate` | Étape 3: Date de naissance (skippable) |
| `RescuerPhoto` | Étape 4: Photo de profil |
| `RescuerLocation` | Étape 5: Canton/Localisation (skippable) |
| `RescuerComplete` | Étape 6: Confirmation |

### Structure des Pages (Admin)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Login | Connexion admin |
| `/dashboard` | Dashboard | Tableau de bord |
| `/users` | Users | Gestion utilisateurs |
| `/stats` | Stats | Statistiques |
| `/logs` | Logs | Logs système |
| `/audit` | Audit | Audit des actions |
| `/claims` | Claims | Réclamations |
| `/flux` | Flux | Gestion du flux |

---

## Types d'Utilisateurs

### Sauveteurs (Maîtres-nageurs)
- Recherche d'emploi
- Gestion du profil et certifications
- Disponibilités
- Réception de messages

### Formateurs
- Gestion des formations/cours
- Suivi des étudiants
- Communication bidirectionnelle

### Établissements
- Publication d'offres d'emploi
- Recherche de personnel
- Communication avec candidats

---

## Prochaines Étapes Recommandées

1. **Nettoyer** - Suivre le [Plan de Nettoyage](./cleanup-action-plan.md)
2. **Documenter** - Compléter la documentation si nécessaire
3. **Tester** - Vérifier que tout fonctionne après nettoyage
4. **Committer** - Sauvegarder les changements sur Git

---

## Aide

- **BMAD Method** : `/bmad:bmm:agents:analyst` pour l'analyse
- **Développement** : Consulter les README dans chaque application
- **Base de données** : Voir [data-models.md](./data-models.md)
