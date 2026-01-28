---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
status: 'complete'
inputDocuments:
  - 'pro-bain-app/project-context.md'
  - 'docs/index.md'
  - 'docs/tech-stack.md'
  - 'docs/api-layer.md'
  - 'docs/ui-components.md'
  - 'docs/source-tree.md'
  - 'pro-bain-app/docs/data-models.md'
  - 'pro-bain-app/docs/project-structure-analysis.md'
  - 'pro-bain-app/docs/cleanup-action-plan.md'
  - 'pro-bain-app/docs/workflow-guide.md'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  projectContext: 1
  projectDocs: 10
projectType: 'brownfield'
classification:
  projectType: 'web_app'
  domain: 'employment_marketplace_aquatic'
  complexity: 'medium'
  projectContext: 'brownfield'
objectives:
  - 'Document existing system'
  - 'Plan new features'
  - 'Improve quality and stability'
---

# Product Requirements Document - Dashboard Pro-Bain

**Author:** Deli
**Date:** 2026-01-25

---

## Success Criteria

### User Success

**Sauveteurs:**
- Trouver un job rapidement via la plateforme
- Profil complet avec formations et disponibilités visibles par les établissements
- Recevoir des offres pertinentes

**Établissements:**
- Trouver un sauveteur qualifié rapidement
- Accès aux disponibilités en temps réel
- Communication directe via messagerie

**Formateurs:**
- Gérer leurs cours efficacement
- Attirer des étudiants via la plateforme

### Business Success

| Métrique | Cible | Délai |
|----------|-------|-------|
| Utilisateurs actifs | 1000 | 3 mois |
| Modèle économique | Gratuit | Phase actuelle |
| Rétention | Utilisateurs reviennent | Ongoing |

### Technical Success

| Critère | Cible |
|---------|-------|
| Qualité de code | Parfaite - TypeScript strict, 0 `any` |
| Bugs | Zéro bug en production |
| Performance | App fluide, chargement < 2s |
| Stabilité | Supporte trafic élevé sans dégradation |
| Tests | Couverture complète des fonctionnalités critiques |

### Measurable Outcomes

- **Mise en relation:** Temps moyen pour qu'un établissement trouve un sauveteur < 48h
- **Adoption:** 1000 utilisateurs actifs en 3 mois
- **Qualité:** 0 bug critique en production
- **Performance:** Temps de chargement < 2 secondes sur toutes les pages

---

## Product Scope

### MVP - Minimum Viable Product ✅ (Actuel)

Fonctionnalités existantes et opérationnelles:
- Authentification avec 3 types de profils (sauveteur, formateur, établissement)
- Profils complets avec formations, expériences, certifications
- Gestion des disponibilités (sauveteurs)
- Offres d'emploi (établissements)
- Cours et formations (formateurs)
- Messagerie interne
- Flux d'actualités avec visibilité ciblée
- Notifications
- Dashboard Admin complet

### Growth Features (Priorité Immédiate)

Focus sur la qualité et la stabilité:
- Corriger tous les bugs existants
- Assurer fluidité et performance
- Qualité de code irréprochable (TypeScript strict)
- Tests automatisés pour les fonctionnalités critiques
- Pas de fautes/erreurs dans le code

### Vision (Future)

- Ajouts basiques selon les retours utilisateurs
- Pas de grosses mises à jour prévues pour l'instant
- Évolutions guidées par les besoins réels des utilisateurs

---

## User Journeys

### Parcours 1: Lucas, Sauveteur (maitre_nageur)

**Persona:** Lucas, 24 ans, nouvellement diplômé, cherche un poste à Lausanne.

**Parcours:**
1. **Découverte** → Lucas s'inscrit sur Pro-Bain, choisit "Sauveteur"
2. **Onboarding** → Il complète son profil: formations, expériences, disponibilités
3. **Recherche** → Il consulte les offres d'emploi des établissements
4. **Contact** → Un établissement le contacte via la messagerie
5. **Succès** → Il décroche un poste en 1 semaine

**Moment clé:** Réception de la notification "Nouveau message d'un établissement"

**Fonctionnalités utilisées:** Inscription, profil, formations, disponibilités, offres d'emploi, messagerie, notifications

---

### Parcours 2: Marie, Responsable Établissement (etablissement)

**Persona:** Marie, responsable de la piscine municipale de Genève, besoin urgent de remplacement.

