# DESPIA.md - Framework Despia Native

> Documentation Despia pour transformer l'application web Pro Bain en application native iOS/Android
> Ce fichier doit etre lu avant toute intervention sur l'application

---

## Vue d'Ensemble

**Despia** est un framework permettant de convertir des applications web en applications natives iOS et Android. Il offre 30+ fonctionnalites natives accessibles via un SDK JavaScript unifie.

| Info | Valeur |
|------|--------|
| **Package** | `npm install despia-native` |
| **Import** | `import despia from 'despia-native'` |
| **Detection** | `navigator.userAgent.includes('despia')` |
| **Doc** | https://setup.despia.com |
| **Support** | support@despia.com |

---

## Detection d'Environnement

**IMPORTANT**: Toujours verifier si l'app tourne dans Despia avant d'utiliser les fonctionnalites natives.

```typescript
// Detection de base
const isDespia = navigator.userAgent.toLowerCase().includes('despia');

// Detection par plateforme
const isDespiaIOS = isDespia &&
  (navigator.userAgent.toLowerCase().includes('iphone') ||
   navigator.userAgent.toLowerCase().includes('ipad'));

const isDespiaAndroid = isDespia &&
  navigator.userAgent.toLowerCase().includes('android');

// Exemple d'utilisation avec fallback
if (isDespia) {
  // Utiliser la fonctionnalite native
  await despia('haptics', { type: 'success' });
} else {
  // Fallback web ou ne rien faire
}
```

---

## Fonctionnalites Natives

### Retours Haptiques

5 types de vibrations disponibles:

```typescript
// Types: 'light' | 'heavy' | 'success' | 'warning' | 'error'
await despia('haptics', { type: 'success' });
await despia('haptics', { type: 'light' });
await despia('haptics', { type: 'warning' });
await despia('haptics', { type: 'error' });
await despia('haptics', { type: 'heavy' });
```

### Informations Appareil

```typescript
// Version de l'application
const version = await despia('device', { get: 'version' });

// Numero de bundle
const bundle = await despia('device', { get: 'bundle' });

// ID unique de l'appareil
const deviceId = await despia('device', { get: 'id' });
```

### Controles d'Interface

```typescript
// Afficher/masquer spinner de chargement
await despia('ui', { loading: true });
await despia('ui', { loading: false });

// Mode plein ecran
await despia('ui', { fullscreen: true });

// Controle de la barre de statut
await despia('ui', { statusBar: 'hidden' });
await despia('ui', { statusBar: 'visible' });
```

### Authentification Biometrique

Face ID, Touch ID et reconnaissance d'empreinte:

```typescript
const result = await despia('biometrics', {
  action: 'authenticate',
  reason: 'Veuillez vous authentifier'
});

if (result.success) {
  // Authentification reussie
}
```

### Presse-papiers

```typescript
// Copier du texte
await despia('clipboard', { copy: 'Texte a copier' });

// Lire le presse-papiers
const text = await despia('clipboard', { paste: true });
```

### Partage Natif

```typescript
await despia('share', {
  title: 'Pro Bain Connect',
  text: 'Decouvrez cette offre!',
  url: 'https://probain.ch/jobs/123'
});
```

### Contacts

```typescript
// Demander permission
const permission = await despia('contacts', { requestPermission: true });

// Lire les contacts apres permission accordee
if (permission.granted) {
  const contacts = await despia('contacts', { read: true });
}
```

### GPS/Localisation

```typescript
// Obtenir la position
const location = await despia('location', { get: 'current' });

// Localisation en arriere-plan
await despia('location', { background: true });
```

---

## Notifications Push (OneSignal)

### Configuration

```typescript
// Initialisation
await despia('push', {
  action: 'initialize',
  appId: 'YOUR_ONESIGNAL_APP_ID'
});

// Demander permission
await despia('push', { action: 'requestPermission' });

// Definir l'ID utilisateur pour ciblage
await despia('push', {
  action: 'setExternalUserId',
  userId: 'user_123'
});
```

