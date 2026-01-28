-- Migration pour corriger les séquences Unicode échappées dans les données existantes
-- Remplace les patterns \uXXXX, /uXXXX par les caractères Unicode correspondants

-- Fonction pour décoder les séquences Unicode
CREATE OR REPLACE FUNCTION decode_unicode_escapes(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT := text_input;
    match_result TEXT[];
    hex_code TEXT;
    unicode_char TEXT;
BEGIN
    IF text_input IS NULL THEN
        RETURN NULL;
    END IF;

    -- Boucle pour remplacer toutes les séquences \uXXXX ou /uXXXX
    WHILE result ~ '[/\\]u[0-9a-fA-F]{4}' LOOP
        -- Extraire le code hex
        hex_code := substring(result from '[/\\]u([0-9a-fA-F]{4})');
        hex_code := substring(hex_code from 3); -- Enlever \u ou /u

        -- Convertir en caractère Unicode
        unicode_char := chr(('x' || hex_code)::bit(16)::int);

        -- Remplacer la première occurrence
        result := regexp_replace(result, '[/\\]u[0-9a-fA-F]{4}', unicode_char);
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Mettre à jour les colonnes avec des séquences Unicode
UPDATE sss_formations_cache
SET
    titre = decode_unicode_escapes(titre),
    lieu = decode_unicode_escapes(lieu),
    organisateur = decode_unicode_escapes(organisateur)
WHERE
    titre ~ '[/\\]u[0-9a-fA-F]{4}'
    OR lieu ~ '[/\\]u[0-9a-fA-F]{4}'
    OR organisateur ~ '[/\\]u[0-9a-fA-F]{4}';

-- Log du nombre de lignes mises à jour
DO $$
DECLARE
    rows_updated INTEGER;
BEGIN
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RAISE NOTICE 'Nombre de formations corrigées: %', rows_updated;
END $$;

-- Supprimer la fonction temporaire (optionnel, on peut la garder pour futures corrections)
-- DROP FUNCTION IF EXISTS decode_unicode_escapes(TEXT);

COMMENT ON FUNCTION decode_unicode_escapes(TEXT) IS 'Décode les séquences Unicode échappées (\uXXXX, /uXXXX) en caractères UTF-8';
