-- Bloodwork history AI analyses (saved for user access and deletion)
CREATE TABLE IF NOT EXISTS bloodwork_history_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trend_summary TEXT,
  pattern_notes JSONB DEFAULT '[]',
  marker_insights JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bloodwork_history_analyses_user_id ON bloodwork_history_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_history_analyses_created_at ON bloodwork_history_analyses(created_at DESC);

ALTER TABLE bloodwork_history_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own bloodwork history analyses" ON bloodwork_history_analyses;
CREATE POLICY "Users can view their own bloodwork history analyses"
  ON bloodwork_history_analyses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own bloodwork history analyses" ON bloodwork_history_analyses;
CREATE POLICY "Users can insert their own bloodwork history analyses"
  ON bloodwork_history_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bloodwork history analyses" ON bloodwork_history_analyses;
CREATE POLICY "Users can delete their own bloodwork history analyses"
  ON bloodwork_history_analyses FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE bloodwork_history_analyses IS 'Saved AI trend analyses for bloodwork history. User can access and delete.';
