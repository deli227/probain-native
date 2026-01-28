CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'MESSAGE',
    'NOUVELLE_FORMATION',
    'OFFRE_EMPLOI',
    'INSCRIPTION_COURS',
    'INSCRIPTION_LISTE_ATTENTE',
    'INSCRIPTION_ETABLISSEMENT',
    'DEMANDE_EMPLOI'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION notify_trainer_on_registration()
RETURNS TRIGGER AS $$
DECLARE
    course_info RECORD;
    student_info RECORD;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    SELECT title, trainer_id INTO course_info
    FROM trainer_courses
    WHERE id = NEW.course_id;

    SELECT first_name, last_name INTO student_info
    FROM profiles
    WHERE id = NEW.student_id;

    IF NEW.status = 'INSCRIT' THEN
        notification_title := 'Nouvelle inscription';
        notification_message := student_info.first_name || ' ' || student_info.last_name || ' s''est inscrit(e) au cours "' || course_info.title || '"';
    ELSIF NEW.status = 'LISTE_ATTENTE' THEN
        notification_title := 'Inscription en liste d''attente';
        notification_message := student_info.first_name || ' ' || student_info.last_name || ' s''est inscrit(e) en liste d''attente pour le cours "' || course_info.title || '"';
    END IF;

    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
        course_info.trainer_id,
        CASE WHEN NEW.status = 'INSCRIT' THEN 'INSCRIPTION_COURS' ELSE 'INSCRIPTION_LISTE_ATTENTE' END,
        notification_title,
        notification_message,
        '/trainer-profile',
        jsonb_build_object(
            'course_id', NEW.course_id,
            'student_id', NEW.student_id,
            'registration_id', NEW.id
        )
    );

    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS notify_trainer_on_course_registration ON course_registrations;
CREATE TRIGGER notify_trainer_on_course_registration
    AFTER INSERT ON course_registrations
    FOR EACH ROW
    WHEN (NEW.status IN ('INSCRIT', 'LISTE_ATTENTE'))
    EXECUTE FUNCTION notify_trainer_on_registration();

COMMENT ON TABLE notifications IS 'Système de notifications pour tous les utilisateurs';
COMMENT ON COLUMN notifications.type IS 'MESSAGE, NOUVELLE_FORMATION, OFFRE_EMPLOI, INSCRIPTION_COURS, INSCRIPTION_LISTE_ATTENTE, INSCRIPTION_ETABLISSEMENT, DEMANDE_EMPLOI';
