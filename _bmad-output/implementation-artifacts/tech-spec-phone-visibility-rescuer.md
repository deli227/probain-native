---
title: 'Téléphone visible sur profil sauveteur'
slug: 'phone-visibility-rescuer'
created: '2026-01-25'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 18', 'Supabase', 'TailwindCSS', 'React Hook Form', 'Zod', 'TanStack Query']
files_to_modify: ['supabase/migrations/20260125300000_add_phone_visibility.sql', 'src/components/profile/ProfileForm.tsx', 'src/components/profile/forms/PersonalInfoForm.tsx', 'src/components/profile/RescuerProfileHeader.tsx', 'src/pages/EstablishmentRescuers.tsx']
code_patterns: ['FormField/FormItem/FormLabel pattern', 'Switch component for toggles', 'supabase.from().update().eq() pattern']
test_patterns: []
---

# Tech-Spec: Téléphone visible sur profil sauveteur

**Created:** 2026-01-25

## Overview

### Problem Statement

Les établissements n'ont aucun moyen de contacter directement les sauveteurs pour des missions ou offres d'emploi. Le sauveteur n'a pas de contrôle sur la visibilité de ses coordonnées téléphoniques.

### Solution

Ajouter un champ téléphone avec toggle de visibilité dans le profil sauveteur. Quand le toggle est activé, seuls les établissements peuvent voir le numéro de téléphone.

Message explicatif affiché au sauveteur: "En rendant votre numéro visible, les établissements peuvent vous contacter directement pour des missions ou offres d'emploi"

### Scope

**In Scope:**
- Champ `phone` dans table `profiles`
- Champ `phone_visible` (boolean) dans table `rescuer_profiles`
- Toggle ON/OFF dans `ProfileForm`
- Message explicatif pour encourager l'activation
- Affichage conditionnel du téléphone côté établissement (quand ils consultent un profil sauveteur)

**Out of Scope:**
- Téléphone pour formateurs
- Notifications SMS
- Validation avancée du format téléphone

## Context for Development

### Codebase Patterns

**Form Fields Pattern (PersonalInfoForm.tsx):**
```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem className="space-y-2">
      <FormLabel className="text-primary font-semibold">Label</FormLabel>
      <FormControl>
        <Input {...field} className="bg-white focus:ring-primary" />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Switch Toggle Pattern (Settings.tsx):**
```tsx
<Switch
  checked={value}
  onCheckedChange={(checked) => handleChange(checked)}
/>
```

**Supabase Update Pattern (ProfileForm.tsx):**
```tsx
const { error } = await supabase
  .from('profiles')
  .update({ field: value })
  .eq('id', user.id);
```

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/components/profile/ProfileForm.tsx` | Formulaire principal - ajouter phone + toggle |
| `src/components/profile/forms/PersonalInfoForm.tsx` | Sous-formulaire - ajouter champ phone |
| `src/components/ui/switch.tsx` | Composant Switch existant |
| `src/pages/Settings.tsx` | Exemple d'utilisation du Switch |
| `src/components/profile/RescuerProfileHeader.tsx` | Header profil - afficher phone si visible |
| `src/pages/EstablishmentRescuers.tsx` | Liste sauveteurs vue établissement |
| `src/contexts/ProfileContext.tsx` | Contexte profil - accès à profileType |
| `supabase/migrations/20260126000000_add_flux_avatar.sql` | Exemple migration SQL |

### Technical Decisions

1. **Stockage `phone`:** Dans table `profiles` (réutilisable pour autres types)
2. **Stockage `phone_visible`:** Dans table `rescuer_profiles` (spécifique sauveteurs)
3. **Visibilité:** Vérifier `profileType === 'etablissement'` avant d'afficher
4. **Toggle:** Utiliser le composant `Switch` existant
5. **Format migration:** `YYYYMMDDHHMMSS_description.sql`

## Implementation Plan

### Tasks

- [ ] **Task 1: Migration SQL - Ajouter les colonnes**
  - File: `pro-bain-app/supabase/migrations/20260125300000_add_phone_visibility.sql`
  - Action: Créer migration avec:
    - `ALTER TABLE profiles ADD COLUMN phone TEXT;`
    - `ALTER TABLE rescuer_profiles ADD COLUMN phone_visible BOOLEAN DEFAULT false;`
  - Notes: Pas de RLS nécessaire, les colonnes héritent des policies existantes

- [ ] **Task 2: Mettre à jour le schema Zod dans ProfileForm**
  - File: `pro-bain-app/src/components/profile/ProfileForm.tsx`
  - Action:
    - Ajouter `phone: z.string().optional()` au formSchema
    - Ajouter `phoneVisible: z.boolean().optional()` au formSchema
    - Ajouter ces champs dans defaultValues de l'interface
    - Mettre à jour handleSubmit pour sauvegarder `phone` dans `profiles` et `phone_visible` dans `rescuer_profiles`
  - Notes: Importer le composant Switch