**Parcours:**
1. **Besoin urgent** → Marie se connecte à Pro-Bain
2. **Publication** → Elle crée une offre d'emploi avec les critères requis
3. **Recherche** → Elle consulte les sauveteurs disponibles dans sa région
4. **Sélection** → Elle filtre par disponibilités et certifications
5. **Contact** → Elle envoie un message aux candidats potentiels
6. **Succès** → Elle trouve un remplaçant en 48h

**Moment clé:** Voir la liste des sauveteurs disponibles immédiatement

**Fonctionnalités utilisées:** Offres d'emploi, recherche sauveteurs, filtres, messagerie

---

### Parcours 3: Jean, Organisme de Formation (formateur)

**Persona:** Jean, directeur d'un centre de formation SSS, veut promouvoir ses cours.

**Parcours:**
1. **Découverte** → Jean s'inscrit sur Probain, sélectionne "Formateur"
2. **Réclamation** → Il sélectionne son organisme dans la liste et soumet une demande
3. **Validation** → L'admin valide la demande et lui envoie ses identifiants par email
4. **Connexion** → Jean se connecte avec ses identifiants
5. **Onboarding** → Il complète son profil via l'onboarding formateur (6 étapes):
   - Bienvenue organisation
   - Nom de l'organisme (obligatoire)
   - Upload logo (optionnel)
   - Description (skippable)
   - Localisation (canton, ville, adresse - skippable)
   - Confirmation finale
6. **Gestion** → Accès au profil formateur pour gérer ses cours
7. **Succès** → Ses cours se remplissent via la plateforme

**Moment clé:** Voir la liste des inscrits à son cours

**Fonctionnalités utilisées:** Claim account, onboarding formateur, profil organisme, création cours, gestion inscriptions

---

### Parcours 4: Admin Pro-Bain

**Persona:** Administrateur de la plateforme, gestion quotidienne.

**Parcours:**
1. **Connexion** → Accès au dashboard admin sécurisé
2. **Monitoring** → Vue d'ensemble des stats (utilisateurs, activité)
3. **Modération** → Gestion du flux d'actualités
4. **Support** → Traitement des réclamations de comptes
5. **Maintenance** → Activation/désactivation de comptes si besoin

**Moment clé:** Vue claire de la santé de la plateforme

**Fonctionnalités utilisées:** Dashboard stats, modération flux, gestion utilisateurs, audit logs

---

### Journey Requirements Summary

| Type Utilisateur | Fonctionnalités Clés |
|------------------|---------------------|
| Sauveteur | Profil, formations, disponibilités, consultation offres, messagerie, notifications |
| Établissement | Offres d'emploi, recherche sauveteurs, filtres géo/dispo, messagerie |
| Formateur | Profil organisme, création cours, gestion inscriptions, suivi participants |
| Admin | Dashboard stats, modération flux, gestion utilisateurs, audit, réclamations |

---

## Web App Specific Requirements

### Architecture Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Frontend | React + TypeScript | 18.3 / 5.5 |
| Build Tool | Vite | 5.4 |
| UI Framework | Shadcn/UI (Radix) | Latest |
| Styling | TailwindCSS | 3.4 |
| State Management | TanStack Query | 5.56 |
| Routing | React Router DOM | 6.26 |
| Backend | Supabase | Cloud |
| Auth | Supabase Auth | Integrated |

### Performance Targets

| Métrique | Cible |
|----------|-------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Largest Contentful Paint | < 2.5s |
| Page Load | < 2s |
| Bundle Size | Optimisé (lazy loading) |

### Responsive Design

| Breakpoint | Écran | Comportement |
|------------|-------|--------------|
| sm | < 640px | Mobile-first, navigation burger |
| md | 640-768px | Tablette portrait |
| lg | 768-1024px | Tablette paysage |
| xl | > 1024px | Desktop complet |

### Browser Support

| Navigateur | Support |
|------------|---------|
| Chrome | Dernières 2 versions |
| Firefox | Dernières 2 versions |
| Safari | Dernières 2 versions |
| Edge | Dernières 2 versions |
| Mobile browsers | iOS Safari, Chrome Android |

### PWA Capabilities

- Manifest.json configuré
- Service Worker pour offline basique
- Installation sur écran d'accueil
- Push notifications (via Supabase)

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP - Déjà déployé et fonctionnel
**Status:** Phase 1 (MVP) complétée

Le MVP Pro-Bain répond au problème central: connecter rapidement les établissements aquatiques avec des sauveteurs qualifiés.

