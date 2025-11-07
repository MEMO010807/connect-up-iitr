-- Allow users to update read_at for messages they receive
CREATE POLICY "Users can mark received messages as read"
ON public.messages
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);