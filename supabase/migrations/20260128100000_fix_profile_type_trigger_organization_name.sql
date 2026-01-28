-- Fix: Le trigger handle_profile_type_selection échoue car il INSERT sans organization_name
-- alors que la colonne a une contrainte NOT NULL.
-- Solution: Utiliser COALESCE pour récupérer l'organization_name existante ou un défaut.

CREATE OR REPLACE FUNCTION public.handle_profile_type_selection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Si le type de profil est défini, force profile_type_selected à true
    IF NEW.profile_type IS NOT NULL THEN
        NEW.profile_type_selected := true;
    END IF;

    -- Logging pour le débogage
    RAISE LOG 'Profile type selection triggered for user %, profile_type: %, profile_type_selected: %',
              NEW.id,
              NEW.profile_type,
              NEW.profile_type_selected;

    -- Si le type de profil est défini et profile_type_selected est true
    IF NEW.profile_type IS NOT NULL AND NEW.profile_type_selected = true THEN
        -- Gestion selon le type de profil
        CASE NEW.profile_type
            -- Création du profil maître nageur
            WHEN 'maitre_nageur' THEN
                INSERT INTO public.rescuer_profiles (
                    id,
                    first_name,
                    last_name,
                    canton,
                    avatar_url
                )
                VALUES (
                    NEW.id,
                    NEW.first_name,
                    NEW.last_name,
                    NEW.canton,
                    NEW.avatar_url
                )
                ON CONFLICT (id) DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    canton = EXCLUDED.canton,
                    avatar_url = EXCLUDED.avatar_url,
                    updated_at = NOW();

                RAISE LOG 'Created/Updated rescuer profile for user %', NEW.id;

            -- Création du profil formateur
            -- FIX: Inclure organization_name avec COALESCE pour éviter NOT NULL violation
            WHEN 'formateur' THEN
                INSERT INTO public.trainer_profiles (
                    id,
                    first_name,
                    last_name,
                    canton,
                    avatar_url,
                    organization_name
                )
                VALUES (
                    NEW.id,
                    NEW.first_name,
                    NEW.last_name,
                    NEW.canton,
                    NEW.avatar_url,
                    COALESCE(
                        (SELECT organization_name FROM public.trainer_profiles WHERE id = NEW.id),
                        'Non spécifié'
                    )
                )
                ON CONFLICT (id) DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    canton = EXCLUDED.canton,
                    avatar_url = EXCLUDED.avatar_url,
                    updated_at = NOW();

                RAISE LOG 'Created/Updated trainer profile for user %', NEW.id;

            -- Création du profil établissement
            -- FIX: Inclure organization_name avec COALESCE pour éviter NOT NULL violation
            WHEN 'etablissement' THEN
                INSERT INTO public.establishment_profiles (
                    id,
                    canton,
                    avatar_url,
                    organization_name
                )
                VALUES (
                    NEW.id,
                    NEW.canton,
                    NEW.avatar_url,
                    COALESCE(
                        (SELECT organization_name FROM public.establishment_profiles WHERE id = NEW.id),
                        'Non spécifié'
                    )
                )
                ON CONFLICT (id) DO UPDATE SET
                    canton = EXCLUDED.canton,
                    avatar_url = EXCLUDED.avatar_url,
                    updated_at = NOW();

                RAISE LOG 'Created/Updated establishment profile for user %', NEW.id;

            ELSE
                RAISE LOG 'Unknown profile type % for user %', NEW.profile_type, NEW.id;
        END CASE;
    END IF;

    RETURN NEW;
END;
$function$;

-- Recréer le trigger (au cas où)
DROP TRIGGER IF EXISTS on_profile_type_selection ON public.profiles;
CREATE TRIGGER on_profile_type_selection
    BEFORE UPDATE OF profile_type ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_type_selection();

COMMENT ON FUNCTION public.handle_profile_type_selection() IS 'Crée automatiquement le profil spécifique quand profile_type est défini. Gère organization_name avec COALESCE pour éviter NOT NULL violation.';
