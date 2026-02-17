-- Add full scientific breakdown columns to compounds table
ALTER TABLE compounds ADD COLUMN IF NOT EXISTS full_breakdown_json JSONB;
ALTER TABLE compounds ADD COLUMN IF NOT EXISTS breakdown_updated_at TIMESTAMP WITH TIME ZONE;
