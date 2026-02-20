-- Supplement analyses cache and lookup log for commonly looked-up products,
-- future sales/discount monitoring, and cache hits to reduce API calls.

-- Cache: stores analysis results keyed by user + input (personalized by stack)
CREATE TABLE supplement_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cache_key TEXT NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('barcode', 'url', 'text', 'image')),
  input_summary TEXT NOT NULL,
  barcode TEXT,
  product_url TEXT,
  product_name TEXT,
  response_json JSONB NOT NULL,
  lookup_count INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, cache_key)
);

CREATE INDEX idx_supplement_analyses_user_cache ON supplement_analyses (user_id, cache_key);
CREATE INDEX idx_supplement_analyses_barcode ON supplement_analyses (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_supplement_analyses_product_url ON supplement_analyses (product_url) WHERE product_url IS NOT NULL;
CREATE INDEX idx_supplement_analyses_lookup_count ON supplement_analyses (lookup_count DESC);

COMMENT ON TABLE supplement_analyses IS 'Cached supplement analysis results. Cache key is user_id + normalized input for personalized stack interactions.';
COMMENT ON COLUMN supplement_analyses.input_summary IS 'Human-readable input: barcode value, URL, or truncated text for display.';
COMMENT ON COLUMN supplement_analyses.lookup_count IS 'Incremented on cache hit. Tracks how often this analysis was reused.';

-- Log: every supplement lookup for analytics, sales monitoring, discount tracking
CREATE TABLE supplement_lookup_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_id UUID REFERENCES supplement_analyses(id) ON DELETE SET NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('barcode', 'url', 'text', 'image')),
  input_summary TEXT NOT NULL,
  barcode TEXT,
  product_url TEXT,
  product_name TEXT,
  was_cache_hit BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_supplement_lookup_log_user ON supplement_lookup_log (user_id);
CREATE INDEX idx_supplement_lookup_log_created ON supplement_lookup_log (created_at DESC);
CREATE INDEX idx_supplement_lookup_log_barcode ON supplement_lookup_log (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_supplement_lookup_log_product_url ON supplement_lookup_log (product_url) WHERE product_url IS NOT NULL;

COMMENT ON TABLE supplement_lookup_log IS 'Audit log of every supplement lookup for analytics and future sales/discount monitoring.';

-- RLS
ALTER TABLE supplement_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_lookup_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own supplement_analyses"
  ON supplement_analyses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own supplement_lookup_log"
  ON supplement_lookup_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplement_lookup_log"
  ON supplement_lookup_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);
