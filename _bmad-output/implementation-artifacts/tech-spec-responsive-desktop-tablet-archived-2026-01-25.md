---
title: 'Responsive Desktop/Tablet - 3 Profils Pro Bain'
slug: 'responsive-desktop-tablet'
created: '2026-01-25'
status: 'in-progress'
stepsCompleted: [1]
tech_stack: ['React', 'TypeScript', 'TailwindCSS', 'shadcn/ui']
files_to_modify:
  - 'src/pages/Settings.tsx'
  - 'src/pages/Mailbox.tsx'
  - 'src/pages/Flux.tsx'
  - 'src/pages/Profile.tsx'
  - 'src/components/profile/TrainerCourses.tsx'
  - 'src/components/profile/EstablishmentMailbox.tsx'
  - 'src/components/profile/EstablishmentProfile.tsx'
code_patterns:
  - 'Mobile-first with md: lg: xl: breakpoints'
  - 'max-w-* containers for content constraint'
  - 'Responsive grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
test_patterns: []
---

# Tech-Spec: Responsive Desktop/Tablet - 3 Profils Pro Bain

**Created:** 2026-01-25

## Overview

### Problem Statement

Les pages de Pro Bain sont optimisées pour mobile mais manquent d'optimisation pour desktop et tablette. Sur grands écrans, le contenu s'étire sur toute la largeur, les grids restent en colonnes fixes, et l'expérience utilisateur n'est pas professionnelle.

### Solution

Ajouter des breakpoints Tailwind `md:`, `lg:`, et `xl:` pour optimiser l'affichage desktop/tablette SANS toucher aux classes de base mobile. Utiliser les patterns existants de `TrainerStudents.tsx` et `EstablishmentRescuers.tsx` comme référence.

### Scope

**In Scope:**
- Settings.tsx - Layout responsive avec max-width et padding adaptatif
- Mailbox.tsx - Optimisation desktop avec layout amélioré
- Flux.tsx - Grid multi-colonnes pour desktop (2 colonnes tablette, 3 colonnes desktop)
- Profile.tsx - Padding responsive
- TrainerCourses.tsx - Grid responsive (actuellement fixé à 2 colonnes)
- EstablishmentMailbox.tsx - Responsive design complet
- EstablishmentProfile.tsx - Padding responsive

**Out of Scope:**
- Modification des styles mobile (INTOUCHABLE)
- Ajout de nouvelles fonctionnalités
- Modification de la logique métier
- Modification des navbars (déjà responsives)

## Context for Development

### Codebase Patterns

**Pattern responsive existant à suivre (TrainerStudents.tsx) :**
```tsx
// Container padding responsive
className="container mx-auto py-4 px-2 sm:px-4 md:px-6 lg:px-8"

// Grid responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Text responsive
className="text-xl sm:text-2xl font-bold"

// Flex responsive
className="flex flex-col md:flex-row justify-between items-start md:items-center"
```

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `TrainerStudents.tsx` | Excellent exemple de responsive - COPIER CE PATTERN |
| `EstablishmentRescuers.tsx` | Bon exemple de grid responsive |
| `Jobs.tsx` | Bon exemple de carousel responsive |

### Technical Decisions

1. **CONTRAINTE ABSOLUE**: Ne JAMAIS modifier les classes de base (sans préfixe). Uniquement AJOUTER des classes `md:`, `lg:`, `xl:`.
2. **Max-width**: Utiliser `max-w-4xl` pour Settings/Mailbox, `max-w-6xl` pour Flux
3. **Breakpoints**: Suivre la convention Tailwind (md: 768px, lg: 1024px, xl: 1280px)
4. **Flux grid**: 1 colonne mobile (inchangé), 2 colonnes tablette, 2-3 colonnes desktop

## Implementation Plan

### Tasks

#### Task 1: Settings.tsx
- Ajouter `max-w-4xl mx-auto` au container principal
- Ajouter padding responsive `md:p-6 lg:p-8`
- Ajouter `sticky top-0 z-10` au header
- Ajouter text responsive au titre `md:text-3xl`

#### Task 2: Mailbox.tsx
- Ajouter padding responsive au container
- Améliorer le layout pour desktop
- Ajouter responsive text sizing

#### Task 3: Flux.tsx
- Ajouter grid responsive pour les posts: `md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3`
- Ajouter `max-w-6xl mx-auto` pour centrer sur grands écrans
- Ajouter padding responsive
- Ajouter `sticky top-0 z-10` au header (fix bug visuel menu burger)

#### Task 4: TrainerCourses.tsx
- Changer `grid-cols-2` fixe en `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- Ajouter gap responsive

#### Task 5: EstablishmentMailbox.tsx
- Ajouter padding responsive `md:p-6 lg:p-8`
- Ajouter text responsive
- Améliorer dialog sizing

#### Task 6: Profile.tsx
- Ajouter padding responsive au container
- Ajouter `max-w-7xl mx-auto` si absent

#### Task 7: EstablishmentProfile.tsx
- Ajouter padding responsive comme EstablishmentRescuers.tsx

### Acceptance Criteria

**Given** un utilisateur sur desktop (>1024px)
**When** il visite n'importe quelle page Pro Bain
**Then** le contenu est centré avec des marges latérales appropriées

**Given** un utilisateur sur tablette (768-1024px)
**When** il visite la page Flux
**Then** les posts s'affichent en 2 colonnes

**Given** un utilisateur sur mobile (<768px)
**When** il visite n'importe quelle page
**Then** l'affichage est IDENTIQUE à avant (aucun changement)

## Additional Context

### Dependencies

Aucune nouvelle dépendance requise.

### Testing Strategy

Test manuel sur:
- Mobile: 375px (iPhone SE)
- Tablette: 768px (iPad)
- Desktop: 1280px (Laptop)
- Large Desktop: 1920px (Monitor)

### Notes

- CRITIQUE: Vérifier que mobile reste identique après chaque modification
- Utiliser les DevTools Chrome pour tester les breakpoints
- Pattern à suivre: TrainerStudents.tsx ligne 217, 228, 271
