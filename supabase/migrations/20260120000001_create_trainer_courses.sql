-- Table pour les cours créés par les formateurs
CREATE TABLE IF NOT EXISTS trainer_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 15,
  current_participants INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DISPONIBLE' CHECK (status IN ('DISPONIBLE', 'COMPLET', 'ANNULE', 'TERMINE')),
  price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table pour les inscriptions aux cours
CREATE TABLE IF NOT EXISTS course_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES trainer_courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT NOT NULL DEFAULT 'INSCRIT' CHECK (status IN ('INSCRIT', 'LISTE_ATTENTE', 'ANNULE', 'COMPLETE')),
  payment_status TEXT DEFAULT 'EN_ATTENTE' CHECK (payment_status IN ('EN_ATTENTE', 'PAYE', 'REMBOURSE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(course_id, student_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_trainer_courses_trainer_id ON trainer_courses(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_courses_date ON trainer_courses(date);
CREATE INDEX IF NOT EXISTS idx_course_registrations_course_id ON course_registrations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_registrations_student_id ON course_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_course_registrations_status ON course_registrations(status);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour trainer_courses
DROP TRIGGER IF EXISTS update_trainer_courses_updated_at ON trainer_courses;
CREATE TRIGGER update_trainer_courses_updated_at
    BEFORE UPDATE ON trainer_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour automatiquement le nombre de participants
CREATE OR REPLACE FUNCTION update_course_participants_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'INSCRIT' THEN
        UPDATE trainer_courses
        SET current_participants = current_participants + 1,
            status = CASE
                WHEN current_participants + 1 >= max_participants THEN 'COMPLET'
                ELSE 'DISPONIBLE'
            END
        WHERE id = NEW.course_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'INSCRIT' THEN
        UPDATE trainer_courses
        SET current_participants = GREATEST(0, current_participants - 1),
            status = CASE
                WHEN current_participants - 1 < max_participants THEN 'DISPONIBLE'
                ELSE status
            END
        WHERE id = OLD.course_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'INSCRIT' AND NEW.status != 'INSCRIT' THEN
        UPDATE trainer_courses
        SET current_participants = GREATEST(0, current_participants - 1),
            status = CASE
                WHEN current_participants - 1 < max_participants THEN 'DISPONIBLE'
                ELSE status
            END
        WHERE id = NEW.course_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour le compteur de participants
DROP TRIGGER IF EXISTS update_course_participants ON course_registrations;
CREATE TRIGGER update_course_participants
    AFTER INSERT OR UPDATE OR DELETE ON course_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_course_participants_count();

-- RLS (Row Level Security) pour trainer_courses
ALTER TABLE trainer_courses ENABLE ROW LEVEL SECURITY;

-- Policy : Les formateurs peuvent voir tous les cours
CREATE POLICY "Trainers can view all courses" ON trainer_courses
    FOR SELECT USING (true);

-- Policy : Les formateurs peuvent créer leurs propres cours
CREATE POLICY "Trainers can create their own courses" ON trainer_courses
    FOR INSERT WITH CHECK (auth.uid() = trainer_id);

-- Policy : Les formateurs peuvent modifier leurs propres cours
CREATE POLICY "Trainers can update their own courses" ON trainer_courses
    FOR UPDATE USING (auth.uid() = trainer_id);

-- Policy : Les formateurs peuvent supprimer leurs propres cours
CREATE POLICY "Trainers can delete their own courses" ON trainer_courses
    FOR DELETE USING (auth.uid() = trainer_id);

-- RLS pour course_registrations
ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;

-- Policy : Tout le monde peut voir les inscriptions
CREATE POLICY "Everyone can view registrations" ON course_registrations
    FOR SELECT USING (true);

-- Policy : Les utilisateurs peuvent s'inscrire
CREATE POLICY "Users can register for courses" ON course_registrations
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Policy : Les utilisateurs peuvent annuler leur inscription
CREATE POLICY "Users can cancel their registration" ON course_registrations
    FOR UPDATE USING (auth.uid() = student_id);

-- Policy : Les utilisateurs peuvent supprimer leur inscription
CREATE POLICY "Users can delete their registration" ON course_registrations
    FOR DELETE USING (auth.uid() = student_id);

-- Commentaires pour documentation
COMMENT ON TABLE trainer_courses IS 'Cours créés par les formateurs';
COMMENT ON TABLE course_registrations IS 'Inscriptions des élèves aux cours';
COMMENT ON COLUMN trainer_courses.status IS 'DISPONIBLE, COMPLET, ANNULE, TERMINE';
COMMENT ON COLUMN course_registrations.status IS 'INSCRIT, LISTE_ATTENTE, ANNULE, COMPLETE';
