-- Allow public read access to buildings for QR code landing pages
-- This is safe because buildings are meant to be discoverable via QR codes
CREATE POLICY "Public can view buildings for landing pages" 
ON public.buildings 
FOR SELECT 
TO anon
USING (true);