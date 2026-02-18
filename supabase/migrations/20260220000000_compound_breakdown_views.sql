-- compound_breakdown_views: track which compounds users view for anonymized aggregation
-- Used by aggregateTrends to include compound interest from breakdown page views
CREATE TABLE IF NOT EXISTS compound_breakdown_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  compound_id UUID REFERENCES compounds(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: users can only insert their own views; no SELECT for users (aggregation uses service role)
ALTER TABLE compound_breakdown_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own compound views" ON compound_breakdown_views;
CREATE POLICY "Users can insert own compound views"
  ON compound_breakdown_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for aggregation queries
CREATE INDEX IF NOT EXISTS idx_compound_breakdown_views_user_id ON compound_breakdown_views(user_id);
CREATE INDEX IF NOT EXISTS idx_compound_breakdown_views_compound_id ON compound_breakdown_views(compound_id);
CREATE INDEX IF NOT EXISTS idx_compound_breakdown_views_viewed_at ON compound_breakdown_views(viewed_at);
