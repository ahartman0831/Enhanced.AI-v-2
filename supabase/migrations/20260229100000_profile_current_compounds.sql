-- Add current compounds to profile for prefill in confirm dialogs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_compounds_json JSONB DEFAULT NULL;

COMMENT ON COLUMN profiles.current_compounds_json IS 'User current compounds + dosages for prefill in Results Forecaster, Recovery Timeline, etc. Structure: { compounds: string[], compoundDosages: Record<...>, dosageNotes?: string }';
