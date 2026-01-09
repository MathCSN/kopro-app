-- Allow public read access to residences for QR code landing pages
-- This is safe because residences are meant to be discoverable via QR codes
CREATE POLICY "Public can view residences for landing pages" 
ON public.residences 
FOR SELECT 
TO anon
USING (true);