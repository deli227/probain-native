# Modèles de Données Pro-Bain
> Documentation des tables Supabase

## Vue d'Ensemble

Le projet utilise **Supabase** (PostgreSQL) avec les tables suivantes organisées par domaine fonctionnel.

---

## Diagramme des Relations

```
                    ┌─────────────────┐
                    │   auth.users    │
                    │   (Supabase)    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    profiles     │◄──────────────────────────┐
                    │   (base user)   │                           │
                    └────────┬────────┘                           │
           ┌─────────────────┼─────────────────┐                  │
           ▼                 ▼                 ▼                  │
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│ rescuer_profiles │ │ trainer_profiles │ │establishment_    │   │
│   (Sauveteurs)   │ │   (Formateurs)   │ │    profiles      │   │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘   │
         │                    │                    │              │
         ▼                    ▼                    ▼              │
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│  availabilities  │ │ trainer_courses  │ │   job_postings   │   │
│   (Dispos)       │ │    (Cours)       │ │  (Offres emploi) │   │
└──────────────────┘ └────────┬─────────┘ └──────────────────┘   │
                              │                                   │
         ┌────────────────────┼────────────────────┐              │
         ▼                    ▼                    ▼              │
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│   formations     │ │course_registrat- │ │ internal_messages│───┘
│  (Formations)    │ │      ions        │ │   (Messagerie)   │
└──────────────────┘ └──────────────────┘ └──────────────────┘

         ┌──────────────────┐ ┌──────────────────┐
         │   experiences    │ │   notifications  │
         │  (Expériences)   │ │  (Notifications) │
         └──────────────────┘ └──────────────────┘
```

---

## Tables par Domaine

### 1. Gestion des Utilisateurs

#### `profiles`
Table centrale des utilisateurs, liée à `auth.users` de Supabase.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID utilisateur (= auth.users.id) |
| email | TEXT | Email |
| full_name | TEXT | Nom complet |
| profile_type | TEXT | 'maitre_nageur' \| 'formateur' \| 'etablissement' |
| is_active | BOOLEAN | Compte actif (géré par admin) |
| profile_type_selected | BOOLEAN | Type sélectionné |
| onboarding_completed | BOOLEAN | Onboarding terminé |
| created_at | TIMESTAMP | Date création |
| updated_at | TIMESTAMP | Date mise à jour |

#### `rescuer_profiles` (Sauveteurs)
Extension du profil pour les maîtres-nageurs.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK, FK) | = profiles.id |
| phone | TEXT | Téléphone |
| city | TEXT | Ville |
| postal_code | TEXT | Code postal |
| availability_status | TEXT | Statut de disponibilité |
| is_always_available | BOOLEAN | Toujours disponible |
| brevet_plus_pool | TEXT | Type brevet |
| sss_id | TEXT | ID SSS |
| avatar_url | TEXT | Photo de profil |

#### `trainer_profiles` (Formateurs)
Extension du profil pour les organismes de formation.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK, FK) | = profiles.id |
| organization_name | TEXT | Nom organisme |
| phone | TEXT | Téléphone |
| city | TEXT | Ville |
| postal_code | TEXT | Code postal |
| description | TEXT | Description |
| certifications | TEXT[] | Certifications proposées |
| website | TEXT | Site web |
| avatar_url | TEXT | Logo |

#### `establishment_profiles` (Établissements)
Extension du profil pour les piscines et centres aquatiques.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK, FK) | = profiles.id |
| organization_name | TEXT | Nom établissement |
| street | TEXT | Adresse |
| city_zip | TEXT | Ville + CP |
| canton | TEXT | Canton |
| region | TEXT | Région |
| pool_types | TEXT[] | Types de bassins |
| opening_hours | JSONB | Horaires |
| contact_email | TEXT | Email contact |
| contact_phone | TEXT | Téléphone |
| website | TEXT | Site web |
| avatar_url | TEXT | Photo |

---

### 2. Emploi et Travail

#### `job_postings` (Offres d'emploi)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID offre |
| establishment_id | UUID (FK) | → profiles.id |
| title | TEXT | Titre du poste |
| description | TEXT | Description |
| location | TEXT | Lieu |
| contract_type | TEXT | Type contrat |
| created_at | TIMESTAMP | Date création |
| updated_at | TIMESTAMP | Date MAJ |

#### `availabilities` (Disponibilités)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID |
| user_id | UUID (FK) | → profiles.id |
| date | DATE | Date disponible |
| is_available | BOOLEAN | Disponible ce jour |
| created_at | TIMESTAMP | Création |
| updated_at | TIMESTAMP | MAJ |

#### `experiences` (Expériences professionnelles)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID |
| user_id | UUID (FK) | → profiles.id |
| title | TEXT | Titre poste |
| location | TEXT | Lieu |
| contract_type | TEXT | Type contrat |
| start_date | DATE | Date début |
| end_date | DATE | Date fin (nullable) |
| document_url | TEXT | Document justificatif |

