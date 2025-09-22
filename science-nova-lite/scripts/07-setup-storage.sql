-- Set up Supabase Storage buckets and policies
-- Run this seventh to set up file storage

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('textbook_content', 'Textbook Content', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('user_uploads', 'User Uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for textbook_content bucket
CREATE POLICY "Anyone can read textbook content"
ON storage.objects FOR SELECT
USING (bucket_id = 'textbook_content');

CREATE POLICY "Only admins can insert textbook content"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'textbook_content' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
);

CREATE POLICY "Only admins can update textbook content"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'textbook_content' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
);

CREATE POLICY "Only admins can delete textbook content"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'textbook_content' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
);

-- Storage policies for user_uploads bucket
CREATE POLICY "Users can read their own uploads"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'user_uploads' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
     (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN')
);

CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'user_uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'user_uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'user_uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
