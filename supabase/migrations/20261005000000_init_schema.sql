-- ====================================================================
-- TESTPLATFORM PRO - SUPABASE POSTGRESQL DATABASE SCHEMA & MIGRATION
-- Loyiha: Professional Online Test Platformasi
-- Versiya: 1.0.0
-- Muallif: Senior Database Architect
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('SINGLE_CHOICE', 'TRUE_FALSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM ('in_progress', 'completed', 'expired', 'reset');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. TABLES CREATION

-- 4.1 PROFILES (Foydalanuvchilar profili)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    role user_role NOT NULL DEFAULT 'student',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    telegram_chat_id BIGINT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 GROUPS (Guruhlar)
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.3 GROUP MEMBERS (Guruh a'zolari)
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, student_id)
);

-- 4.4 TESTS (Testlar)
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
    max_attempts INT NOT NULL DEFAULT 1 CHECK (max_attempts > 0),
    passing_percentage NUMERIC(5,2) NOT NULL DEFAULT 60.00 CHECK (passing_percentage >= 0 AND passing_percentage <= 100),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    shuffle_questions BOOLEAN NOT NULL DEFAULT true,
    shuffle_options BOOLEAN NOT NULL DEFAULT true,
    show_correct_answers_after_test BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.5 TEST GROUPS (Testga biriktirilgan guruhlar - bitta yoki bir nechta)
CREATE TABLE IF NOT EXISTS test_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(test_id, group_id)
);

-- 4.6 QUESTIONS (Savollar)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    type question_type NOT NULL DEFAULT 'SINGLE_CHOICE',
    question_text TEXT NOT NULL,
    points INT NOT NULL DEFAULT 1 CHECK (points > 0),
    explanation TEXT,
    order_num INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.7 QUESTION OPTIONS (Savol variantlari: A, B, C, D yoki To'g'ri / Noto'g'ri)
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_letter VARCHAR(5) NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_num INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.8 TEST ATTEMPTS (Test topshirish urinishlari)
CREATE TABLE IF NOT EXISTS test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    server_end_time TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    status attempt_status NOT NULL DEFAULT 'in_progress',
    score NUMERIC(6,2) DEFAULT 0,
    max_score NUMERIC(6,2) DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0,
    passed BOOLEAN DEFAULT false,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.9 ANSWERS (O'quvchi belgilagan javoblar)
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
    answer_text TEXT,
    is_correct BOOLEAN,
    points_earned NUMERIC(5,2) DEFAULT 0,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- 4.10 TEST RESULTS (Yakuniy hisoblangan natijalar)
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL UNIQUE REFERENCES test_attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    earned_points NUMERIC(6,2) NOT NULL DEFAULT 0,
    max_points NUMERIC(6,2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    duration_seconds INT NOT NULL DEFAULT 0,
    tab_switch_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.11 TAB SWITCH EVENTS (Boshqa oynaga o'tishlar monitoringi)
CREATE TABLE IF NOT EXISTS tab_switch_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.12 TELEGRAM VERIFICATIONS (Telegram orqali 1 martalik login kodi)
CREATE TABLE IF NOT EXISTS telegram_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    telegram_chat_id BIGINT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.13 NOTIFICATIONS (Bildirishnomalar)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PERFORMANCE INDEXES (500+ bir vaqtdagi foydalanuvchilar yuklamasi uchun)
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_group_members_student ON group_members(student_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_test_groups_group ON test_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_test_groups_test ON test_groups(test_id);
CREATE INDEX IF NOT EXISTS idx_tests_teacher ON tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tests_active ON tests(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_test ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_student_test ON test_attempts(student_id, test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_status ON test_attempts(status);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_test_results_student ON test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_created ON test_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tab_switch_attempt ON tab_switch_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_telegram_verifications_phone_code ON telegram_verifications(phone, is_used, expires_at);

-- 6. TRIGGERS FOR UPDATED_AT
CREATE TRIGGER trigger_update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_tests_updated_at BEFORE UPDATE ON tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_test_attempts_updated_at BEFORE UPDATE ON test_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tab_switch_events ENABLE ROW LEVEL SECURITY;

-- 7.1 Profiles RLS
CREATE POLICY "Profiles read by owner or teacher" ON profiles
    FOR SELECT USING (
        auth.uid() = auth_user_id 
        OR EXISTS (
            SELECT 1 FROM profiles p WHERE p.auth_user_id = auth.uid() AND p.role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Profiles update by owner" ON profiles
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- 7.2 Groups RLS
CREATE POLICY "Teacher manage own groups" ON groups
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = groups.teacher_id AND p.auth_user_id = auth.uid())
    );

CREATE POLICY "Students view groups they belong to" ON groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members gm 
            JOIN profiles p ON gm.student_id = p.id 
            WHERE gm.group_id = groups.id AND p.auth_user_id = auth.uid()
        )
    );

-- 7.3 Tests RLS
CREATE POLICY "Teacher manage own tests" ON tests
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = tests.teacher_id AND p.auth_user_id = auth.uid())
    );

CREATE POLICY "Students view assigned tests" ON tests
    FOR SELECT USING (
        is_active = true AND EXISTS (
            SELECT 1 FROM test_groups tg
            JOIN group_members gm ON tg.group_id = gm.group_id
            JOIN profiles p ON gm.student_id = p.id
            WHERE tg.test_id = tests.id AND p.auth_user_id = auth.uid()
        )
    );

-- 7.4 Test Attempts RLS
CREATE POLICY "Students create and view own attempts" ON test_attempts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = test_attempts.student_id AND p.auth_user_id = auth.uid())
    );

CREATE POLICY "Teacher view attempts of their tests" ON test_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tests t 
            JOIN profiles p ON t.teacher_id = p.id 
            WHERE t.id = test_attempts.test_id AND p.auth_user_id = auth.uid()
        )
    );

-- 7.5 Test Results RLS
CREATE POLICY "Students view own test results" ON test_results
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = test_results.student_id AND p.auth_user_id = auth.uid())
    );

CREATE POLICY "Teacher view results of their tests" ON test_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tests t 
            JOIN profiles p ON t.teacher_id = p.id 
            WHERE t.id = test_results.test_id AND p.auth_user_id = auth.uid()
        )
    );

-- 7.6 Tab Switch Events RLS
CREATE POLICY "Students insert tab switches" ON tab_switch_events
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = tab_switch_events.student_id AND p.auth_user_id = auth.uid())
    );

CREATE POLICY "Teacher view tab switches" ON tab_switch_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM test_attempts ta
            JOIN tests t ON ta.test_id = t.id
            JOIN profiles p ON t.teacher_id = p.id
            WHERE ta.id = tab_switch_events.attempt_id AND p.auth_user_id = auth.uid()
        )
    );