### Phase 1: MVP ✅ (Complété)

**Core User Journeys Supported:**
- Sauveteur → Création profil → Recherche emploi → Contact établissement
- Établissement → Publication offre → Recherche sauveteurs → Recrutement
- Formateur → Gestion cours → Inscriptions étudiants
- Admin → Gestion plateforme → Modération

**Fonctionnalités MVP livrées:**
- Authentification avec 3 types de profils
- Profils complets (formations, expériences, disponibilités)
- Offres d'emploi et recherche
- Messagerie interne
- Flux d'actualités ciblé
- Notifications
- Dashboard Admin complet

### Phase 2: Stabilisation (Priorité Actuelle)

**Objectifs:**
- Zéro bug en production
- Qualité de code parfaite (TypeScript strict)
- Couverture de tests complète
- Performance optimale (< 2s chargement)
- Stabilité sous charge

**Actions concrètes:**
- Audit et correction de tous les bugs existants
- Refactoring pour éliminer les `any` TypeScript
- Ajout de tests unitaires et d'intégration
- Optimisation des requêtes et du bundle
- Amélioration de la gestion des erreurs

### Phase 3: Croissance (Future)

**Features potentielles:**
- Améliorations UX basées sur les retours utilisateurs
- Fonctionnalités additionnelles mineures
- Optimisations selon les métriques d'usage

**Approche:**
- Évolutions guidées par les données d'utilisation
- Pas de grosses refontes prévues
- Focus sur la satisfaction utilisateur

### Risk Mitigation Strategy

**Risques Techniques:**
- Mitigation: TypeScript strict, tests automatisés, code review

**Risques Scalabilité:**
- Mitigation: Supabase gère le scaling automatiquement

**Risques Adoption:**
- Mitigation: Focus sur UX fluide et sans friction

---

## Functional Requirements

### Gestion des Utilisateurs

- **FR1:** Un visiteur peut créer un compte avec email et mot de passe
- **FR2:** Un utilisateur peut se connecter à son compte
- **FR3:** Un utilisateur peut réinitialiser son mot de passe
- **FR4:** Un nouvel utilisateur peut choisir son type de profil (sauveteur, formateur, établissement)
- **FR5:** Un utilisateur peut compléter son onboarding après inscription
- **FR6:** Un utilisateur peut se déconnecter

### Profils Sauveteur

- **FR7:** Un sauveteur peut renseigner ses informations personnelles
- **FR8:** Un sauveteur peut ajouter ses formations et certifications
- **FR9:** Un sauveteur peut uploader des documents justificatifs (PDF)
- **FR10:** Un sauveteur peut ajouter ses expériences professionnelles
- **FR11:** Un sauveteur peut gérer ses disponibilités (calendrier)
- **FR12:** Un sauveteur peut définir son statut de disponibilité global
- **FR13:** Un sauveteur peut uploader une photo de profil

### Profils Établissement

- **FR14:** Un établissement peut renseigner ses informations (nom, adresse, type de bassin)
- **FR15:** Un établissement peut uploader un logo
- **FR16:** Un établissement peut consulter les sauveteurs disponibles
- **FR17:** Un établissement peut filtrer les sauveteurs par région et disponibilité
- **FR18:** Un établissement peut voir le profil détaillé d'un sauveteur

### Profils Formateur

- **FR19:** Un formateur peut réclamer un compte via la liste des organismes
- **FR20:** Un admin peut valider une réclamation et créer le compte formateur
- **FR21:** Un formateur peut compléter l'onboarding en 6 étapes (Mis à jour 26/01/2026):
  - Bienvenue organisation
  - Nom de l'organisme (OBLIGATOIRE - minimum 2 caractères)
  - Upload logo (optionnel, stocké sur Supabase Storage)
  - Description de l'organisme (skippable, minimum 10 caractères si rempli)
  - Localisation (canton, NPA/ville, adresse - tout optionnel)
  - Confirmation finale avec redirection vers profil formateur
- **FR22:** Un formateur peut uploader un logo d'organisme
- **FR23:** Un formateur peut gérer ses informations de localisation (canton, ville, adresse)

### Offres d'Emploi

- **FR24:** Un établissement peut créer une offre d'emploi
- **FR25:** Un établissement peut modifier une offre d'emploi
- **FR26:** Un établissement peut supprimer une offre d'emploi
- **FR27:** Un sauveteur peut consulter les offres d'emploi
- **FR28:** Un sauveteur peut filtrer les offres par région et type de contrat

