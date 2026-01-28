-- Fix: Mettre à jour la fonction notify_claim_request avec les bonnes colonnes

CREATE OR REPLACE FUNCTION notify_claim_request()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- URL de l'Edge Function (déployée avec --no-verify-jwt)
  edge_function_url := 'https://rqjnzyeijjdxivjnmiyy.supabase.co/functions/v1/notify-claim-request';

  -- Construire le payload avec les colonnes correctes de account_claim_requests
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'account_claim_requests',
    'schema', 'public',
    'record', jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'type', NEW.type,
      'selected_trainer_name', NEW.selected_trainer_name,
      'status', NEW.status,
      'admin_notes', NEW.admin_notes,
      'created_at', NEW.created_at
    )
  );

  -- Appeler l'Edge Function de manière asynchrone
  SELECT net.http_post(
    url := edge_function_url,
    headers := '{"Content-Type": "application/json"}'::JSONB,
    body := payload::TEXT
  ) INTO request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Ne pas bloquer l'insertion si l'envoi échoue
    RAISE WARNING 'notify_claim_request failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
