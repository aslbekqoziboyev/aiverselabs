-- Add foreign key constraint to videos table
ALTER TABLE public.videos
ADD CONSTRAINT videos_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;