- [ ] **Task 3: Ajouter le champ téléphone dans PersonalInfoForm**
  - File: `pro-bain-app/src/components/profile/forms/PersonalInfoForm.tsx`
  - Action:
    - Ajouter un FormField pour `phone` avec Input type="tel"
    - Ajouter un FormField pour `phoneVisible` avec Switch + label explicatif
    - Message: "En rendant votre numéro visible, les établissements peuvent vous contacter directement pour des missions ou offres d'emploi"
  - Notes: Utiliser le pattern existant des autres champs

- [ ] **Task 4: Afficher le téléphone dans RescuerProfileHeader**
  - File: `pro-bain-app/src/components/profile/RescuerProfileHeader.tsx`
  - Action:
    - Ajouter props `phone?: string` et `phoneVisible?: boolean` et `viewerIsEstablishment?: boolean`
    - Afficher le téléphone avec icône Phone seulement si `phoneVisible && viewerIsEstablishment && phone`
    - Style: Badge similaire à l'âge/canton avec icône téléphone
  - Notes: Importer Phone de lucide-react

- [ ] **Task 5: Passer les props depuis Profile.tsx**
  - File: `pro-bain-app/src/pages/Profile.tsx`
  - Action:
    - Récupérer `phone` depuis profileData et `phone_visible` depuis rescuerProfileData
    - Déterminer si le viewer est un établissement via ProfileContext
    - Passer les props à RescuerProfileHeader
  - Notes: Importer useProfile depuis contexts

- [ ] **Task 6: Afficher le téléphone dans EstablishmentRescuers**
  - File: `pro-bain-app/src/pages/EstablishmentRescuers.tsx`
  - Action:
    - La query récupère déjà `profile:profiles!inner(*)` - le phone sera inclus
    - Ajouter `phone_visible` dans le select de rescuer_profiles
    - Afficher le téléphone dans la card si `phone_visible` est true
    - Ajouter icône Phone cliquable avec `tel:` link
  - Notes: L'établissement voit automatiquement car c'est sa page

### Acceptance Criteria

- [ ] **AC1:** Given un sauveteur sur sa page de profil, when il remplit son numéro de téléphone et active le toggle, then le numéro est sauvegardé et le toggle reste activé après refresh

- [ ] **AC2:** Given un sauveteur avec toggle désactivé, when un établissement consulte son profil, then le numéro de téléphone n'est PAS affiché

- [ ] **AC3:** Given un sauveteur avec toggle activé et numéro renseigné, when un établissement consulte son profil, then le numéro de téléphone EST affiché avec une icône téléphone

- [ ] **AC4:** Given un sauveteur avec toggle activé, when un autre sauveteur consulte son profil, then le numéro de téléphone n'est PAS affiché (visible uniquement par établissements)

- [ ] **AC5:** Given le formulaire de profil, when le sauveteur voit le toggle, then un message explicatif est affiché: "En rendant votre numéro visible, les établissements peuvent vous contacter directement pour des missions ou offres d'emploi"

- [ ] **AC6:** Given un établissement sur la page "Sauveteurs", when il consulte la liste, then les numéros de téléphone des sauveteurs avec toggle activé sont affichés et cliquables

## Additional Context

### Dependencies

- Composant `Switch` de `@/components/ui/switch` (existe déjà)
- `ProfileContext` pour accéder au `profileType` du viewer (existe déjà)
- Icône `Phone` de `lucide-react` (existe déjà)
- Migration Supabase à exécuter avant déploiement

### Testing Strategy

**Tests manuels:**
1. Se connecter en tant que sauveteur → modifier profil → ajouter téléphone + activer toggle → vérifier sauvegarde
2. Se connecter en tant qu'établissement → consulter profil sauveteur avec toggle ON → vérifier affichage téléphone
3. Se connecter en tant qu'établissement → consulter profil sauveteur avec toggle OFF → vérifier NON affichage
4. Se connecter en tant que sauveteur → consulter autre profil sauveteur avec toggle ON → vérifier NON affichage
5. En tant qu'établissement → page Sauveteurs → vérifier affichage téléphones cliquables

### Notes

- Le champ `contact_phone` existe déjà dans `establishment_profiles` - pattern similaire
- Le Switch utilise des couleurs jaune/gris (data-[state=checked]:bg-yellow-400)
- RescuerProfileHeader reçoit déjà les props via Profile.tsx
- Le téléphone cliquable utilise `<a href="tel:+41...">`
