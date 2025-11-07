-- Add security questions to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS security_question_1 TEXT,
ADD COLUMN IF NOT EXISTS security_answer_1 TEXT,
ADD COLUMN IF NOT EXISTS security_question_2 TEXT,
ADD COLUMN IF NOT EXISTS security_answer_2 TEXT,
ADD COLUMN IF NOT EXISTS security_question_3 TEXT,
ADD COLUMN IF NOT EXISTS security_answer_3 TEXT;

-- Add comment explaining the security questions
COMMENT ON COLUMN public.profiles.security_question_1 IS 'Security question: What is your favourite food?';
COMMENT ON COLUMN public.profiles.security_question_2 IS 'Security question: What was your childhood name?';
COMMENT ON COLUMN public.profiles.security_question_3 IS 'Security question: Which is your favourite colour?';