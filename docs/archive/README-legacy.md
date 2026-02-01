
# PRO-BAIN CONNECT - Documentation Développeur

<div align="center">
  <img src="/public/lovable-uploads/d7f5db6d-57a6-4eb2-a8cc-9591021aef86.png" alt="Pro Bain Logo" width="300px" />
  <h3>Connectez, formez, sauvez !</h3>
</div>

> 📚 **Documentation Complète**: Pour une vue d'ensemble complète du projet (architecture, base de données, scraper SSS, déploiement), consultez [DOCUMENTATION.md](../DOCUMENTATION.md) à la racine du projet.

## 🎯 Vue d'ensemble

Pro-Bain Connect est une plateforme de mise en relation professionnelle dans le domaine de la sécurité aquatique en Suisse. L'application gère trois types d'utilisateurs distincts :

- **Maîtres Nageurs** : Professionnels cherchant des opportunités d'emploi
- **Formateurs** : Organismes proposant des formations et certifications
- **Établissements** : Piscines et installations aquatiques

La plateforme facilite le recrutement, la recherche d'emploi, et le suivi des certifications dans le domaine de la sécurité aquatique.

## 🏗 Architecture Technique

### Stack Technologique
- **Frontend** : React + TypeScript + Vite
- **UI/UX** : Tailwind CSS + Shadcn/UI
- **Backend** : Supabase (PostgreSQL + Authentication)
- **State Management** : React Context + Custom Hooks
- **Routing** : React Router v6

### Structure de l'Application

#### Système d'Authentification
- Gestion des sessions via Supabase Auth
- Flow d'onboarding personnalisé selon le type d'utilisateur
- Protection des routes avec `ProtectedRoute` et `AuthRoute`

#### Types de Profils
```typescript
type ProfileType = 'maitre_nageur' | 'formateur' | 'etablissement';
```

#### Flux de Communication
```
┌───────────────┐      ┌─────────────┐      ┌────────────────┐
│ Établissement │◄────►│  Formateur  │◄────►│ Maître Nageur  │
└───────┬───────┘      └──────┬──────┘      └────────┬───────┘
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐      ┌─────────────┐      ┌────────────────┐
│  Offres       │      │ Formations  │      │ Disponibilités │
│  d'emploi     │      │             │      │                │
└───────────────┘      └─────────────┘      └────────────────┘
```

**Important**: Les maîtres nageurs peuvent **recevoir** des messages des formateurs et établissements, mais ne peuvent pas en **envoyer**. C'est une communication unidirectionnelle.

#### Composants Principaux
- `ProfileProvider` : Contexte global de gestion des profils
- `OnboardingWizard` : Assistant de configuration initiale
- Composants spécifiques par type d'utilisateur :
  - `RescuerProfile` (Maître Nageur)
  - `TrainerProfile` (Formateur)
  - `EstablishmentProfile` (Établissement)

## 💾 Structure de la Base de Données

### Tables Principales
- `profiles` : Informations de base des utilisateurs
- `trainer_profiles` : Profils des formateurs
- `establishment_profiles` : Profils des établissements
- `rescuer_profiles` : Profils des maîtres nageurs
- `job_postings` : Offres d'emploi
- `formations` : Formations disponibles
- `availabilities` : Disponibilités des maîtres nageurs
- `experiences` : Expériences professionnelles
- `messages` : Messagerie entre utilisateurs

### Relations importantes
- Un utilisateur a un seul type de profil (rescuer, trainer ou establishment)
- Un formateur peut avoir plusieurs étudiants (trainer_students)
- Un sauveteur peut avoir plusieurs formations et disponibilités
- Un établissement peut publier plusieurs offres d'emploi
- Les messages ont une source (sender_id) et une destination (receiver_id)

## 🔐 Sécurité et Permissions

### Row Level Security (RLS)
- Policies personnalisées par table
- Contrôle d'accès basé sur le type de profil
- Validation des données côté serveur

### Authentication Flow
1. Inscription/Connexion
2. Sélection du type de profil
3. Complétion de l'onboarding
4. Accès aux fonctionnalités spécifiques

