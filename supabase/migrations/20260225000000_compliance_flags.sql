-- Compliance monitoring: flags from Grok output scans
CREATE TABLE IF NOT EXISTS compliance_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  route TEXT NOT NULL,
  query TEXT,
  output TEXT,
  flags JSONB NOT NULL DEFAULT '[]',
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_compliance_flags_created_at ON compliance_flags(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_flags_severity ON compliance_flags(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_flags_route ON compliance_flags(route);
CREATE INDEX IF NOT EXISTS idx_compliance_flags_acknowledged ON compliance_flags(acknowledged);

ALTER TABLE compliance_flags ENABLE ROW LEVEL SECURITY;

-- No policies: access only via service role (createSupabaseAdminClient) from API routes
-- Regular users cannot read/write. Admin endpoint uses admin client.

COMMENT ON TABLE compliance_flags IS 'Internal compliance monitoring: flags from Grok output scans. Admin-only access via service role.';
