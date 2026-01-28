-- ============================================
-- Database Indexes Migration
-- Pro-Bain Connect Performance Optimization
-- ============================================
--
-- Safe index creation with existence checks
--
-- ============================================

-- Helper function to safely create indexes
DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    -- AVAILABILITIES indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'availabilities') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_availabilities_user_id ON availabilities(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_availabilities_date ON availabilities(date)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_availabilities_user_id_date ON availabilities(user_id, date)';
    END IF;

    -- JOB_POSTINGS indexes (only for existing columns)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_postings') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_postings' AND column_name = 'establishment_id') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_job_postings_establishment_id ON job_postings(establishment_id)';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_postings' AND column_name = 'is_active') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_job_postings_is_active ON job_postings(is_active)';
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_postings' AND column_name = 'created_at') THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_job_postings_is_active_created_at ON job_postings(is_active, created_at DESC)';
            END IF;
        END IF;
    END IF;

    -- EXPERIENCES indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'experiences') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON experiences(user_id)';
    END IF;

    -- FORMATIONS indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'formations') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_formations_user_id ON formations(user_id)';
    END IF;

    -- TRAINER_STUDENTS indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trainer_students') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_trainer_students_trainer_id ON trainer_students(trainer_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_trainer_students_student_id ON trainer_students(student_id)';
    END IF;

    -- PROFILES indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'profile_type') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_profiles_profile_type ON profiles(profile_type)';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_active') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active)';
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'profile_type') THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_profiles_profile_type_is_active ON profiles(profile_type, is_active)';
            END IF;
        END IF;
    END IF;

    -- SSS_FORMATIONS_CACHE indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sss_formations_cache') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sss_formations_cache' AND column_name = 'active') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sss_formations_cache_active ON sss_formations_cache(active)';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sss_formations_cache' AND column_name = 'debut') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sss_formations_cache_debut ON sss_formations_cache(debut)';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sss_formations_cache' AND column_name = 'active') AND
           EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sss_formations_cache' AND column_name = 'debut') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sss_formations_cache_active_debut ON sss_formations_cache(active, debut)';
        END IF;
    END IF;

    -- ADMIN_AUDIT_LOGS indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_audit_logs') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'admin_email') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_email ON admin_audit_logs(admin_email)';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'action') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action)';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'created_at') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC)';
        END IF;
    END IF;

    -- MESSAGES indexes (when table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)';
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_read') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read)';
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_receiver_id_is_read ON messages(receiver_id, is_read)';
        END IF;
    END IF;

END $$;
