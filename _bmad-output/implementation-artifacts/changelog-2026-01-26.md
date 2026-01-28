---
date: '2026-01-26'
type: 'changelog'
author: 'BMAD Party Mode'
status: 'complete'
commits:
  - hash: '4d9b8f3'
    message: 'feat: onboarding formateur modulaire + améliorations UX'
    files_changed: 20
    insertions: 876
    deletions: 156
  - hash: '6550b81'
    message: 'fix: correct footer logo'
  - hash: '54bcab1'
    message: 'fix: same logo in header and footer'
  - hash: 'bf2e842'
    message: 'fix: footer Instagram only with correct link'
  - hash: 'b3afd7b'
    message: 'feat: pages CGU et politique de confidentialité'
  - hash: 'befbab6'
    message: 'fix: use Lucide React Instagram icon in footer'
---

# Changelog - 26 Janvier 2026

## Vue d'ensemble

Session de développement focalisée sur l'amélioration UX et la création du nouvel onboarding formateur modulaire.

---

## 1. Suppression des boutons retour circulaires

### Contexte
Les boutons retour circulaires bleus (avec flèche) étaient présents sur plusieurs pages et créaient une incohérence visuelle. Décision de les supprimer car non nécessaires.

### Fichiers modifiés
- `src/pages/Training.tsx` - Suppression du bouton retour + import `ArrowLeft`
- `src/pages/Jobs.tsx` - Suppression du bouton retour + import `ArrowLeft`
- `src/pages/Mailbox.tsx` - Suppression du bouton retour + import `ArrowLeft`
- `src/components/mailbox/EstablishmentMailbox.tsx` - Suppression du bouton retour
- `src/pages/Auth.tsx` - Suppression du bouton retour

### Code supprimé (exemple)
```tsx
<button
  onClick={() => navigate(-1)}
  className="absolute top-4 left-4 ..."
  aria-label="Retour"
>
  <ArrowLeft className="h-6 w-6 text-white" />
</button>
```

---

## 2. Amélioration des headers de pages

### Contexte
Les headers des pages Jobs, Mailbox et Flux étaient jugés "grossiers". Refactoring pour un design plus aéré et harmonieux.

### Nouveau pattern de header
```tsx
<div className="bg-gradient-to-r from-primary to-primary-dark py-8 md:py-12 px-4">
  <div className="max-w-4xl mx-auto text-center">
    <div className="flex flex-col items-center gap-3 md:gap-4">
      <div className="bg-white/10 p-4 rounded-full">
        <Icon className="h-10 w-10 md:h-12 md:w-12 text-white" />
      </div>
      <h1 className="text-2xl md:text-4xl font-bold text-white tracking-wide">
        TITRE
      </h1>
      <p className="text-white/70 text-sm md:text-base max-w-md">
        Description contextuelle
      </p>
    </div>
  </div>
</div>
```

### Fichiers modifiés
| Fichier | Icône | Titre | Description |
|---------|-------|-------|-------------|
| `Jobs.tsx` | Briefcase | OFFRES D'EMPLOI | Trouvez votre prochaine opportunité professionnelle |
| `Mailbox.tsx` | Mail + Badge | MESSAGERIE | Contextuel selon profileType |
| `EstablishmentMailbox.tsx` | Mail + Badge | MESSAGERIE | Gérez vos échanges avec les candidats |
| `Flux.tsx` | MessageCircle | FLUX | Actualités et publications de la communauté Probain |

---

## 3. Correction orthographique "Pro Bain" → "Probain"

### Contexte
La marque s'écrit "Probain" en un seul mot (P majuscule), pas "Pro Bain".

### Fichiers modifiés (9 fichiers)
- `src/pages/Auth.tsx` - alt logo
- `src/pages/Flux.tsx` - texte communauté
- `src/pages/Index.tsx` - 4 occurrences (logos, vidéo, copyright)
- `src/components/navbar/RescuerNavbar.tsx` - alt logo
- `src/components/navbar/EstablishmentNavbar.tsx` - alt logo
- `src/components/navbar/TrainerNavbar.tsx` - alt logo
- `src/hooks/useFlux.ts` - author_name default
- `src/components/onboarding/steps/RescuerComplete.tsx` - message bienvenue

