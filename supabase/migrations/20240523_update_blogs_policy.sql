-- Update the blogs policy to check for admin role in profiles table
DROP POLICY IF EXISTS "Users with admin role can insert blogs" ON "public"."blogs";

CREATE POLICY "Users with admin role can insert blogs" ON "public"."blogs" 
FOR INSERT TO "authenticated" 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."profiles"
    WHERE ("profiles"."id" = "auth"."uid"())
    AND ("profiles"."role" = 'Admin')
  )
);

-- Update other blog policies for consistency
DROP POLICY IF EXISTS "Users with admin role can update blogs" ON "public"."blogs";

CREATE POLICY "Users with admin role can update blogs" ON "public"."blogs"
FOR UPDATE TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles"
    WHERE ("profiles"."id" = "auth"."uid"())
    AND ("profiles"."role" = 'Admin')
  )
);

DROP POLICY IF EXISTS "Users with admin role can delete blogs" ON "public"."blogs";

CREATE POLICY "Users with admin role can delete blogs" ON "public"."blogs"
FOR DELETE TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles"
    WHERE ("profiles"."id" = "auth"."uid"())
    AND ("profiles"."role" = 'Admin')
  )
); 