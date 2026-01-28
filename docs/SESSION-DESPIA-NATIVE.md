# Session Despia Native - Documentation

**Date:** 28 janvier 2026
**Objectif:** Optimisation native pour déploiement iOS/Android via Despia

---

## Résumé des Modifications

### 1. Navigation Mobile - Bottom Tab Bar

**Fichier:** `src/components/navigation/BottomTabBar.tsx`

- Création d'une barre de navigation fixe en bas de l'écran (style app native)
- 5 onglets selon le type de profil (maitre_nageur, formateur, etablissement)
- Badges de notification sur les onglets
- Haptic feedback sur changement d'onglet
- Support des safe areas iOS (notch)
- Hauteur: 76px avec padding-top pour espacement des icônes

```typescript
// Configuration par type de profil
case 'maitre_nageur':
  return [
    { path: '/profile', icon: User, label: 'Profil' },
    { path: '/jobs', icon: Briefcase, label: 'Emplois', badgeCount },
    { path: '/training', icon: GraduationCap, label: 'Formations', badgeCount },
    { path: '/rescuer/mail', icon: Mail, label: 'Messages', badgeCount },
    { path: '/flux', icon: Newspaper, label: 'Flux', badgeCount },
  ];
```

### 2. Header Mobile

**Fichier:** `src/components/navigation/MobileHeader.tsx`

- Header sticky avec logo Pro Bain
- Menu paramètres (Popover) avec:
  - Modifier mon profil
  - Se déconnecter
- Popup de notifications selon le type de profil
- Hauteur: 56px (h-14)

### 3. Dashboard Layout

**Fichier:** `src/layouts/DashboardLayout.tsx`

- Layout responsive avec:
  - Mobile: Bottom Tab Bar + contenu avec pb-20
  - Desktop: Sidebar fixe à gauche (256px)
- Background `bg-blue-50` pour uniformité

```typescript
export const DashboardLayout = ({ children, profileType }) => {
  return (
    <div className="min-h-screen bg-blue-50">
      <Sidebar profileType={profileType} />
      <div className="pb-20 md:pb-0 md:pl-64">
        {children}
      </div>
      <BottomTabBar profileType={profileType} />
    </div>
  );
};
```

### 4. Haptic Feedback sur Boutons

**Fichier:** `src/components/ui/button.tsx`

- Import de `hapticFeedback` depuis `@/lib/native`
- Ajout de la prop `noHaptic` pour désactiver si nécessaire
- Haptic feedback "light" sur chaque clic de bouton

```typescript
const handleClick = React.useCallback(
  (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!noHaptic) {
      hapticFeedback('light')
    }
    onClick?.(e)
  },
  [onClick, noHaptic]
)
```

### 5. CSS - Styles Natifs

**Fichier:** `src/index.css`

#### Safe Area Variables
```css
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}
```

#### Accessibilité - Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

#### Safe Area Utilities
```css
.safe-top { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-left { padding-left: env(safe-area-inset-left); }
.safe-right { padding-right: env(safe-area-inset-right); }
.safe-x { /* left + right */ }
.safe-y { /* top + bottom */ }
```

#### Bottom Tab Bar Gap Fix
```css
.bottom-tab-bar-fix {
  box-shadow: 0 -20px 0 0 hsl(222.2 47.4% 11.2%);
}
```

### 6. Déploiement Vercel (Staging)

**URL:** https://pro-bain-native-test.vercel.app

**Fichier créé:** `vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Variables d'environnement ajoutées sur Vercel:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Fichiers Modifiés

| Fichier | Modification |
|---------|--------------|
| `src/components/navigation/BottomTabBar.tsx` | Création - Navigation mobile |
| `src/components/navigation/MobileHeader.tsx` | Création - Header mobile avec déconnexion |
| `src/layouts/DashboardLayout.tsx` | Ajout bg-blue-50, intégration BottomTabBar |
| `src/components/ui/button.tsx` | Haptic feedback intégré |
| `src/index.css` | Safe areas, reduced motion, gap fix |
| `src/App.tsx` | Intégration DashboardLayout |
| `vercel.json` | Configuration SPA routing |

---

## Configuration Despia

**Bundle ID:** `com.despia.probain`

**Apple Developer (configuré):**
- Issuer ID
- Key ID
- Team ID
- Fichier P8

**URL de test pour Despia:** https://pro-bain-native-test.vercel.app

---

## Prochaines Étapes

1. [ ] Tester le build Despia avec l'URL staging
2. [ ] Déployer sur TestFlight (iOS)
3. [ ] Intégration OneSignal (push notifications) - reporté
4. [ ] Tests sur appareils réels
5. [ ] Soumission App Store / Google Play

---

## Notes Techniques

- Le fichier `src/lib/native.ts` contient les wrappers pour les fonctionnalités natives (haptics, share, biometrics)
- Les fonctions natives ont des fallbacks web automatiques
- La production (probain.ch) reste sur l'ancienne version web
- Le staging (pro-bain-native-test.vercel.app) contient la version native optimisée