### Vérification
```bash
grep -r "Pro Bain" src/  # Doit retourner 0 résultat
```

---

## 4. Création de l'onboarding formateur modulaire

### Contexte
L'onboarding formateur utilisait l'ancien pattern monolithique (`TrainerOnboarding.tsx`). Migration vers le nouveau pattern modulaire identique à celui des sauveteurs (`RescuerOnboardingFlow.tsx`).

### Architecture

```
src/components/onboarding/
├── TrainerOnboardingFlow.tsx    ← NOUVEAU - Flow principal
└── steps/
    ├── TrainerWelcome.tsx       ← NOUVEAU - Étape 1
    ├── TrainerOrganization.tsx  ← NOUVEAU - Étape 2
    ├── TrainerLogo.tsx          ← NOUVEAU - Étape 3
    ├── TrainerDescription.tsx   ← NOUVEAU - Étape 4
    ├── TrainerLocation.tsx      ← NOUVEAU - Étape 5
    └── TrainerComplete.tsx      ← NOUVEAU - Étape 6
```

### Fichiers créés (7 fichiers)

#### TrainerOnboardingFlow.tsx
- Orchestrateur principal du flow en 6 étapes
- Gestion de l'état du formulaire (organizationName, logoUrl, description, street, cityZip, canton)
- Upload logo vers Supabase Storage
- Sauvegarde finale dans `profiles` + `trainer_profiles`
- Redirection vers `/trainer-profile` après completion

#### TrainerWelcome.tsx (Étape 1)
- Écran de bienvenue avec icône GraduationCap
- Message d'accueil pour l'organisation
- Bouton "COMMENCER"

#### TrainerOrganization.tsx (Étape 2)
- Saisie du nom de l'organisation (OBLIGATOIRE)
- Validation: minimum 2 caractères
- Input avec placeholder "Ex: École de Natation Suisse"

#### TrainerLogo.tsx (Étape 3)
- Upload du logo (optionnel)
- Preview avec fallback initiale organisation
- Zone drag & drop avec hover effect

#### TrainerDescription.tsx (Étape 4)
- Textarea pour description de l'organisme
- Compteur de caractères
- Validation: minimum 10 caractères si rempli
- Bouton "Passer cette étape" disponible

#### TrainerLocation.tsx (Étape 5)
- Select canton (liste CANTONS_SUISSES)
- Input NPA/Ville (optionnel)
- Input Adresse (optionnel)
- Bouton "Passer cette étape" disponible

#### TrainerComplete.tsx (Étape 6)
- Écran de félicitations
- Affichage du nom de l'organisation
- Liste des prochaines étapes (Publiez vos formations, Gérez vos inscriptions, etc.)
- Bouton "DÉCOUVRIR MON PROFIL"

### Fichier modifié

#### OnboardingWizard.tsx
```tsx
// AVANT
import { TrainerOnboarding } from "./TrainerOnboarding";
// ...
case 'formateur':
  return <TrainerOnboarding ... />;

// APRÈS
import { TrainerOnboardingFlow } from "./TrainerOnboardingFlow";
// ...
if (profileType === 'formateur') {
  return <TrainerOnboardingFlow />;
}
```

### Base de données

**Tables impactées:**
- `profiles` - Mise à jour: `onboarding_completed = true`, `avatar_url`, `street`, `city_zip`, `canton`
- `trainer_profiles` - Upsert: `id`, `organization_name`, `avatar_url`, `description`, `street`, `city_zip`, `canton`

**Champs obligatoires:**
- `organization_name` (string, NOT NULL dans trainer_profiles)

### Flux complet formateur

1. Utilisateur s'inscrit → Sélectionne "Formateur"
2. Voit liste des organismes (depuis `sss_formations_cache`)
3. Sélectionne son organisme + entre email
4. Demande créée dans `account_claim_requests` (status: pending)
5. Admin valide et crée le compte manuellement
6. Admin envoie identifiants par mail
7. Formateur se connecte
8. `ProfileRouter` détecte `onboarding_completed = false`
9. Redirection vers `/onboarding`
10. `OnboardingWizard` détecte `profileType = 'formateur'`
11. Affiche `TrainerOnboardingFlow` (6 étapes)
12. Après completion → `onboarding_completed = true`
13. Redirection vers `/trainer-profile`

