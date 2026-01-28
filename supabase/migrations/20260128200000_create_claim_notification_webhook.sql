-- Migration: Créer un webhook pour notifier par email les nouvelles demandes de compte
-- Utilise pg_net pour appeler l'Edge Function notify-claim-request

-- Activer l'extension pg_net si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fonction qui appelle l'Edge Function via HTTP
CREATE OR REPLACE FUNCTION notify_claim_request()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- URL de l'Edge Function (déployée avec --no-verify-jwt)
  edge_function_url := 'https://rqjnzyeijjdxivjnmiyy.supabase.co/functions/v1/notify-claim-request';

  -- Construire le payload au format Database Webhook
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

  -- Appeler l'Edge Function de manière asynchrone (sans auth car --no-verify-jwt)
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

-- Créer le trigger sur la table account_claim_requests
DROP TRIGGER IF EXISTS on_claim_request_created ON account_claim_requests;

CREATE TRIGGER on_claim_request_created
  AFTER INSERT ON account_claim_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_claim_request();

-- Commentaire
COMMENT ON FUNCTION notify_claim_request() IS 'Envoie une notification email via Edge Function quand une nouvelle demande de compte est créée';
