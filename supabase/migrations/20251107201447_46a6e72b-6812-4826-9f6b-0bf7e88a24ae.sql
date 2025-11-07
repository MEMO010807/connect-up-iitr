-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  branch TEXT NOT NULL,
  year INTEGER NOT NULL,
  hobbies TEXT[] DEFAULT '{}',
  bio TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table (tracks who liked whom)
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  liked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(liker_id, liked_id)
);

-- Create matches table (mutual likes)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

-- Create messages table for chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for likes
CREATE POLICY "Users can view their likes"
  ON public.likes FOR SELECT
  TO authenticated
  USING (auth.uid() = liker_id OR auth.uid() = liked_id);

CREATE POLICY "Users can create likes"
  ON public.likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "Users can delete own likes"
  ON public.likes FOR DELETE
  TO authenticated
  USING (auth.uid() = liker_id);

-- RLS Policies for matches
CREATE POLICY "Users can view their matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for messages
CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Function to automatically create a match when mutual like happens
CREATE OR REPLACE FUNCTION public.check_and_create_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mutual_like_exists BOOLEAN;
  user1 UUID;
  user2 UUID;
BEGIN
  -- Check if the other user already liked this user
  SELECT EXISTS(
    SELECT 1 FROM public.likes
    WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id
  ) INTO mutual_like_exists;

  IF mutual_like_exists THEN
    -- Create match with user1_id < user2_id constraint
    IF NEW.liker_id < NEW.liked_id THEN
      user1 := NEW.liker_id;
      user2 := NEW.liked_id;
    ELSE
      user1 := NEW.liked_id;
      user2 := NEW.liker_id;
    END IF;

    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (user1, user2)
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to check for matches after a like
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_create_match();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, branch, year, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'branch', ''),
    COALESCE((NEW.raw_user_meta_data->>'year')::INTEGER, 1),
    COALESCE(NEW.raw_user_meta_data->>'bio', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own profile picture"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can update own profile picture"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own profile picture"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);