-- Create residence documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('residence-documents', 'residence-documents', false, 52428800) -- 50MB
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Managers can upload residence documents
CREATE POLICY "Managers can upload residence documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'residence-documents' AND
  public.can_manage_rental(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Storage policy: Residence members can view documents
CREATE POLICY "Residence members can view documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'residence-documents' AND
  public.has_residence_access(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Storage policy: Managers can update residence documents
CREATE POLICY "Managers can update residence documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'residence-documents' AND
  public.can_manage_rental(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Storage policy: Managers can delete residence documents
CREATE POLICY "Managers can delete residence documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'residence-documents' AND
  public.can_manage_rental(auth.uid(), (storage.foldername(name))[1]::uuid)
);