-- Run this SQL command in your Supabase SQL Editor to add the expires_at column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Optional: Set expiration for existing published jobs to 30 days from their publication
UPDATE jobs 
SET expires_at = published_at + INTERVAL '30 days' 
WHERE status = 'published' AND expires_at IS NULL;

-- Create platform_notes table for Admin Dashboard
CREATE TABLE IF NOT EXISTS platform_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    is_done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES profiles(user_id)
);

-- Enable RLS
ALTER TABLE platform_notes ENABLE ROW LEVEL SECURITY;

-- Add policy (Drop if exists first for idempotency)
DROP POLICY IF EXISTS "Admins can do everything with platform_notes" ON platform_notes;
CREATE POLICY "Admins can do everything with platform_notes" ON platform_notes
    FOR ALL
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Ensure is_done column exists in platform_notes if table was created earlier
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='platform_notes' AND column_name='is_done') THEN
        ALTER TABLE platform_notes ADD COLUMN is_done BOOLEAN DEFAULT FALSE;
    END IF;
END $$;