### Gestion de Session Utilisateur

**Resolution d'identite (priorite):**
1. Storage Vault (synchronise iCloud/Android Backup)
2. Historique d'achats RecoveryId
3. Install ID (fallback)

**A l'ouverture de l'app:**
1. Verifier Storage Vault pour `app_user_id`
2. Si trouve, synchroniser avec OneSignal
3. Si non trouve, generer un nouvel ID

---

## Achats Integres (RevenueCat)

### Configuration

```typescript
// Initialisation
await despia('purchases', {
  action: 'configure',
  apiKey: 'YOUR_REVENUECAT_API_KEY'
});

// Definir l'ID utilisateur
await despia('purchases', {
  action: 'login',
  userId: 'user_123'
});
```

### Achats

```typescript
// Acheter un produit
const purchase = await despia('purchases', {
  action: 'purchase',
  productId: 'premium_monthly'
});

// Restaurer les achats
const restored = await despia('purchases', { action: 'restore' });

// Verifier un entitlement
const status = await despia('purchases', {
  action: 'checkEntitlement',
  entitlementId: 'premium'
});
```

### Securite Paywall

**IMPORTANT**: Attendre que l'identite soit resolue ET la base de donnees synchronisee avant d'ouvrir le paywall.

```typescript
// Mauvaise pratique - NE PAS FAIRE
openPaywall(); // L'utilisateur peut ne pas etre identifie

// Bonne pratique
if (identityResolved && dbSynced) {
  openPaywall();
}
```

---

## Storage Vault (Stockage Securise)

Stockage synchronise via iCloud (iOS) et Android Backup. Survit a la desinstallation.

```typescript
// Sauvegarder une valeur
await despia('vault', {
  action: 'set',
  key: 'auth_token',
  value: 'token_value'
});

// Recuperer une valeur
const token = await despia('vault', {
  action: 'get',
  key: 'auth_token'
});

// Supprimer une valeur
await despia('vault', {
  action: 'remove',
  key: 'auth_token'
});

// Avec authentification biometrique
await despia('vault', {
  action: 'get',
  key: 'sensitive_data',
  biometrics: true
});
```

### Comparaison des Stockages

| Stockage | Survit desinstall | Synchronise cloud | Biometrique |
|----------|-------------------|-------------------|-------------|
| Cookies | Non | Non | Non |
| localStorage | Non | Non | Non |
| Storage Vault | **Oui** | **Oui** | **Oui** |

---

## Support Hors Ligne (@despia/local)

Plugin de build pour cache local et OTA:

```bash
npm install @despia/local
```

Cree un manifeste `/despia/local.json` pour:
- Cache des assets localement
- Servir depuis `https://localhost` sur l'appareil
- Mises a jour OTA sans revision App Store

---

## Version Guard

Afficher conditionnellement des fonctionnalites selon la version du runtime:

```bash
npm install despia-version-guard
```

```typescript
import { VersionGuard } from 'despia-version-guard';

// Afficher seulement si version >= 3.5
<VersionGuard minVersion="3.5">
  <NewFeatureComponent />
</VersionGuard>
```

---

## Safe Areas CSS

Variables CSS pour gerer les zones securisees (notch, barre de navigation):

```css
.container {
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
  padding-left: var(--safe-area-left);
  padding-right: var(--safe-area-right);
}
```

---

## Bonnes Pratiques Performance

### Cibles

| Metrique | Cible |
|----------|-------|
| FCP | < 1.5s |
| Bundle | < 300kb |
| Frame rate normal | 60fps |
| Frame rate contraint | ~30fps |

### JavaScript

- **Diviser les calculs lourds** en chunks avec `requestAnimationFrame`
- **Debounce** les evenements haute frequence (scroll, resize, input)
- **Nettoyer** les listeners et timers au demontage des composants
- **Listeners passifs** quand `preventDefault()` n'est pas appele

