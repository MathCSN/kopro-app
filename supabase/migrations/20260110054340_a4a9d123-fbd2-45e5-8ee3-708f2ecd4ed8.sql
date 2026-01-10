-- Create storage bucket for marketplace images
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-images', 'marketplace-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload marketplace images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'marketplace-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to marketplace images
CREATE POLICY "Marketplace images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'marketplace-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own marketplace images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'marketplace-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);