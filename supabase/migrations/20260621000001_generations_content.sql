-- Add content storage and naming to the generations table
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS name text;

-- Allow users to delete their own generations (for history management)
CREATE POLICY "Users can delete own generations"
  ON public.generations FOR DELETE
  USING (auth.uid() = user_id);

-- Allow users to update the name of their own generations
CREATE POLICY "Users can update own generation name"
  ON public.generations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
