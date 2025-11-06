-- Create music storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('music', 'music', true);

-- Create music table
CREATE TABLE public.music (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  storage_path TEXT,
  prompt TEXT,
  likes_count INTEGER DEFAULT 0,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on music
ALTER TABLE public.music ENABLE ROW LEVEL SECURITY;

-- RLS policies for music
CREATE POLICY "Musiqalarni hamma ko'rishi mumkin"
ON public.music
FOR SELECT
USING (true);

CREATE POLICY "Foydalanuvchi o'z musiqasini yuklashi mumkin"
ON public.music
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Foydalanuvchi o'z musiqasini yangilashi mumkin"
ON public.music
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Foydalanuvchi o'z musiqasini o'chirishi mumkin"
ON public.music
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for music bucket
CREATE POLICY "Musiqalarni hamma eshitishi mumkin"
ON storage.objects
FOR SELECT
USING (bucket_id = 'music');

CREATE POLICY "Foydalanuvchi o'z musiqasini yuklashi mumkin"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'music' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Foydalanuvchi o'z musiqasini o'chirishi mumkin"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'music' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create music_tags table
CREATE TABLE public.music_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  music_id UUID NOT NULL REFERENCES public.music(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(music_id, tag_id)
);

-- Enable RLS on music_tags
ALTER TABLE public.music_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for music_tags
CREATE POLICY "Music_tags ni hamma ko'rishi mumkin"
ON public.music_tags
FOR SELECT
USING (true);

CREATE POLICY "Musiqa egasi teg qo'shishi mumkin"
ON public.music_tags
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.music
    WHERE music.id = music_tags.music_id
    AND music.user_id = auth.uid()
  )
);

CREATE POLICY "Musiqa egasi tegni o'chirishi mumkin"
ON public.music_tags
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.music
    WHERE music.id = music_tags.music_id
    AND music.user_id = auth.uid()
  )
);

-- Create music_likes table
CREATE TABLE public.music_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  music_id UUID NOT NULL REFERENCES public.music(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(music_id, user_id)
);

-- Enable RLS on music_likes
ALTER TABLE public.music_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for music_likes
CREATE POLICY "Foydalanuvchi like qo'shishi mumkin"
ON public.music_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Foydalanuvchi o'z like'ini o'chirishi mumkin"
ON public.music_likes
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view music likes"
ON public.music_likes
FOR SELECT
USING (true);

-- Trigger for music likes count
CREATE OR REPLACE FUNCTION public.update_music_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.music SET likes_count = likes_count + 1 WHERE id = NEW.music_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.music SET likes_count = likes_count - 1 WHERE id = OLD.music_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER music_likes_count_trigger
AFTER INSERT OR DELETE ON public.music_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_music_likes_count();

-- Create music_comments table
CREATE TABLE public.music_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  music_id UUID NOT NULL REFERENCES public.music(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on music_comments
ALTER TABLE public.music_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for music_comments
CREATE POLICY "Sharhlarni hamma ko'rishi mumkin"
ON public.music_comments
FOR SELECT
USING (true);

CREATE POLICY "Foydalanuvchi sharh yozishi mumkin"
ON public.music_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Foydalanuvchi o'z sharhini o'chirishi mumkin"
ON public.music_comments
FOR DELETE
USING (auth.uid() = user_id);