-- Fix: Stocker l'anon key directement dans la fonction send_push_notification
-- Le vault Supabase necessite des permissions speciales non disponibles via CLI.
-- L'anon key est deja publique (frontend .env, JS bundle), donc pas de risque securite.

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

  -- Anon key du projet (publique, deja dans le frontend)
  -- Necessaire pour que le gateway Supabase route vers l'Edge Function
  v_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxam56eWVpampkeGl2am5taXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MTMwNDQsImV4cCI6MjA1MjE4OTA0NH0.J9srBzYURYlkQqkW-9OdkyK3cthZDuHteGm6Zcl2a_A';

  payload := jsonb_build_object(
    'event_type', p_event_type,
    'recipient_id', p_recipient_id,
    'data', p_data
  );

  -- pg_net signature: net.http_post(url, body, params, headers, timeout_ms)
  -- Le 4eme argument (headers) est OBLIGATOIRE pour l'auth gateway Supabase
  PERFORM net.http_post(
    edge_function_url,
    payload,
    '{}'::jsonb,
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon_key
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'send_push_notification failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
