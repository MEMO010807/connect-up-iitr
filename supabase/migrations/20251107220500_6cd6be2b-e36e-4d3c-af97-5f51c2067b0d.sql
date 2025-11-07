-- Add read status to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on read status
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at);