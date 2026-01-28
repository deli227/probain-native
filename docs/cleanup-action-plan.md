# Plan d'Action de Nettoyage Pro-Bain
> Actions concrètes pour restructurer le projet

---

## Phase 1 : Nettoyage Immédiat (5 min)

### Fichiers à SUPPRIMER à la racine

```bash
# Commandes à exécuter depuis la racine du projet

# 1. Supprimer les fichiers de test obsolètes
rm "analyze-sss-html.ts"
rm "test-dwr-node.js"
rm "test-dwr-scraper.ts"

# 2. Supprimer le fichier vide
rm "nul"

# 3. Supprimer le dossier scripts vide
rmdir "pro-bain-app/scripts"
```

### Fichiers à DÉPLACER

```bash
# Déplacer les migrations orphelines vers le bon dossier
mv "database-indexes-migration.sql" "pro-bain-app/supabase/migrations/20260101000000_database_indexes.sql"
mv "rls-policies-migration.sql" "pro-bain-app/supabase/migrations/20260101000001_rls_policies.sql"
```

---

## Phase 2 : Réorganisation des Dossiers (10 min)

### Structure Recommandée

```
dashboard probain/
│
├── docs/                       # Documentation centralisée (NOUVELLE)
│   ├── index.md               # Index principal
│   ├── architecture.md        # Architecture technique
│   ├── data-models.md         # Modèles de données
│   ├── project-structure-analysis.md
│   └── cleanup-action-plan.md # Ce fichier
│
├── pro-bain-app/              # Application principale
│   ├── src/
│   ├── supabase/
│   │   └── migrations/        # TOUTES les migrations ici
│   └── README.md              # Doc spécifique app
│
├── admin-dashboard/           # Dashboard admin
│   ├── src/
│   └── README.md
│
├── supabase-mcp-server/       # Serveur MCP
│   └── index.js
│
├── _bmad/                     # BMAD Method (ne pas toucher)
├── _bmad-output/              # Outputs BMAD
│
├── DOCUMENTATION.md           # Doc principale (GARDER)
└── SUPABASE_KEY_REGENERATION_GUIDE.md  # Guide sécurité
```

### Migration à faire dans pro-bain-app

```bash
# Fusionner le dossier migrations/ avec supabase/migrations/
cd pro-bain-app

# Vérifier le contenu
cat migrations/01_update_profile_type_trigger.sql

# Si pertinent, déplacer vers supabase/migrations/
mv migrations/01_update_profile_type_trigger.sql supabase/migrations/20250101000000_update_profile_type_trigger.sql

# Supprimer le dossier migrations/ vide
rmdir migrations
```

---

## Phase 3 : Nettoyage Documentation (15 min)

### Documents à CONSERVER

| Document | Emplacement | Raison |
|----------|-------------|--------|
| DOCUMENTATION.md | Racine | Doc principale à jour |
| SUPABASE_KEY_REGENERATION_GUIDE.md | Racine | Guide sécurité important |
| pro-bain-app/README.md | Dans l'app | Doc développeur |
| admin-dashboard/README.md | Dans l'app | Doc admin |

### Documents à VÉRIFIER et potentiellement SUPPRIMER

Cherchez dans le projet des fichiers qui pourraient être obsolètes :

```bash
# Lister tous les .md hors node_modules
find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/_bmad/*"
```

---

## Phase 4 : Gitignore (5 min)

### Vérifier que .gitignore contient

```gitignore
# Dependencies
node_modules/
.npm

# Build outputs
dist/
build/

# Vite cache
.vite/
.vite-dev/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test
coverage/

# Supabase
.supabase/
```

---

## Phase 5 : Commits Git

Après le nettoyage, faire des commits clairs :

```bash
# Commit 1 : Suppression fichiers obsolètes
git add -A
git commit -m "Nettoyage: suppression fichiers de test obsolètes"

# Commit 2 : Réorganisation migrations
git add -A
git commit -m "Réorg: centralisation des migrations dans supabase/"

# Commit 3 : Documentation
git add docs/
git commit -m "Docs: ajout documentation structurée"
```

---

## Checklist Finale

- [ ] Fichiers de test supprimés (analyze-sss-html.ts, test-*.js)
- [ ] Fichier "nul" supprimé
- [ ] Migrations déplacées vers supabase/migrations/
- [ ] Dossier scripts/ vide supprimé
- [ ] Dossier migrations/ de pro-bain-app supprimé
- [ ] .gitignore mis à jour
- [ ] Commits effectués
- [ ] Push sur GitHub

---

## Résultat Attendu

Après nettoyage, la racine du projet devrait contenir :

```
dashboard probain/
├── .claude/
├── .vscode/
├── _bmad/
├── _bmad-output/
├── admin-dashboard/
├── docs/
├── pro-bain-app/
├── supabase-mcp-server/
├── DOCUMENTATION.md
└── SUPABASE_KEY_REGENERATION_GUIDE.md
```

**Propre, clair, et facile à naviguer !**
