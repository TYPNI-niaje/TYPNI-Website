-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own interests" ON public.user_interests;

-- Create new policy that allows users to view their own interests AND admins to view all interests
CREATE POLICY "Users can view own interests and admins can view all"
ON public.user_interests
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'Admin'
  )
); 