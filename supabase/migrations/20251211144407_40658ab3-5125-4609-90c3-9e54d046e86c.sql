-- Autentifikatsiya qilinmagan foydalanuvchilar uchun profillarni ko'rishni bloklash
CREATE POLICY "Only authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Anonim foydalanuvchilar uchun SELECT ni rad etish uchun permissive policy qo'shish
-- Bu mavjud restrictive policylar bilan birgalikda ishlaydi