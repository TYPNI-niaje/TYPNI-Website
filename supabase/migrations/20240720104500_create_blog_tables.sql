-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true);

-- Create policy to allow authenticated users to upload blog images
CREATE POLICY "Allow authenticated users to upload blog images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Create policy to allow authenticated users to update blog images
CREATE POLICY "Allow authenticated users to update blog images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'blog-images');

-- Create policy to allow authenticated users to delete blog images
CREATE POLICY "Allow authenticated users to delete blog images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'blog-images');

-- Create policy to allow public access to blog images
CREATE POLICY "Allow public access to blog images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'blog-images');

-- Create blogs table
CREATE TABLE public.blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('published', 'draft', 'scheduled')),
  thumbnail_url TEXT,
  publish_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for blogs updated_at
CREATE TRIGGER handle_blog_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_blog_updated_at();

-- Enable Row Level Security
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Blogs are viewable by everyone"
  ON public.blogs FOR SELECT
  USING (true);

CREATE POLICY "Users with admin role can insert blogs"
  ON public.blogs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users with admin role can update blogs"
  ON public.blogs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users with admin role can delete blogs"
  ON public.blogs FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  ); 