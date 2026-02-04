-- Fix: Ajouter les headers d'authentification au pg_net.http_post
-- L'ancienne version (20260204000000) ne passait PAS de headers,
-- ce qui causait un 401 du gateway Supabase (meme avec --no-verify-jwt)
--
-- Cette migration:
-- 1. Stocke l'anon key dans le vault Supabase (necessaire pour pg_net → Edge Function)
-- 2. Met a jour send_push_notification() avec les bons headers

-- =============================================
-- 1. Stocker l'anon key dans le vault
-- =============================================
-- L'anon key est publique (deja dans le frontend).
-- Le gateway Supabase exige un Bearer token valide pour router vers les Edge Functions.
-- On utilise l'anon key car l'Edge Function a --no-verify-jwt.
DO $$
BEGIN
  -- Supprimer l'ancien secret s'il existe (evite les doublons)
  DELETE FROM vault.secrets WHERE name = 'supabase_anon_key';
  -- Inserer l'anon key
  INSERT INTO vault.secrets (name, secret)
  VALUES ('supabase_anon_key', current_setting('request.jwt.claims', true)::json->>'role');
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Vault setup skipped: %', SQLERRM;
END;
$$;

-- Fallback: si le bloc ci-dessus n'a pas pu recuperer le JWT claim,
-- inserer directement l'anon key connue du projet
DO $$
BEGIN
  -- Verifier si le secret existe deja
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' AND decrypted_secret IS NOT NULL AND decrypted_secret != '') THEN
    DELETE FROM vault.secrets WHERE name = 'supabase_anon_key';
    PERFORM vault.create_secret(
      'supabase_anon_key',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxam56eWVpampkeGl2am5taXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MTMwNDQsImV4cCI6MjA1MjE4OTA0NH0.J9srBzYURYlkQqkW-9OdkyK3cthZDuHteGm6Zcl2a_A'
    );
  END IF;
END;
$$;

-- =============================================
-- 2. Mettre a jour la fonction send_push_notification avec les headers
-- =============================================
CREATE OR REPLACE FUNCTION send_push_notification(
  p_event_type TEXT,
  p_recipient_id UUID,
  p_data JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $$
DECLARE
  edge_function_url TEXT;
  payload JSONB;
  v_anon_key TEXT;
BEGIN
  edge_function_url := 'https://rqjnzyeijjdxivjnmiyy.supabase.co/functions/v1/send-push-notification';

  -- Recuperer l'anon key depuis le vault Supabase
  SELECT decrypted_secret INTO v_anon_key
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_anon_key'
    LIMIT 1;

  payload := jsonb_build_object(
    'event_type', p_event_type,
    'recipient_id', p_recipient_id,
    'data', p_data
  );

  -- pg_net signature: net.http_post(url, body, params, headers, timeout_ms)
  -- Le 4eme argument (headers) est OBLIGATOIRE pour l'auth gateway Supabase
  -- Meme avec --no-verify-jwt, le gateway exige un Bearer token valide
  PERFORM net.http_post(
    edge_function_url,
    payload,
    '{}'::jsonb,
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(v_anon_key, '')
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'send_push_notification failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION send_push_notification(TEXT, UUID, JSONB) IS 'Appelle l Edge Function send-push-notification via pg_net avec headers auth';
