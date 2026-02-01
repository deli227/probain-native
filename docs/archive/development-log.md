# Journal de Developpement - Pro Bain Native

> Historique consolide des sessions de developpement et decisions techniques.
> Derniere mise a jour : 29 janvier 2026 (soir)

---

## Sessions

### 28 Janvier 2026 - Despia Native + UI Formulaires

**Objectifs realises :**
- Navigation mobile native (BottomTabBar, MobileHeader, DashboardLayout)
- Haptic feedback sur les boutons (`src/lib/native.ts`)
- Safe areas iOS (env() CSS)
- Dark theme pour les pages AddExperience et AddFormation (orbes, glassmorphism)
- CalendarModal partage (composant calendrier interactif francais)
- Dark mode support pour tous les formulaires (prop `darkMode`)
- Deploiement Vercel staging : `https://pro-bain-native-test.vercel.app`

**Commit :** `492de14` - feat: Redesign profile edit page with dark theme and new features

---

### 29 Janvier 2026 (Matin) - Corrections UI + Notifications recyclage

**Bugs corriges :**
- Calendrier : dates invisibles dans l'onglet Formation (heritage CSS `text-white` → fix: `text-gray-900` force)
- PDF : non fonctionnel sur mobile (popup blocker → fix: `window.open()` dans onClick direct)
- Toast ferme le Sheet (Radix Dialog focus management → fix: suppression du toast succes)

**Nouvelle fonctionnalite :**
- Toggle notifications recyclage dans "Modifier le profil" > Notifications
- Architecture : `notification_preferences.notify_recycling` → hook → UI → popup conditionnel

**Commit :** `ea529a9` - feat: Calendar unification, overlay forms, PDF mobile fix, recycling notification toggle

---

### 29 Janvier 2026 (Apres-midi) - Profil formateur + Messagerie

**Refonte profil formateur :**
- Dark theme complet pour TrainerProfileForm
- Nom organisation verrouille apres onboarding (disabled + cadenas)
- Champ description ajoute
- SheetContent dark theme (`bg-[#0a1628]`)

**Messagerie :**
- Fix messages envoyes invisibles (invalidation cache TanStack Query apres envoi)
- Fix frappe lettre par lettre (extraction composants hors du parent Mailbox)
- Redesign dark theme complet

**Eleves formateur :**
- Formations externes du sauveteur visibles (table `formations` en plus de `trainer_students`)
- Fix statut recyclage (utilise `end_date` comme reference)
- Telephone cliquable, avatars avec initiales, retrait certification des cartes

**Commit :** `282d534` - feat: Trainer profile redesign, messaging fixes, student cards improvements

---

### 29 Janvier 2026 (Soir) - Stabilite PWA

**5 causes de crash au resume identifiees et corrigees :**

1. **Chunks lazy-loaded invalides** → `lazyRetry()` avec retry + auto-reload (`src/utils/lazyRetry.ts`)
2. **Effet auth instable** → `useRef` pour lire la valeur sans re-souscrire au listener
3. **refreshSession sur session expiree** → `signOut()` propre si token invalide
4. **ErrorBoundary sans auto-recovery** → prop `resetKey` liee a `location.pathname`
5. **DashboardLayout demonte pendant transitions** → debounce asymetrique (instant ON, 300ms OFF)

**Fix notification flash :**
- Gate du badge avec `isNotificationsReady` (attend le chargement de toutes les sources)
- `notifyRecycling` default `false` pendant le chargement (pas `true`)

**Fix email verification :**
- Skip du dialog "Verifiez votre email" si `email_confirmed_at` existe deja

**Commit :** `fcdd8b1` - fix: Crash on app resume, notification flash, email verification skip

---

### 29 Janvier 2026 (Nuit) - Nettoyage projet + Refactoring TrainerStudents

**Nettoyage du projet :**
- Suppression duplicate `NotificationsPopup.tsx` (racine, au profit de `shared/`)
- Suppression `types.ts.new` (backup obsolete)
- Suppression dossiers vides (`blocks/`, `__tests__/`, `test/mocks/`)
- Deplacement `Navbar.tsx` → `navbar/Navbar.tsx`, `ErrorBoundary.tsx` → `shared/ErrorBoundary.tsx`
- Fusion 3 fichiers SESSION-*.md → `docs/development-log.md`
- Deplacement `DESPIA.md` → `docs/despia.md`, `netlify.toml` → `docs/config/netlify.toml`
- Suppression fichiers obsoletes (`nul`, `bun.lockb`, `index.md`, scan reports)
- Enrichissement `CLAUDE.md` avec architecture complete, hooks, composants, patterns

