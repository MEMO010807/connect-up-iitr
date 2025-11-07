-- Fix messages UPDATE policy to use authenticated role instead of public
DROP POLICY IF EXISTS "Users can mark received messages as read" ON messages;

CREATE POLICY "Users can mark received messages as read"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Drop security question columns from profiles table (removing weak password recovery mechanism)
ALTER TABLE profiles 
  DROP COLUMN IF EXISTS security_question_1,
  DROP COLUMN IF EXISTS security_answer_1,
  DROP COLUMN IF EXISTS security_question_2,
  DROP COLUMN IF EXISTS security_answer_2,
  DROP COLUMN IF EXISTS security_question_3,
  DROP COLUMN IF EXISTS security_answer_3;