-- ============================================
-- Trigger pour créer automatiquement un profil quand un utilisateur s'inscrit
-- Lit le profile_type depuis les métadonnées de l'utilisateur
-- ============================================

-- Fonction qui crée un profil de base pour chaque nouvel utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    user_profile_type TEXT;
BEGIN
    -- Récupérer le profile_type depuis les métadonnées (raw_user_meta_data)
    user_profile_type := NEW.raw_user_meta_data->>'profile_type';

    RAISE LOG 'handle_new_user: Creating profile for user % with type %', NEW.id, user_profile_type;

    -- Créer le profil de base
    INSERT INTO public.profiles (
        id,
        email,
        profile_type,
        profile_type_selected,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        user_profile_type::profile_type,
        CASE WHEN user_profile_type IS NOT NULL THEN true ELSE false END,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        profile_type = COALESCE(EXCLUDED.profile_type, profiles.profile_type),
        profile_type_selected = COALESCE(EXCLUDED.profile_type_selected, profiles.profile_type_selected),
        updated_at = NOW();

    RAISE LOG 'handle_new_user: Profile created successfully for user %', NEW.id;

    RETURN NEW;
END;
$function$;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- S'assurer que la fonction a les bonnes permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
