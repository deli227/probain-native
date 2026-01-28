-- ============================================
-- Row Level Security (RLS) Policies Migration
-- Pro-Bain Connect - Complete RLS Implementation
-- IDEMPOTENT VERSION - Safe to run multiple times
-- ============================================

-- ============================================
-- 1. TABLE: profiles
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_select_authenticated"
ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own"
ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- ============================================
-- 2. TABLE: rescuer_profiles
-- ============================================

ALTER TABLE rescuer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rescuer_profiles_select" ON rescuer_profiles;
CREATE POLICY "rescuer_profiles_select"
ON rescuer_profiles FOR SELECT TO authenticated
USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type = 'etablissement')
    OR EXISTS (SELECT 1 FROM trainer_students WHERE trainer_students.student_id = rescuer_profiles.id AND trainer_students.trainer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type = 'formateur')
);

DROP POLICY IF EXISTS "rescuer_profiles_insert" ON rescuer_profiles;
CREATE POLICY "rescuer_profiles_insert"
ON rescuer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "rescuer_profiles_update" ON rescuer_profiles;
CREATE POLICY "rescuer_profiles_update"
ON rescuer_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "rescuer_profiles_delete" ON rescuer_profiles;
CREATE POLICY "rescuer_profiles_delete"
ON rescuer_profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- ============================================
-- 3. TABLE: trainer_profiles
-- ============================================

ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trainer_profiles_select" ON trainer_profiles;
CREATE POLICY "trainer_profiles_select"
ON trainer_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "trainer_profiles_insert" ON trainer_profiles;
CREATE POLICY "trainer_profiles_insert"
ON trainer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "trainer_profiles_update" ON trainer_profiles;
CREATE POLICY "trainer_profiles_update"
ON trainer_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "trainer_profiles_delete" ON trainer_profiles;
CREATE POLICY "trainer_profiles_delete"
ON trainer_profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- ============================================
-- 4. TABLE: establishment_profiles
-- ============================================

ALTER TABLE establishment_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "establishment_profiles_select" ON establishment_profiles;
CREATE POLICY "establishment_profiles_select"
ON establishment_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "establishment_profiles_insert" ON establishment_profiles;
CREATE POLICY "establishment_profiles_insert"
ON establishment_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "establishment_profiles_update" ON establishment_profiles;
CREATE POLICY "establishment_profiles_update"
ON establishment_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "establishment_profiles_delete" ON establishment_profiles;
CREATE POLICY "establishment_profiles_delete"
ON establishment_profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- ============================================
-- 5. TABLE: availabilities
-- ============================================

ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "availabilities_select" ON availabilities;
CREATE POLICY "availabilities_select"
ON availabilities FOR SELECT TO authenticated
USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type = 'etablissement')
    OR EXISTS (SELECT 1 FROM trainer_students WHERE trainer_students.student_id = availabilities.user_id AND trainer_students.trainer_id = auth.uid())
);

DROP POLICY IF EXISTS "availabilities_insert" ON availabilities;
CREATE POLICY "availabilities_insert"
ON availabilities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "availabilities_update" ON availabilities;
CREATE POLICY "availabilities_update"
ON availabilities FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "availabilities_delete" ON availabilities;
CREATE POLICY "availabilities_delete"
ON availabilities FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- 6. TABLE: experiences
-- ============================================

ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "experiences_select" ON experiences;
CREATE POLICY "experiences_select"
ON experiences FOR SELECT TO authenticated
USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type = 'etablissement')
    OR EXISTS (SELECT 1 FROM trainer_students WHERE trainer_students.student_id = experiences.user_id AND trainer_students.trainer_id = auth.uid())
);

DROP POLICY IF EXISTS "experiences_insert" ON experiences;
CREATE POLICY "experiences_insert"
ON experiences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "experiences_update" ON experiences;
CREATE POLICY "experiences_update"
ON experiences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "experiences_delete" ON experiences;
CREATE POLICY "experiences_delete"
ON experiences FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- 7. TABLE: formations (if exists)
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'formations' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE formations ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "formations_select" ON formations';
        EXECUTE 'CREATE POLICY "formations_select" ON formations FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type IN (''etablissement'', ''formateur'')))';
        EXECUTE 'DROP POLICY IF EXISTS "formations_insert" ON formations';
        EXECUTE 'CREATE POLICY "formations_insert" ON formations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type = ''formateur''))';
        EXECUTE 'DROP POLICY IF EXISTS "formations_update" ON formations';
        EXECUTE 'CREATE POLICY "formations_update" ON formations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'DROP POLICY IF EXISTS "formations_delete" ON formations';
        EXECUTE 'CREATE POLICY "formations_delete" ON formations FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;
END $$;

-- ============================================
-- 8. TABLE: job_postings
-- ============================================

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_postings_select" ON job_postings;
CREATE POLICY "job_postings_select"
ON job_postings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "job_postings_insert" ON job_postings;
CREATE POLICY "job_postings_insert"
ON job_postings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = establishment_id AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type = 'etablissement'));

DROP POLICY IF EXISTS "job_postings_update" ON job_postings;
CREATE POLICY "job_postings_update"
ON job_postings FOR UPDATE TO authenticated USING (auth.uid() = establishment_id) WITH CHECK (auth.uid() = establishment_id);

DROP POLICY IF EXISTS "job_postings_delete" ON job_postings;
CREATE POLICY "job_postings_delete"
ON job_postings FOR DELETE TO authenticated USING (auth.uid() = establishment_id);

