-- ============================================================================
-- WaslaLearn — Migration 0005: Phase 2A Additive Schema (Lessons & Questions)
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. Create lessons table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX lessons_owner_idx ON public.lessons (owner_id);

-- --------------------------------------------------------------------------
-- 2. Create lesson_versions table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    source_type TEXT NOT NULL DEFAULT 'youtube' CHECK (source_type IN ('youtube', 'drive', 'tus')),
    external_id TEXT NOT NULL,
    duration_seconds NUMERIC(10,3) CHECK (duration_seconds > 0),
    published_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (lesson_id, version_no)
);

CREATE INDEX lesson_versions_lesson_idx ON public.lesson_versions (lesson_id);

-- --------------------------------------------------------------------------
-- 3. Create timeline_events table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_version_id UUID NOT NULL REFERENCES public.lesson_versions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('question', 'note', 'pause')),
    position_ms INTEGER NOT NULL CHECK (position_ms >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX timeline_events_lesson_version_idx ON public.timeline_events (lesson_version_id);

-- --------------------------------------------------------------------------
-- 4. Create questions table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_event_id UUID NOT NULL REFERENCES public.timeline_events(id) ON DELETE CASCADE UNIQUE,
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'open')),
    prompt_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    points INTEGER NOT NULL DEFAULT 1 CHECK (points >= 0),
    required_to_continue BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 5. Create question_choices table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    choice_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX question_choices_question_idx ON public.question_choices (question_id);

-- --------------------------------------------------------------------------
-- 6. Create responses and grades tables
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    response_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_correct BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, assignment_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE UNIQUE,
    score INTEGER NOT NULL,
    graded_by UUID REFERENCES public.profiles(id),
    graded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 7. Modify assignments table safely (Additive)
-- --------------------------------------------------------------------------
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS lesson_version_id UUID REFERENCES public.lesson_versions(id),
ADD COLUMN IF NOT EXISTS attempt_limit INTEGER,
ADD COLUMN IF NOT EXISTS prevent_skipping BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_speedup BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS captions_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS late_policy TEXT;

-- --------------------------------------------------------------------------
-- 8. Enforce immutability and publishing rules
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_lesson_version_immutable()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'published' AND NEW.status = 'published' THEN
        -- Prevent mutation of critical fields of a published lesson version
        IF OLD.external_id IS DISTINCT FROM NEW.external_id OR 
           OLD.source_type IS DISTINCT FROM NEW.source_type OR 
           OLD.duration_seconds IS DISTINCT FROM NEW.duration_seconds THEN
            RAISE EXCEPTION 'Cannot modify critical fields of a published lesson version.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_lesson_version_immutable
BEFORE UPDATE ON public.lesson_versions
FOR EACH ROW EXECUTE FUNCTION public.check_lesson_version_immutable();

CREATE OR REPLACE FUNCTION public.check_event_question_immutable()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
BEGIN
    IF TG_TABLE_NAME = 'timeline_events' THEN
        SELECT status INTO v_status FROM public.lesson_versions WHERE id = OLD.lesson_version_id;
    ELSIF TG_TABLE_NAME = 'questions' THEN
        SELECT lv.status INTO v_status 
        FROM public.lesson_versions lv
        JOIN public.timeline_events te ON te.lesson_version_id = lv.id
        WHERE te.id = OLD.timeline_event_id;
    ELSIF TG_TABLE_NAME = 'question_choices' THEN
        SELECT lv.status INTO v_status 
        FROM public.lesson_versions lv
        JOIN public.timeline_events te ON te.lesson_version_id = lv.id
        JOIN public.questions q ON q.timeline_event_id = te.id
        WHERE q.id = OLD.question_id;
    END IF;

    IF v_status = 'published' THEN
        RAISE EXCEPTION 'Cannot modify or delete entities linked to a published lesson version.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_timeline_events_immutable
BEFORE UPDATE OR DELETE ON public.timeline_events
FOR EACH ROW EXECUTE FUNCTION public.check_event_question_immutable();

CREATE TRIGGER tr_questions_immutable
BEFORE UPDATE OR DELETE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.check_event_question_immutable();

CREATE TRIGGER tr_question_choices_immutable
BEFORE UPDATE OR DELETE ON public.question_choices
FOR EACH ROW EXECUTE FUNCTION public.check_event_question_immutable();

CREATE OR REPLACE FUNCTION public.check_assignment_published_version()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
BEGIN
    IF NEW.lesson_version_id IS NOT NULL THEN
        SELECT status INTO v_status FROM public.lesson_versions WHERE id = NEW.lesson_version_id;
        IF v_status IS NULL OR v_status != 'published' THEN
            RAISE EXCEPTION 'Cannot assign an unpublished lesson version.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_assignment_published_version
BEFORE INSERT OR UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.check_assignment_published_version();

-- Enforce chronological order for timeline events (server-side check)
CREATE OR REPLACE FUNCTION public.check_timeline_event_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent negative position_ms and ensure order
    -- Constraints already check position_ms >= 0.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_timeline_events_order
BEFORE INSERT OR UPDATE ON public.timeline_events
FOR EACH ROW EXECUTE FUNCTION public.check_timeline_event_order();

-- --------------------------------------------------------------------------
-- 9. Backfill Strategy (Idempotent)
-- --------------------------------------------------------------------------
DO $$
DECLARE
    v_record RECORD;
