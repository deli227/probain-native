-- Migration: Creer les triggers PostgreSQL pour les notifications push
-- Utilise pg_net pour appeler l'Edge Function send-push-notification
-- 7 triggers sur les tables : internal_messages, flux_posts, sss_formations_cache,
-- job_postings, job_applications, trainer_students, course_registrations

-- Activer l'extension pg_net si pas deja fait
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =============================================
-- Fonction helper generique (appelle l'Edge Function)
-- =============================================
CREATE OR REPLACE FUNCTION send_push_notification(
  p_event_type TEXT,
  p_recipient_id UUID,
  p_data JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $$
DECLARE
  edge_function_url TEXT;
  payload JSONB;
BEGIN
  edge_function_url := 'https://rqjnzyeijjdxivjnmiyy.supabase.co/functions/v1/send-push-notification';

  payload := jsonb_build_object(
    'event_type', p_event_type,
    'recipient_id', p_recipient_id,
    'data', p_data
  );

  -- pg_net signature: net.http_post(url text, body jsonb, params jsonb)
  -- params = URL query params (PAS headers)
  -- Le Content-Type application/json est inclus par defaut
  -- L'Edge Function a --no-verify-jwt donc pas besoin d'auth header
  PERFORM net.http_post(
    edge_function_url,
    payload,
    '{}'::jsonb
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'send_push_notification failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION send_push_notification(TEXT, UUID, JSONB) IS 'Fonction helper qui appelle l Edge Function send-push-notification via pg_net';

-- =============================================
-- 1. Nouveau message → push au destinataire (recipient_id direct)
-- =============================================
CREATE OR REPLACE FUNCTION trigger_push_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_push_notification(
    'new_message',
    NEW.recipient_id,
    jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message_push ON internal_messages;
CREATE TRIGGER on_new_message_push
  AFTER INSERT ON internal_messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_new_message();

-- =============================================
-- 2. Nouveau post flux → broadcast a tous les utilisateurs
-- =============================================
CREATE OR REPLACE FUNCTION trigger_push_new_flux_post()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_push_notification(
    'new_flux_post',
    NEW.user_id,
    jsonb_build_object('post_id', NEW.id, 'broadcast', true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_flux_post_push ON flux_posts;
CREATE TRIGGER on_new_flux_post_push
  AFTER INSERT ON flux_posts
  FOR EACH ROW
  WHEN (NEW.is_published = true)
  EXECUTE FUNCTION trigger_push_new_flux_post();

-- =============================================
-- 3. Nouvelle formation SSS → broadcast aux sauveteurs
-- =============================================
CREATE OR REPLACE FUNCTION trigger_push_new_formation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_push_notification(
    'new_formation',
    '00000000-0000-0000-0000-000000000000'::UUID,
    jsonb_build_object('formation_id', NEW.id, 'title', NEW.title, 'broadcast', true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_formation_push ON sss_formations_cache;
CREATE TRIGGER on_new_formation_push
  AFTER INSERT ON sss_formations_cache
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_new_formation();

-- =============================================
-- 4. Nouvelle offre emploi → broadcast aux sauveteurs
-- =============================================
CREATE OR REPLACE FUNCTION trigger_push_new_job_posting()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_push_notification(
    'new_job_posting',
    '00000000-0000-0000-0000-000000000000'::UUID,
    jsonb_build_object('job_id', NEW.id, 'title', NEW.title, 'broadcast', true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_job_posting_push ON job_postings;
CREATE TRIGGER on_new_job_posting_push
  AFTER INSERT ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_new_job_posting();

-- =============================================
-- 5. Nouvelle candidature → push a l'etablissement (JOIN via job_postings)
-- =============================================
CREATE OR REPLACE FUNCTION trigger_push_new_job_application()
RETURNS TRIGGER AS $$
DECLARE
  v_establishment_id UUID;
  v_job_title TEXT;
BEGIN
  SELECT jp.establishment_id, jp.title
    INTO v_establishment_id, v_job_title
    FROM job_postings jp
    WHERE jp.id = NEW.job_posting_id;

  IF v_establishment_id IS NOT NULL THEN
    PERFORM send_push_notification(
      'new_job_application',
      v_establishment_id,
      jsonb_build_object('application_id', NEW.id, 'job_title', v_job_title, 'applicant_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_job_application_push ON job_applications;
CREATE TRIGGER on_new_job_application_push
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_new_job_application();

-- =============================================
-- 6. Nouvel eleve → push au formateur (trainer_id direct)
-- =============================================
CREATE OR REPLACE FUNCTION trigger_push_new_student()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_push_notification(
    'new_student',
    NEW.trainer_id,
    jsonb_build_object('student_id', NEW.student_id, 'trainer_student_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_student_push ON trainer_students;
CREATE TRIGGER on_new_student_push
  AFTER INSERT ON trainer_students
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_new_student();

-- =============================================
-- 7. Nouvelle inscription cours → push au formateur (JOIN via trainer_courses)
-- =============================================
CREATE OR REPLACE FUNCTION trigger_push_new_course_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_trainer_id UUID;
  v_course_title TEXT;
BEGIN
  SELECT tc.trainer_id, tc.title
    INTO v_trainer_id, v_course_title
    FROM trainer_courses tc
    WHERE tc.id = NEW.course_id;

  IF v_trainer_id IS NOT NULL THEN
    PERFORM send_push_notification(
      'new_course_registration',
      v_trainer_id,
      jsonb_build_object('registration_id', NEW.id, 'course_title', v_course_title, 'student_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_course_registration_push ON course_registrations;
CREATE TRIGGER on_new_course_registration_push
  AFTER INSERT ON course_registrations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_new_course_registration();

-- =============================================
-- Commentaires
-- =============================================
COMMENT ON FUNCTION trigger_push_new_message() IS 'Push notification au destinataire lors d un nouveau message';
COMMENT ON FUNCTION trigger_push_new_flux_post() IS 'Push notification broadcast lors d un nouveau post flux publie';
COMMENT ON FUNCTION trigger_push_new_formation() IS 'Push notification broadcast aux sauveteurs lors d une nouvelle formation SSS';
COMMENT ON FUNCTION trigger_push_new_job_posting() IS 'Push notification broadcast aux sauveteurs lors d une nouvelle offre d emploi';
COMMENT ON FUNCTION trigger_push_new_job_application() IS 'Push notification a l etablissement lors d une nouvelle candidature';
COMMENT ON FUNCTION trigger_push_new_student() IS 'Push notification au formateur lors d un nouvel eleve';
COMMENT ON FUNCTION trigger_push_new_course_registration() IS 'Push notification au formateur lors d une inscription a un cours';