---

## Résumé des modifications

| Type | Fichiers créés | Fichiers modifiés |
|------|----------------|-------------------|
| Boutons retour | 0 | 5 |
| Headers | 0 | 4 |
| Orthographe | 0 | 9 |
| Onboarding formateur | 7 | 1 |
| **Total** | **7** | **19** |

---

## Tests effectués

- [x] Build Vite réussi sans erreurs
- [x] Vérification routes `/trainer-profile` existantes
- [x] Vérification `ProfileRouter` redirect correct
- [x] Vérification schema `trainer_profiles` compatible

---

## Prochaines étapes recommandées

1. Test manuel complet du flow formateur avec un nouveau compte
2. Vérifier emails de réclamation envoyés par admin
3. Tester upload logo sur différents navigateurs
4. Valider l'affichage mobile de l'onboarding

---

## Déploiement

**Commit:** `4d9b8f3`
**Branche:** `main`
**Push GitHub:** ✅ Complété le 26/01/2026

```bash
git push origin main
# ad8b597..4d9b8f3  main -> main
```

---

## Documents BMAD mis à jour

| Document | Modifications |
|----------|---------------|
| `changelog-2026-01-26.md` | Créé - Documentation complète des changements |
| `architecture.md` | Mis à jour - Structure onboarding détaillée |
| `prd.md` | Mis à jour - Parcours formateur + FRs onboarding |
| `bmm-workflow-status.yaml` | Mis à jour - Log d'implémentation 26/01/2026 |

---

## Session BMAD Party Mode (Session 1)

**Participants virtuels:**
- Amelia (Dev) - Implémentation des composants React
- Winston (Architect) - Validation architecture modulaire
- John (PM) - Suivi de la livraison

**Durée:** Session complète
**Résultat:** ✅ Feature livrée et documentée

---

# Session 2 - Landing Page & Pages Légales

## Vue d'ensemble

Session de développement focalisée sur les améliorations de la landing page et la création des pages légales (CGU et Politique de confidentialité).

---

## 5. Correction des logos Landing Page

### Contexte
Le logo dans le footer et header de la landing page n'était pas le bon. Remplacement par le logo officiel "PROBAIN AQUATIC NETWORK".

### Fichier corrigé
- **Logo utilisé:** `32069037-2f3a-44ac-9105-33ae1d029573.png`
- **Emplacement:** `/lovable-uploads/32069037-2f3a-44ac-9105-33ae1d029573.png`

### Modifications dans Index.tsx

**Header (ligne 219):**
```tsx
<motion.img
  src="/lovable-uploads/32069037-2f3a-44ac-9105-33ae1d029573.png"
  alt="Probain Aquatic Network Logo"
  className="w-48 sm:w-64 lg:w-96 h-auto mx-auto mb-6 sm:mb-8 relative"
/>
```

**Footer (ligne 468):**
```tsx
<motion.img
  src="/lovable-uploads/32069037-2f3a-44ac-9105-33ae1d029573.png"
  alt="Probain Aquatic Network Logo"
  className="w-40 h-auto"
/>
```

### Commits
- `6550b81` - fix: correct footer logo
- `54bcab1` - fix: same logo in header and footer

---

## 6. Mise à jour réseaux sociaux Footer

### Contexte
Remplacement du lien LinkedIn par Instagram dans la section "Suivez-nous" du footer.

### Modifications
- **Suppression:** Icône LinkedIn
- **Conservation:** Icône Instagram uniquement
- **Nouveau lien:** `https://instagram.com/probain.ch?utm_source=qr&igsh=MWZ2Z3ZxaW5tOGYxZA==`

### Code
```tsx
<motion.a
  href="https://instagram.com/probain.ch?utm_source=qr&igsh=MWZ2Z3ZxaW5tOGYxZA=="
  target="_blank"
  rel="noopener noreferrer"
  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
>
  <Instagram className="h-5 w-5 text-white" />
</motion.a>
```