### Formations & Cours

- **FR27:** Un formateur peut créer un cours avec dates, lieu et places disponibles
- **FR28:** Un formateur peut modifier un cours existant
- **FR29:** Un formateur peut supprimer un cours
- **FR30:** Un formateur peut voir la liste des inscrits à ses cours
- **FR31:** Un sauveteur peut consulter les cours disponibles
- **FR32:** Un sauveteur peut s'inscrire à un cours
- **FR33:** Un sauveteur peut consulter les formations SSS externes

### Messagerie

- **FR34:** Un utilisateur peut envoyer un message à un autre utilisateur
- **FR35:** Un utilisateur peut consulter ses messages reçus
- **FR36:** Un utilisateur peut lire un message et le marquer comme lu
- **FR37:** Un utilisateur peut voir le nombre de messages non lus

### Flux d'Actualités

- **FR38:** Un utilisateur peut consulter le flux d'actualités
- **FR39:** Un utilisateur voit uniquement les posts correspondant à son profil
- **FR40:** Un admin peut créer un post dans le flux
- **FR41:** Un admin peut cibler la visibilité d'un post
- **FR42:** Un admin peut programmer la publication d'un post

### Notifications

- **FR43:** Un utilisateur reçoit une notification pour un nouveau message
- **FR44:** Un utilisateur peut voir ses notifications non lues
- **FR45:** Un utilisateur peut gérer ses préférences de notifications

### Administration

- **FR46:** Un admin peut se connecter au dashboard admin
- **FR47:** Un admin peut voir les statistiques globales
- **FR48:** Un admin peut lister et rechercher les utilisateurs
- **FR49:** Un admin peut activer/désactiver un compte utilisateur
- **FR50:** Un admin peut traiter les réclamations de comptes
- **FR51:** Un admin peut consulter les logs d'audit
- **FR52:** Un admin peut gérer les autres administrateurs

### Landing Page & Pages Légales (Mis à jour 26/01/2026)

- **FR53:** La landing page affiche le logo officiel "PROBAIN AQUATIC NETWORK" dans le header et footer
- **FR54:** La landing page contient un lien Instagram vers @probain.ch dans la section "Suivez-nous"
- **FR55:** La landing page contient des liens vers les pages légales (CGU et Politique de confidentialité)
- **FR56:** La page Conditions d'Utilisation (`/terms`) est accessible et conforme au droit suisse
- **FR57:** La page Politique de Confidentialité (`/privacy`) est accessible et conforme à la LPD suisse
- **FR58:** Les pages légales scrollent automatiquement en haut lors de la navigation

---

## Non-Functional Requirements

### Performance

- **NFR1:** Temps de chargement des pages < 2 secondes
- **NFR2:** First Contentful Paint < 1.5 secondes
- **NFR3:** Time to Interactive < 3 secondes
- **NFR4:** Réponse des API Supabase < 500ms
- **NFR5:** Animations UI à 60 FPS minimum

### Fiabilité & Stabilité

- **NFR6:** Zéro bug critique en production
- **NFR7:** Disponibilité du service à 99.5% uptime
- **NFR8:** Toutes les erreurs sont catchées et loguées
- **NFR9:** L'application ne crash pas, affiche des messages d'erreur utiles

### Sécurité

- **NFR10:** Authentification via Supabase Auth sécurisé
- **NFR11:** Toutes les données en transit via HTTPS
- **NFR12:** Row Level Security (RLS) sur toutes les tables Supabase
- **NFR13:** Mots de passe hashés, jamais stockés en clair
- **NFR14:** Sessions avec tokens JWT et expiration

### Scalabilité

- **NFR15:** Support de 1000+ utilisateurs simultanés sans dégradation
- **NFR16:** Croissance de la base de données gérée par Supabase Cloud
- **NFR17:** Assets statiques servis via CDN

### Qualité de Code

- **NFR18:** TypeScript strict activé avec 0 erreurs de compilation
- **NFR19:** Aucun type `any` dans le code source
- **NFR20:** Fonctionnalités critiques couvertes par des tests
- **NFR21:** ESLint sans warnings

### Maintenabilité

- **NFR22:** Structure de code organisée et cohérente
- **NFR23:** Documentation CLAUDE.md à jour pour chaque application
- **NFR24:** Dépendances à jour sans vulnérabilités connues
