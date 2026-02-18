-- Add metadata columns to bloodwork_reports for extracted test info
ALTER TABLE bloodwork_reports ADD COLUMN IF NOT EXISTS lab_source TEXT;
ALTER TABLE bloodwork_reports ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE bloodwork_reports ADD COLUMN IF NOT EXISTS other_metadata JSONB;

COMMENT ON COLUMN bloodwork_reports.lab_source IS 'Lab name/source (e.g., Quest, LabCorp) - extracted from report or user input';
COMMENT ON COLUMN bloodwork_reports.location IS 'Location (e.g., Phoenix, AZ) - extracted from report';
COMMENT ON COLUMN bloodwork_reports.other_metadata IS 'Additional extracted metadata (patient_notes, verification_needed, etc.)';
