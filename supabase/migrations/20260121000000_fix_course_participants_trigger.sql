-- Script pour corriger le trigger de comptage des participants

-- 1. Supprimer et recréer le trigger
DROP TRIGGER IF EXISTS update_course_participants ON course_registrations;

-- 2. Recréer la fonction avec correction
CREATE OR REPLACE FUNCTION update_course_participants_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'INSCRIT' THEN
        -- Incrémenter le compteur
        UPDATE trainer_courses
        SET current_participants = current_participants + 1,
            status = CASE
                WHEN current_participants + 1 >= max_participants THEN 'COMPLET'
                ELSE 'DISPONIBLE'
            END
        WHERE id = NEW.course_id;

    ELSIF TG_OP = 'DELETE' AND OLD.status = 'INSCRIT' THEN
        -- Décrémenter le compteur
        UPDATE trainer_courses
        SET current_participants = GREATEST(0, current_participants - 1),
            status = CASE
                WHEN current_participants - 1 < max_participants THEN 'DISPONIBLE'
                ELSE status
            END
        WHERE id = OLD.course_id;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Si on passe de INSCRIT à autre chose
        IF OLD.status = 'INSCRIT' AND NEW.status != 'INSCRIT' THEN
            UPDATE trainer_courses
            SET current_participants = GREATEST(0, current_participants - 1),
                status = CASE
                    WHEN current_participants - 1 < max_participants THEN 'DISPONIBLE'
                    ELSE status
                END
            WHERE id = NEW.course_id;
        -- Si on passe d'autre chose à INSCRIT
        ELSIF OLD.status != 'INSCRIT' AND NEW.status = 'INSCRIT' THEN
            UPDATE trainer_courses
            SET current_participants = current_participants + 1,
                status = CASE
                    WHEN current_participants + 1 >= max_participants THEN 'COMPLET'
                    ELSE 'DISPONIBLE'
                END
            WHERE id = NEW.course_id;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- 3. Recréer le trigger
CREATE TRIGGER update_course_participants
    AFTER INSERT OR UPDATE OR DELETE ON course_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_course_participants_count();

-- 4. Corriger les compteurs existants (recalculer à partir des inscriptions réelles)
UPDATE trainer_courses tc
SET current_participants = (
    SELECT COUNT(*)
    FROM course_registrations cr
    WHERE cr.course_id = tc.id AND cr.status = 'INSCRIT'
),
status = CASE
    WHEN (
        SELECT COUNT(*)
        FROM course_registrations cr
        WHERE cr.course_id = tc.id AND cr.status = 'INSCRIT'
    ) >= tc.max_participants THEN 'COMPLET'
    ELSE 'DISPONIBLE'
END;

-- 5. Afficher le résultat
SELECT
    tc.id,
    tc.title,
    tc.current_participants,
    tc.max_participants,
    tc.status,
    (SELECT COUNT(*) FROM course_registrations WHERE course_id = tc.id AND status = 'INSCRIT') as actual_count
FROM trainer_courses tc
ORDER BY tc.created_at DESC;