## 📦 Fonctionnalités Principales

### Pour les Maîtres Nageurs
- Recherche d'offres d'emploi
- Gestion du profil et des certifications
- Configuration des disponibilités
- Réception de messages des établissements et formateurs
- Suivi des formations et certifications
- Gestion de l'expérience professionnelle

### Pour les Formateurs
- Gestion des formations proposées
- Suivi des étudiants et de leur progression
- Validation des certifications
- Communication avec les établissements et sauveteurs
- Gestion du profil de l'organisme de formation

### Pour les Établissements
- Publication d'offres d'emploi
- Recherche de maîtres nageurs qualifiés
- Gestion des événements
- Communication avec les candidats
- Administration du profil de l'établissement

## 🧩 Flux de travail principaux

### Publication et candidature à une offre d'emploi
1. L'établissement crée une offre avec description, lieu et type de contrat
2. Les sauveteurs peuvent rechercher et filtrer les offres
3. L'établissement peut contacter le candidat directement via le système de messagerie

### Gestion des formations et certifications
1. Les formateurs enregistrent les formations et suivent les étudiants
2. Les sauveteurs ajoutent leurs formations à leur profil
3. Les établissements peuvent vérifier les certifications des candidats
4. Système de validation des certifications par les formateurs

## 🚀 Installation et déploiement