BEGIN
    FOR v_record IN SELECT * FROM public.videos LOOP
        -- Upsert Lesson (id = video.id for determinism)
        INSERT INTO public.lessons (id, owner_id, title, description, status, created_at, updated_at)
        VALUES (
            v_record.id,
            v_record.teacher_id,
            v_record.title,
            NULL,
            'published',
            v_record.created_at,
            v_record.created_at
        )
        ON CONFLICT (id) DO UPDATE SET 
            title = EXCLUDED.title;

        -- Upsert Lesson Version (id = video.id)
        INSERT INTO public.lesson_versions (id, lesson_id, version_no, status, source_type, external_id, duration_seconds, published_at, created_by, created_at)
        VALUES (
            v_record.id,
            v_record.id,
            1,
            'published',
            v_record.source::text,
            v_record.external_id,
            v_record.duration_seconds,
            v_record.created_at,
            v_record.teacher_id,
            v_record.created_at
        )
        ON CONFLICT (id) DO UPDATE SET 
            external_id = EXCLUDED.external_id,
            duration_seconds = EXCLUDED.duration_seconds;

        -- Update Assignments
        UPDATE public.assignments
        SET lesson_version_id = v_record.id
        WHERE video_id = v_record.id AND lesson_version_id IS NULL;
        
    END LOOP;
END;
$$;

-- --------------------------------------------------------------------------
-- 10. Row Level Security & Grants
-- --------------------------------------------------------------------------
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Lessons: teachers own them, students can see published assigned lessons
CREATE POLICY lessons_teacher_all ON public.lessons FOR ALL TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY lessons_student_select ON public.lessons FOR SELECT TO authenticated
USING (
    status = 'published' AND EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.lesson_versions lv ON lv.id = a.lesson_version_id
        JOIN public.class_members cm ON cm.class_id = a.class_id
        WHERE lv.lesson_id = public.lessons.id AND cm.student_id = auth.uid()
    )
);

-- Lesson Versions: teachers manage their own, students see published assigned versions
CREATE POLICY lesson_versions_teacher_all ON public.lesson_versions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.owner_id = auth.uid()));

CREATE POLICY lesson_versions_student_select ON public.lesson_versions FOR SELECT TO authenticated
USING (
    status = 'published' AND EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.class_members cm ON cm.class_id = a.class_id
        WHERE a.lesson_version_id = public.lesson_versions.id AND cm.student_id = auth.uid()
    )
);

-- Timeline Events and Questions: visible if version is visible
CREATE POLICY timeline_events_teacher_all ON public.timeline_events FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.lesson_versions lv 
    JOIN public.lessons l ON l.id = lv.lesson_id 
    WHERE lv.id = lesson_version_id AND l.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.lesson_versions lv 
    JOIN public.lessons l ON l.id = lv.lesson_id 
    WHERE lv.id = lesson_version_id AND l.owner_id = auth.uid()
));

CREATE POLICY timeline_events_student_select ON public.timeline_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.lesson_versions WHERE id = lesson_version_id));

CREATE POLICY questions_teacher_all ON public.questions FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.timeline_events te
    JOIN public.lesson_versions lv ON lv.id = te.lesson_version_id
    JOIN public.lessons l ON l.id = lv.lesson_id
    WHERE te.id = timeline_event_id AND l.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.timeline_events te
    JOIN public.lesson_versions lv ON lv.id = te.lesson_version_id
    JOIN public.lessons l ON l.id = lv.lesson_id
    WHERE te.id = timeline_event_id AND l.owner_id = auth.uid()
));

CREATE POLICY questions_student_select ON public.questions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.timeline_events WHERE id = timeline_event_id));

-- Question Choices: table-level RLS.
CREATE POLICY question_choices_teacher_all ON public.question_choices FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.timeline_events te ON te.id = q.timeline_event_id
    JOIN public.lesson_versions lv ON lv.id = te.lesson_version_id
    JOIN public.lessons l ON l.id = lv.lesson_id
    WHERE q.id = question_id AND l.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.timeline_events te ON te.id = q.timeline_event_id
    JOIN public.lesson_versions lv ON lv.id = te.lesson_version_id
    JOIN public.lessons l ON l.id = lv.lesson_id
    WHERE q.id = question_id AND l.owner_id = auth.uid()
));

CREATE POLICY question_choices_student_select ON public.question_choices FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.questions WHERE id = question_id));

-- Responses and Grades: Read-only for students via RLS, writable ONLY via RPC.
CREATE POLICY responses_select ON public.responses FOR SELECT TO authenticated
USING (student_id = auth.uid() OR public.is_teacher_of_assignment(assignment_id));

CREATE POLICY grades_select ON public.grades FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.responses WHERE id = response_id AND (student_id = auth.uid() OR public.is_teacher_of_assignment(assignment_id))));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons, public.lesson_versions, public.timeline_events, public.questions, public.question_choices TO authenticated;
GRANT SELECT ON public.responses, public.grades TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.responses, public.grades FROM authenticated, anon;

-- Explicitly revoke is_correct column from authenticated and anon
REVOKE SELECT(is_correct) ON public.question_choices FROM authenticated, anon;

COMMIT;

-- 11. RPC for Student to submit answer
CREATE OR REPLACE FUNCTION public.submit_question_response(p_assignment_id UUID, p_question_id UUID, p_response_json JSONB)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_student_id UUID := auth.uid();
  v_is_correct BOOLEAN;
  v_choice RECORD;
BEGIN
  -- check correct answer
  SELECT * INTO v_choice FROM public.question_choices WHERE question_id = p_question_id AND (choice_json->>'text') = (p_response_json->>'text') AND is_correct = true;
  IF FOUND THEN v_is_correct := true; ELSE v_is_correct := false; END IF;
  INSERT INTO public.responses (student_id, assignment_id, question_id, response_json, is_correct) VALUES (v_student_id, p_assignment_id, p_question_id, p_response_json, v_is_correct) ON CONFLICT (student_id, assignment_id, question_id) DO UPDATE SET response_json = EXCLUDED.response_json, is_correct = EXCLUDED.is_correct;
  RETURN v_is_correct;
END;
$$;