**Refactoring TrainerStudents.tsx (1046 lignes → 14 fichiers) :**
- Decoupe incrementale en 12 etapes avec build verifie a chaque etape
- Extraction types + helper → `trainer-students/types.ts`
- Extraction 9 composants feuilles → `trainer-students/*.tsx`
- Extraction logique state/fetch → `hooks/use-trainer-students.ts` (303 lignes)
- Orchestrateur JSX → `trainer-students/TrainerStudentsPage.tsx` (218 lignes)
- Re-export dans `TrainerStudents.tsx` (2 lignes) — zero modification dans App.tsx
- Audit complet des dependances inter-comptes : aucun impact sur SendMessageDialog, use-formations, TrainerProfile, admin-operations, RLS policies, notifications
- 0 erreurs de build, 0 fichiers externes modifies

**Note structure :** 7.5/10 globale, priorite #1 etait le decoupe des gros composants (TrainerStudents 40KB, Training 36KB, AuthForm 35KB, Index 32KB)

---

## Concepts Techniques Cles

### Heritage CSS vs Position Fixed
Le `position: fixed` sort l'element du flux visuel mais PAS de l'arbre DOM. Les proprietes CSS heritees (`color`, `font-family`) suivent l'arbre DOM.

### Popup Blocker Mobile
Les navigateurs mobiles bloquent `window.open()` si l'appel n'est pas dans la pile d'appels directe d'un evenement utilisateur. `useEffect`, `setTimeout`, `Promise.then()` ne sont pas des gestes utilisateurs.

### Radix Dialog Focus Management
Le Sheet (Radix Dialog) ferme quand le focus quitte le dialog. Les Toast creent des portails DOM en dehors, ce qui declenche `onFocusOutside`.

### Regles des Hooks React
Les hooks doivent etre appeles dans le meme ordre a chaque render. Un `return` conditionnel avant des hooks cause "Rendered more hooks than during the previous render".

### Pattern useRef pour deps stables
Pour eviter de re-souscrire a un listener a chaque changement de state, utiliser un `useRef` et le lire dans le callback avec deps `[]`.

### Debounce asymetrique
Passer a `true` immediatement mais retarder le passage a `false` (300ms) evite les demontages transitoires pour les etats dependant de donnees async.

### Vite Chunk Hash Invalidation
Apres deploiement, les hash changent. Les utilisateurs PWA en cache ont les anciens hash. Solution : `lazyRetry()` avec retry + auto-reload unique.

### SECURITY DEFINER vs INVOKER (PostgreSQL)
Les fonctions SECURITY DEFINER contournent les politiques RLS. Utile quand une politique referencerait sa propre table (recursion infinie).

### Formations vs Trainer_Students
Deux sources distinctes : `trainer_students` (relation formateur-eleve) et `formations` (certifications auto-declarees par le sauveteur).

---

## Z-Index Hierarchy

| Composant | Z-Index |
|-----------|---------|
| CalendarModal overlay | `z-[100]` |
| Bottom Tab Bar | `z-[60]` |
| FAB bouton message | `z-[55]` |
| Sheet overlay | `z-50` |
| Sheet header | `z-20` |

---

## Dark Mode Pattern

```
Background page : #0a1628
Orbes : bg-blue-500/20, bg-cyan-500/15, bg-violet-500/10 (blur-3xl, animated)
Card : backdrop-blur-xl bg-white/10 border-white/10
Input : bg-white/10 border-white/20 text-white placeholder:text-white/40
Label : text-white/70
Focus : ring-cyan-400/30 border-cyan-400/50
Bouton save : from-cyan-500 to-blue-600
```

---

## Deploiement

| Environnement | URL | Methode |
|---------------|-----|---------|
| **Production native** | https://pro-bain-native-test.vercel.app | Vercel CLI (`npx vercel --prod`) |
| **Production web** | probain.ch | Netlify (autre repo) |

---

## Configuration Despia Native

| Parametre | Valeur |
|-----------|--------|
| Bundle ID | `com.despia.probain` |
| URL cible | https://pro-bain-native-test.vercel.app |
| Fonctionnalites | Haptics, Share, Biometrics (via `src/lib/native.ts`) |