---

### 3. Formations

#### `formations` (Formations des sauveteurs)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID |
| user_id | UUID (FK) | → profiles.id |
| title | TEXT | Titre formation |
| organization | TEXT | Organisme |
| region | ENUM | Région (training_region) |
| start_date | DATE | Date début |
| end_date | DATE | Date fin |
| document_url | TEXT | Certificat |

#### `trainer_courses` (Cours des formateurs)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID cours |
| trainer_id | UUID (FK) | → profiles.id |
| title | TEXT | Titre cours |
| description | TEXT | Description |
| location | TEXT | Lieu |
| start_date | TIMESTAMP | Date/heure début |
| end_date | TIMESTAMP | Date/heure fin |
| max_participants | INT | Places max |
| current_participants | INT | Inscrits actuels |
| price | DECIMAL | Prix |
| status | TEXT | Statut |

#### `course_registrations` (Inscriptions aux cours)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID inscription |
| course_id | UUID (FK) | → trainer_courses.id |
| student_id | UUID (FK) | → profiles.id |
| registration_date | TIMESTAMP | Date inscription |
| status | TEXT | Statut inscription |
| payment_status | TEXT | Statut paiement |

#### `sss_formations_cache` (Cache formations SSS)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID |
| external_id | TEXT | ID externe SSS |
| title | TEXT | Titre |
| provider | TEXT | Organisme |
| location | TEXT | Lieu |
| start_date | DATE | Date début |
| end_date | DATE | Date fin |
| url | TEXT | Lien SSS |
| cached_at | TIMESTAMP | Date cache |

---

### 4. Communication

#### `internal_messages` (Messagerie)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID message |
| sender_id | UUID (FK) | → profiles.id |
| recipient_id | UUID (FK) | → profiles.id |
| subject | TEXT | Sujet |
| content | TEXT | Contenu |
| read | BOOLEAN | Lu |
| created_at | TIMESTAMP | Envoyé le |

#### `notifications`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID |
| user_id | UUID (FK) | → profiles.id |
| type | TEXT | Type notification |
| title | TEXT | Titre |
| message | TEXT | Message |
| link | TEXT | Lien action |
| metadata | JSONB | Données extra |
| read | BOOLEAN | Lue |
| created_at | TIMESTAMP | Créée le |

#### `notification_preferences`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID |
| user_id | UUID (FK) | → profiles.id |
| email_notifications | BOOLEAN | Notifs email |
| push_notifications | BOOLEAN | Notifs push |
| sms_notifications | BOOLEAN | Notifs SMS |

---

### 5. Flux d'Actualités

#### `flux_posts` (Posts du flux)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID post |
| title | TEXT | Titre |
| content | TEXT | Contenu |
| image_url | TEXT | Image |
| avatar_url | TEXT | Avatar auteur |
| visibility | TEXT | 'all' \| 'rescuer' \| 'trainer' \| 'establishment' |
| scheduled_at | TIMESTAMP | Publication programmée |
| published_at | TIMESTAMP | Date publication |
| created_at | TIMESTAMP | Création |

#### `flux_likes` / `flux_comments`
Tables pour les interactions sur les posts.

---

### 6. Administration

#### `admins`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID admin |
| email | TEXT | Email |
| password_hash | TEXT | Hash mot de passe |
| first_name | TEXT | Prénom |
| last_name | TEXT | Nom |
| role | TEXT | Rôle admin |
| is_active | BOOLEAN | Actif |
| last_login | TIMESTAMP | Dernière connexion |
| created_by | UUID (FK) | → admins.id |

#### `admin_audit_logs`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID log |
| admin_email | TEXT | Email admin |
| action | TEXT | Action effectuée |
| target_user_id | UUID | Utilisateur concerné |
| target_user_email | TEXT | Email cible |
| details | JSONB | Détails |
| ip_address | TEXT | IP |
| created_at | TIMESTAMP | Date |

#### `account_claim_requests`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID demande |
| type | TEXT | Type réclamation |
| email | TEXT | Email demandeur |
| selected_trainer_name | TEXT | Nom formateur |
| status | TEXT | Statut |
| admin_notes | TEXT | Notes admin |
| processed_by | UUID | Admin traitant |
| processed_at | TIMESTAMP | Date traitement |

---

## Enums

### `training_region`
Régions de formation en Suisse:
- `suisse_romande`
- `suisse_allemande`
- `tessin`

---

## Storage Buckets

| Bucket | Usage |
|--------|-------|
| `profile-documents` | Documents utilisateurs (CV, lettres) |
| `certifications` | Certificats et brevets |
| `flux-images` | Images du flux d'actualités |
