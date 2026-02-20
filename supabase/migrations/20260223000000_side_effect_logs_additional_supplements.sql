-- Store additional supplements/information from the cycle/side-effect forms explicitly
ALTER TABLE side_effect_logs ADD COLUMN IF NOT EXISTS additional_supplements TEXT;

COMMENT ON COLUMN side_effect_logs.additional_supplements IS 'User-entered supplements or info from "Additional supplements or information" box (e.g. Fish oil, multivitamin).';