### Prérequis
- Node.js v18+ 
- npm v9+
- Compte Supabase (pour la base de données et l'authentification)

### Variables d'environnement
Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
VITE_UPLOAD_DOCUMENTS_ENDPOINT=votre_endpoint_upload
```

### Installation

```bash
# Installation des dépendances
npm install

# Démarrage en développement
npm run dev

# Construction pour production
npm run build
```

### Déploiement
Le projet est configuré pour un déploiement sur Netlify :

```
# Construction du projet
npm run build

# Dossier de sortie
dist/
```

Assurez-vous de configurer les variables d'environnement dans l'interface de votre service de déploiement.

## 📈 Tâches à accomplir

### Optimisation PDF Mobile (En cours)
- ✅ Amélioration du composant `PDFViewerDialog` pour les appareils mobiles
- ✅ Implémentation du zoom et des contrôles adaptés au tactile
- ✅ Optimisation de la visualisation sur petits écrans
- ⬜ Déboguer les problèmes d'affichage sur certains appareils Android
- ⬜ Tester sur différentes résolutions et appareils iOS/Android

### Intégration SSS (À faire)
- ⬜ Développer un scraper pour https://formation.sss.ch/Calendrier-des-Cours
- ⬜ Créer une fonction Edge sur Supabase pour exécuter le scraper
- ⬜ Intégrer les données récupérées dans le profil sauveteur
- ⬜ Mettre en place un système de synchronisation régulière
- ⬜ Gérer les mises à jour et nouvelles formations

### Nettoyage & Débogage (À faire)
- ⬜ Supprimer les dépendances à Lovable
- ⬜ Debug complet de l'application sur les 3 profils
- ⬜ Corriger les problèmes de navigation et d'authentification
- ⬜ Vérifier la compatibilité sur tous les navigateurs modernes
- ⬜ Optimiser les performances générales

### Optimisations (À faire)
- ⬜ Améliorer les performances des requêtes Supabase
- ⬜ Optimiser les images et documents pour le chargement rapide
- ⬜ Mettre en place un système de cache et gestion offline
- ⬜ Réduire la taille du bundle et le temps de chargement initial
- ⬜ Améliorer les indicateurs de chargement et l'expérience utilisateur

## 🛠️ Guide de développement

### Implémentation du Scraper SSS
Pour l'intégration avec le site de la SSS, il faudra :
1. Créer une Edge Function Supabase qui utilisera Cheerio ou Puppeteer pour extraire les données du calendrier
2. Stocker les formations dans une table dédiée avec mise à jour périodique
3. Développer une interface utilisateur permettant de filtrer et importer ces formations
4. Gérer les validations de formations et la synchronisation avec les profils

### Flux de communication complet
```
┌───────────────────────────┐                  ┌───────────────────────────┐
│                           │                  │                           │
│       ÉTABLISSEMENT       │◄────────────────►│         FORMATEUR         │
│                           │  Communication   │                           │
└─────────────┬─────────────┘  bidirectionnelle└─────────────┬─────────────┘
              │                                              │
              │                   Communication              │
              │                  unidirectionnelle           │
              ▼                                              ▼
┌───────────────────────────┐                  ┌───────────────────────────┐
│                           │                  │                           │
│          OFFRES           │◄────────────────►│       MAÎTRE NAGEUR       │
│         D'EMPLOI          │     Consultation │       (RÉCEPTION          │
│                           │     uniquement   │       UNIQUEMENT)         │
└───────────────────────────┘                  └───────────────────────────┘
```

## 🔍 Maintenance et dépannage

### Problèmes connus PDF sur mobile
- Sur iOS, certains contrôles de PDF peuvent ne pas fonctionner correctement
- Les PDF volumineux peuvent causer des problèmes de mémoire sur les appareils anciens
- Solution temporaire : ouvrir les PDF dans le navigateur natif via le bouton "Ouvrir dans un nouvel onglet"

### Logs et monitoring
- Utiliser la console développeur pour le débogage frontend
- Vérifier les logs Supabase pour les erreurs côté base de données
- Les logs principaux sont préfixés avec `[ComponentName]` pour faciliter le filtrage

### Mises à jour importantes
- Maintenir les dépendances à jour, particulièrement les packages liés à la sécurité
- Vérifier régulièrement les mises à jour de l'API Supabase
- Tester après les mises à jour majeures de React ou TypeScript

## 🐛 Debugging

### Techniques de debugging
1. Utiliser `console.log` stratégiquement dans les composants et hooks
2. Examiner l'état React avec React DevTools
3. Vérifier les requêtes réseau dans les outils de développement
4. Pour les problèmes Supabase, consulter les logs SQL

### Erreurs courantes
- Problèmes d'authentification : Vérifier les tokens JWT et leur expiration
- Erreurs RLS : Vérifier les politiques Supabase pour les tables concernées
- Problèmes de rendu : Vérifier la structure des composants et l'ordre d'exécution des hooks

## 📈 Optimisations de performance

### Frontend
- Utilisation de `React.memo` pour les composants coûteux en rendu
- Code-splitting avec `React.lazy` et `Suspense`
- Optimisation des images et assets statiques

### Backend (Supabase)
- Indexation appropriée des tables fréquemment interrogées
- Utilisation de vues matérialisées pour les requêtes complexes
- Mise en cache des résultats de requêtes fréquentes

## 🔒 Sécurité

### Pratiques recommandées
- Ne jamais exposer les clés Supabase dans le code client
- Toujours utiliser les RLS pour protéger les données
- Valider les entrées utilisateur côté client ET serveur
- Mettre en œuvre le CSP (Content Security Policy)

### Authentification
- Utilisation de l'authentification Supabase avec JWT
- Gestion sécurisée des sessions
- Option de 2FA disponible via Supabase

## 📚 Guides de Contribution

### Process de Développement
1. Créer une branche feature/
2. Développer avec tests
3. Review de code
4. Merge vers main

### Standards de Code
- ESLint + Prettier configurés
- Conventions de nommage cohérentes
- Documentation des changements

## 📚 Documentation

Documentation complète disponible dans [`docs/`](./docs/):

- [📊 Performance & Optimisations](./docs/performance/)
- [🔄 TanStack Query (Cache)](./docs/tanstack-query/)
- [📘 TypeScript Strict Mode](./docs/typescript/)

## 🆘 Support et Maintenance

### Ressources
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation React](https://reactjs.org/docs/getting-started.html)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation Shadcn/UI](https://ui.shadcn.com)

### Contact
Pour toute question technique ou assistance, contacter l'équipe de développement à `contact@probain.ch`.

## 📅 Roadmap et Évolutions
- Système de notation et reviews
- Application mobile native
- Internationalisation
- Système avancé de matching entre offres et profils
- Automatisation des renouvellements de certificats
- Tableaux de bord analytiques pour tous les types d'utilisateurs