### Icône
- **Avant:** Font Awesome (`<i className="fab fa-instagram">`)
- **Après:** Lucide React (`<Instagram className="h-5 w-5 text-white" />`)

### Commits
- `bf2e842` - fix: footer Instagram only with correct link
- `befbab6` - fix: use Lucide React Instagram icon in footer

---

## 7. Pages légales (CGU et Politique de confidentialité)

### Contexte
Création des pages légales conformes au droit suisse (LPD) avec liens dans le footer de la landing page.

### Fichiers créés

#### src/pages/TermsOfUse.tsx
- **Route:** `/terms`
- **Titre:** CONDITIONS D'UTILISATION
- **Sections:** 10 sections (Objet, Définitions, Accès, Création compte, Visibilité profils, Utilisation, Responsabilités, Propriété intellectuelle, Suspension, Droit applicable)
- **Design:** Gradient primary, card blanche, retour accueil

#### src/pages/PrivacyPolicy.tsx
- **Route:** `/privacy`
- **Titre:** POLITIQUE DE CONFIDENTIALITÉ
- **Cadre légal:** LPD (Loi fédérale sur la protection des données - Suisse)
- **Sections:** 11 sections (Responsable traitement, Cadre légal, Données collectées, Finalité, Accès données, Hébergement, Durée conservation, Droits utilisateurs, Cookies, Modifications, Contact)
- **Contact:** contact@probain.ch

### Modifications App.tsx
```tsx
// Imports
const TermsOfUse = lazy(() => import("@/pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));

// Routes
<Route path="/terms" element={<TermsOfUse />} />
<Route path="/privacy" element={<PrivacyPolicy />} />
```

### Modifications Index.tsx (Footer)
```tsx
<Link to="/privacy" className="text-white/50 hover:text-white text-sm transition-colors">
  Politique de confidentialité
</Link>
<Link to="/terms" className="text-white/50 hover:text-white text-sm transition-colors">
  Conditions d'utilisation
</Link>
```

### Commit
- `b3afd7b` - feat: pages CGU et politique de confidentialité avec liens footer

---

## 8. Fix scroll-to-top pages légales

### Contexte
Lors de la navigation vers les pages légales depuis le footer, la page s'affichait en bas au lieu du haut.

### Solution
Ajout d'un `useEffect` avec `window.scrollTo(0, 0)` dans les deux composants.

### Code ajouté
```tsx
import { useEffect } from "react";

const TermsOfUse = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  // ...
};
```

### Fichiers modifiés
- `src/pages/TermsOfUse.tsx`
- `src/pages/PrivacyPolicy.tsx`

---

## Résumé Session 2

| Type | Fichiers créés | Fichiers modifiés |
|------|----------------|-------------------|
| Logos | 0 | 1 (Index.tsx) |
| Réseaux sociaux | 0 | 1 (Index.tsx) |
| Pages légales | 2 | 1 (App.tsx) |
| Footer links | 0 | 1 (Index.tsx) |
| Scroll fix | 0 | 2 |
| **Total** | **2** | **4** |

---

## Commits Session 2

| Hash | Message |
|------|---------|
| `6550b81` | fix: correct footer logo |
| `54bcab1` | fix: same logo in header and footer |
| `bf2e842` | fix: footer Instagram only with correct link |
| `b3afd7b` | feat: pages CGU et politique de confidentialité |
| `befbab6` | fix: use Lucide React Instagram icon in footer |

---

## Déploiement Final

**Branche:** `main`
**Push GitHub:** ✅ Complété le 26/01/2026

---

## Récapitulatif journée complète (26/01/2026)

### Session 1 - Onboarding Formateur
- Onboarding formateur modulaire (6 étapes)
- Suppression boutons retour
- Amélioration headers
- Correction orthographe Probain

### Session 2 - Landing Page & Légal
- Logos landing page corrigés
- Instagram unique dans footer
- Pages CGU et Politique de confidentialité
- Fix scroll-to-top

**Total journée:**
- **9 fichiers créés**
- **23+ fichiers modifiés**
- **8 commits pushés**
