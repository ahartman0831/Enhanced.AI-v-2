-- Personal dev_mode_enabled flag for hidden feature development
-- Only developers with this flag see unfinished features (e.g. progress photos)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dev_mode_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.dev_mode_enabled IS 'When true, developer sees unfinished features. Set via /admin/dev-toggle.';
