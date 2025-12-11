-- 1. Rollar uchun enum yaratish
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. User roles jadvali yaratish
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- 3. RLS yoqish
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security Definer Funksiya (Recursive RLS oldini olish uchun)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Admin rolini tayinlash
INSERT INTO public.user_roles (user_id, role)
VALUES ('d663ef54-0cc6-4d15-a462-494f5580434e', 'admin');

-- 6. User Roles RLS Policies
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Admin DELETE policies for content tables
CREATE POLICY "Admin can delete any image"
ON public.images FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete any video"
ON public.videos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete any music"
ON public.music FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Admin policies for profiles
CREATE POLICY "Admin can delete any profile"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));