### CSS

- **Animer uniquement** `transform` et `opacity` (GPU-accelere)
- **Eviter d'animer** width, height, top, left, margin, padding
- **Utiliser `will-change`** avec parcimonie, seulement sur animations actives
- **Durees recommandees:**
  - Actions utilisateur: 0.15s - 0.25s
  - Transitions UI: 0.3s - 0.4s
  - Grands mouvements: 0.4s - 0.6s

### DOM

- **Mettre en cache** les requetes DOM
- **DocumentFragment** pour insertions multiples
- **Virtual scrolling** pour listes 100+ elements (recommande: TanStack Virtual)

### Images

- **Lazy loading** avec Intersection Observer
- **Formats:** JPEG (photos), PNG (transparence), WebP (moderne)
- **Dimensions:** servir aux dimensions d'affichage

### Accessibilite

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Problemes Courants et Solutions

### Perte de Session/Tokens

**Causes:**
- Cookies sans expiration
- localStorage efface
- Validation serveur echoue hors ligne
- Redirection manquante pour utilisateurs connectes

**Solutions:**

1. **Redirection auth:**
```typescript
useEffect(() => {
  if (existingToken) {
    navigate('/dashboard');
  }
}, []);
```

2. **Cookies avec expiration:**
```typescript
document.cookie = `token=${value}; expires=${date}; path=/; SameSite=Strict`;
```

3. **Stockage hybride recommande:**
   - localStorage (universel)
   - Storage Vault (apps natives, survit desinstall)
   - Combinaison des deux

4. **Refresh tokens** avant expiration, pas apres

### Debugging Apps Natives

Pas de `console.log()` visible. Utiliser une zone de texte a l'ecran:

```typescript
const [debug, setDebug] = useState('');

// Ajouter des infos de debug
setDebug(prev => prev + '\nToken: ' + token);

// Afficher dans l'UI
<textarea value={debug} readOnly style={{ userSelect: 'text' }} />
```

### HealthKit

Si erreur "Provisioning profile doesn't include HealthKit":
1. Portail Apple Developer → Identifiants
2. Localiser votre bundle ID
3. Activer HealthKit dans les capacites
4. Sauvegarder et relancer la compilation

---

## Rejections App Store Courantes

| Raison | Solution |
|--------|----------|
| Processing IA non divulgue | Ajouter mention dans description |
| Ecran vide | Verifier chargement initial, gerer erreurs |
| Paywall trompeur | Afficher prix clairement, bouton fermer visible |
| Achats integres | Utiliser RevenueCat, pas Stripe |
| Design | Suivre Human Interface Guidelines |
| Privacy Policy | Lien visible, RGPD conforme |
| Social login | Proposer "Sign in with Apple" si autres OAuth |
| App Tracking | Demander permission ATT si tracking |

---

## Integration avec React (Lovable)

```typescript
import despia from 'despia-native';

function MyComponent() {
  const isDespia = navigator.userAgent.includes('despia');

  const handlePayment = async () => {
    if (isDespia) {
      // Achat natif via RevenueCat
      await despia('purchases', { action: 'purchase', productId: 'premium' });
    } else {
      // Fallback Stripe pour web
      await stripeCheckout();
    }
  };

  return (
    <button onClick={handlePayment}>
      Acheter Premium
    </button>
  );
}
```

---

## Deploiement

### iOS
- Automatique via editeur Despia avec gestion certificats
- Manuel: export projet Xcode

### Android
- Automatique via editeur Despia
- Manuel: export projet Android Studio

### Mises a jour OTA
Avec `@despia/local`, les mises a jour de code web sont deployees sans revision App Store.

---

## Frameworks Supportes

React, Vue, Angular, Svelte, Next.js, Nuxt, et outils IA comme Lovable et Bolt.

---

*Pour les regles specifiques a Pro Bain, voir `CLAUDE.md`*
*Pour le contexte projet, voir `project-context.md`*
