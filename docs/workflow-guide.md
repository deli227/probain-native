# Guide de Workflow Quotidien Pro-Bain

> Comment utiliser BMAD + Claude Code pour un développement propre et documenté

---

## 🎯 Principe

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SPÉCIFIER │────►│  DÉVELOPPER │────►│   REVIEW    │────►│  DOCUMENTER │
│  (optionnel)│     │             │     │ (optionnel) │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     quick-spec         dev/code          code-review       project-context
```

---

## 📋 Workflows par Situation

### 🆕 Nouvelle Fonctionnalité (Complexe)

**Étape 1 : Spécification**
```
/bmad:bmm:workflows:quick-spec
```
- Décrivez ce que vous voulez
- L'agent pose des questions
- Produit une spec technique claire

**Étape 2 : Développement**
```
Développez selon la spec
ou utilisez /apex pour un développement guidé
```

**Étape 3 : Review**
```
/bmad:bmm:workflows:code-review
```
- Review adversariale du code
- Trouve les problèmes potentiels
- Propose des corrections

**Étape 4 : Mise à jour contexte**
```
Mettez à jour project-context.md si nouvelles règles
```

---

### 🐛 Correction de Bug (Simple)

```
1. Décrivez le bug à Claude
2. Claude corrige
3. Testez
4. Commit: "fix: description du bug"
```

Pas besoin de workflow complet pour les petits bugs.

---

### 🔧 Petite Modification

```
1. Demandez directement à Claude
2. Claude fait la modification
3. Testez
4. Commit
```

---

### 🏗️ Refactoring Important

**Étape 1 : Planifier**
```
/bmad:bmm:workflows:quick-spec
```
- Documentez ce qui doit changer
- Pourquoi
- Comment

**Étape 2 : Exécuter par petits morceaux**
```
Faites des commits fréquents
Testez après chaque étape
```

**Étape 3 : Review finale**
```
/bmad:bmm:workflows:code-review
```

---

## 🚀 Commandes Rapides

| Commande | Usage |
|----------|-------|
| `/apex` | Développement guidé (Analyze, Plan, Execute, eXamine) |
| `/bmad:bmm:workflows:quick-spec` | Créer une spécification technique |
| `/bmad:bmm:workflows:quick-dev` | Développer selon une spec existante |
| `/bmad:bmm:workflows:code-review` | Review adversariale du code |
| `/bmad:bmm:agents:analyst` | Agent Business Analyst (ce que vous utilisez maintenant) |
| `/bmad:bmm:agents:architect` | Agent Architecte (décisions techniques) |
| `/bmad:bmm:agents:dev` | Agent Développeur |

---

## 📝 Template de Session de Développement

### Début de Session
```
1. Ouvrir Claude Code
2. Décrire ce qu'on veut faire
3. Si complexe : /bmad:bmm:workflows:quick-spec
4. Si simple : demander directement
```

### Pendant le Développement
```
- Tester régulièrement (npm run dev)
- Commiter souvent avec messages clairs
- Si bloqué : demander de l'aide à Claude
```

### Fin de Session
```
1. Tester que tout fonctionne
2. Si fonctionnalité majeure : /bmad:bmm:workflows:code-review
3. Mettre à jour project-context.md si nécessaire
4. Commit final et push
```

---

## 📊 Quand Utiliser Quoi ?

| Situation | Workflow | Temps |
|-----------|----------|-------|
| Bug simple | Demander directement | 5-15 min |
| Petite feature | Demander directement | 15-30 min |
| Feature moyenne | quick-spec → dev | 30-60 min |
| Feature complexe | quick-spec → dev → review | 1-2h |
| Refactoring | quick-spec → dev par étapes → review | Variable |
| Nouvelle architecture | architect agent → quick-spec → dev | 2-4h |

---

## ✅ Checklist Quotidienne

### Avant de Coder
- [ ] Clarifier l'objectif
- [ ] Vérifier project-context.md pour les règles

### Pendant le Code
- [ ] Suivre les conventions (TypeScript, hooks, etc.)
- [ ] Tester localement
- [ ] Commits fréquents

### Après le Code
- [ ] Tout fonctionne ?
- [ ] Documentation à jour ?
- [ ] Push sur GitHub ?

---

## 🔄 Maintenir le Projet à Jour

### project-context.md
Mettre à jour quand :
- Nouvelle convention de code
- Nouvelle table dans la BDD
- Nouveau pattern à suivre
- Changement d'architecture

### Documentation (docs/)
Mettre à jour quand :
- Nouvelle fonctionnalité majeure
- Changement de structure
- Nouvelles migrations importantes

### DOCUMENTATION.md
Mettre à jour quand :
- Changement d'architecture globale
- Nouveau type d'utilisateur
- Nouvelle intégration externe

---

## 💡 Conseils Pro

1. **Commencez petit** - Pas besoin de workflow complet pour tout
2. **Itérez** - Mieux vaut plusieurs petits commits qu'un gros
3. **Documentez au fur et à mesure** - Plus facile que tout à la fin
4. **Utilisez /apex** - Pour un développement guidé avec review intégrée
5. **Faites des reviews** - Après les features importantes