-- ============================================
-- 9. TABLE: messages (if exists)
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE messages ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "messages_select" ON messages';
        EXECUTE 'CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id)';
        EXECUTE 'DROP POLICY IF EXISTS "messages_insert" ON messages';
        EXECUTE 'CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type IN (''etablissement'', ''formateur'')))';
        EXECUTE 'DROP POLICY IF EXISTS "messages_update" ON messages';
        EXECUTE 'CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id)';
        EXECUTE 'DROP POLICY IF EXISTS "messages_delete" ON messages';
        EXECUTE 'CREATE POLICY "messages_delete" ON messages FOR DELETE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id)';
    END IF;
END $$;

-- ============================================
-- 10. TABLE: trainer_students
-- ============================================

ALTER TABLE trainer_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trainer_students_select" ON trainer_students;
CREATE POLICY "trainer_students_select"
ON trainer_students FOR SELECT TO authenticated USING (auth.uid() = trainer_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "trainer_students_insert" ON trainer_students;
CREATE POLICY "trainer_students_insert"
ON trainer_students FOR INSERT TO authenticated
WITH CHECK (auth.uid() = trainer_id AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type = 'formateur'));

DROP POLICY IF EXISTS "trainer_students_update" ON trainer_students;
CREATE POLICY "trainer_students_update"
ON trainer_students FOR UPDATE TO authenticated USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "trainer_students_delete" ON trainer_students;
CREATE POLICY "trainer_students_delete"
ON trainer_students FOR DELETE TO authenticated USING (auth.uid() = trainer_id OR auth.uid() = student_id);

-- ============================================
-- 11. TABLE: admin_audit_logs
-- ============================================

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_logs_deny_all_select" ON admin_audit_logs;
CREATE POLICY "admin_audit_logs_deny_all_select"
ON admin_audit_logs FOR SELECT TO authenticated USING (false);

DROP POLICY IF EXISTS "admin_audit_logs_deny_all_insert" ON admin_audit_logs;
CREATE POLICY "admin_audit_logs_deny_all_insert"
ON admin_audit_logs FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "admin_audit_logs_deny_all_update" ON admin_audit_logs;
CREATE POLICY "admin_audit_logs_deny_all_update"
ON admin_audit_logs FOR UPDATE TO authenticated USING (false);

DROP POLICY IF EXISTS "admin_audit_logs_deny_all_delete" ON admin_audit_logs;
CREATE POLICY "admin_audit_logs_deny_all_delete"
ON admin_audit_logs FOR DELETE TO authenticated USING (false);

-- ============================================
-- 12-15. Optional tables (certifications, documents, saved_jobs, job_applications)
-- ============================================

DO $$
BEGIN
    -- certifications
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'certifications' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE certifications ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "certifications_select" ON certifications';
        EXECUTE 'CREATE POLICY "certifications_select" ON certifications FOR SELECT TO authenticated USING (true)';
        EXECUTE 'DROP POLICY IF EXISTS "certifications_insert" ON certifications';
        EXECUTE 'CREATE POLICY "certifications_insert" ON certifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type = ''formateur''))';
        EXECUTE 'DROP POLICY IF EXISTS "certifications_update" ON certifications';
        EXECUTE 'CREATE POLICY "certifications_update" ON certifications FOR UPDATE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type = ''formateur''))';
        EXECUTE 'DROP POLICY IF EXISTS "certifications_delete" ON certifications';
        EXECUTE 'CREATE POLICY "certifications_delete" ON certifications FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;

    -- documents
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE documents ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "documents_select" ON documents';
        EXECUTE 'CREATE POLICY "documents_select" ON documents FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type IN (''etablissement'', ''formateur'')))';
        EXECUTE 'DROP POLICY IF EXISTS "documents_insert" ON documents';
        EXECUTE 'CREATE POLICY "documents_insert" ON documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'DROP POLICY IF EXISTS "documents_update" ON documents';
        EXECUTE 'CREATE POLICY "documents_update" ON documents FOR UPDATE TO authenticated USING (auth.uid() = user_id)';
        EXECUTE 'DROP POLICY IF EXISTS "documents_delete" ON documents';
        EXECUTE 'CREATE POLICY "documents_delete" ON documents FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;

    -- saved_jobs
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saved_jobs' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "saved_jobs_select" ON saved_jobs';
        EXECUTE 'CREATE POLICY "saved_jobs_select" ON saved_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id)';
        EXECUTE 'DROP POLICY IF EXISTS "saved_jobs_insert" ON saved_jobs';
        EXECUTE 'CREATE POLICY "saved_jobs_insert" ON saved_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'DROP POLICY IF EXISTS "saved_jobs_delete" ON saved_jobs';
        EXECUTE 'CREATE POLICY "saved_jobs_delete" ON saved_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;

    -- job_applications
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_applications' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "job_applications_select" ON job_applications';
        EXECUTE 'CREATE POLICY "job_applications_select" ON job_applications FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM job_postings WHERE job_postings.id = job_applications.job_id AND job_postings.establishment_id = auth.uid()))';
        EXECUTE 'DROP POLICY IF EXISTS "job_applications_insert" ON job_applications';
        EXECUTE 'CREATE POLICY "job_applications_insert" ON job_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.profile_type = ''maitre_nageur''))';
        EXECUTE 'DROP POLICY IF EXISTS "job_applications_update" ON job_applications';
        EXECUTE 'CREATE POLICY "job_applications_update" ON job_applications FOR UPDATE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM job_postings WHERE job_postings.id = job_applications.job_id AND job_postings.establishment_id = auth.uid()))';
        EXECUTE 'DROP POLICY IF EXISTS "job_applications_delete" ON job_applications';
        EXECUTE 'CREATE POLICY "job_applications_delete" ON job_applications FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;
END $$;
