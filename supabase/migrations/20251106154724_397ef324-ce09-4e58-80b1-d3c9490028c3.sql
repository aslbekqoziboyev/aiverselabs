-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true);

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  storage_path TEXT,
  prompt TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for videos
CREATE POLICY "Videolarni hamma ko'rishi mumkin"
ON public.videos
FOR SELECT
USING (true);

CREATE POLICY "Foydalanuvchi o'z videosini yuklashi mumkin"
ON public.videos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Foydalanuvchi o'z videosini yangilashi mumkin"
ON public.videos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Foydalanuvchi o'z videosini o'chirishi mumkin"
ON public.videos
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for videos bucket
CREATE POLICY "Videolarni hamma ko'rishi mumkin"
ON storage.objects
FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Foydalanuvchi o'z videosini yuklashi mumkin"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Foydalanuvchi o'z videosini o'chirishi mumkin"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create video_tags table
CREATE TABLE public.video_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, tag_id)
);

-- Enable RLS on video_tags
ALTER TABLE public.video_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_tags
CREATE POLICY "Video_tags ni hamma ko'rishi mumkin"
ON public.video_tags
FOR SELECT
USING (true);

CREATE POLICY "Video egasi teg qo'shishi mumkin"
ON public.video_tags
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.videos
    WHERE videos.id = video_tags.video_id
    AND videos.user_id = auth.uid()
  )
);

CREATE POLICY "Video egasi tegni o'chirishi mumkin"
ON public.video_tags
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.videos
    WHERE videos.id = video_tags.video_id
    AND videos.user_id = auth.uid()
  )
);

-- Create video_likes table
CREATE TABLE public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS on video_likes
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_likes
CREATE POLICY "Foydalanuvchi like qo'shishi mumkin"
ON public.video_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Foydalanuvchi o'z like'ini o'chirishi mumkin"
ON public.video_likes
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view video likes"
ON public.video_likes
FOR SELECT
USING (true);

-- Trigger for video likes count
CREATE OR REPLACE FUNCTION public.update_video_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.videos SET likes_count = likes_count - 1 WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER video_likes_count_trigger
AFTER INSERT OR DELETE ON public.video_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_video_likes_count();

-- Create video_comments table
CREATE TABLE public.video_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on video_comments
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_comments
CREATE POLICY "Sharhlarni hamma ko'rishi mumkin"
ON public.video_comments
FOR SELECT
USING (true);

CREATE POLICY "Foydalanuvchi sharh yozishi mumkin"
ON public.video_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Foydalanuvchi o'z sharhini o'chirishi mumkin"
ON public.video_comments
FOR DELETE
USING (auth.uid() = user_id);