-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  age INTEGER,
  sex TEXT,
  weight_kg FLOAT,
  goals TEXT,
  experience_level TEXT,
  risk_tolerance TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhanced_protocols table
CREATE TABLE IF NOT EXISTS enhanced_protocols (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stack_json JSONB NOT NULL,
  nutrition_impact JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bloodwork_reports table
CREATE TABLE IF NOT EXISTS bloodwork_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_date DATE NOT NULL,
  raw_json JSONB NOT NULL,
  flags JSONB,
  projection JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photo_reports table
CREATE TABLE IF NOT EXISTS photo_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  front_url TEXT,
  side_url TEXT,
  back_url TEXT,
  analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token_usage_log table
CREATE TABLE IF NOT EXISTS token_usage_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_name TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create compounds table
CREATE TABLE IF NOT EXISTS compounds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  common_uses TEXT,
  risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 10),
  affected_systems TEXT[],
  key_monitoring_markers TEXT[],
  nutrition_impact_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create side_effect_logs table
CREATE TABLE IF NOT EXISTS side_effect_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  compounds TEXT[] NOT NULL,
  dosages TEXT,
  side_effects TEXT[] NOT NULL,
  analysis_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - idempotent
DO $$
BEGIN
    -- Enable RLS only if not already enabled
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'profiles' AND n.nspname = 'public' AND c.relrowsecurity = false) THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'enhanced_protocols' AND n.nspname = 'public' AND c.relrowsecurity = false) THEN
        ALTER TABLE enhanced_protocols ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'bloodwork_reports' AND n.nspname = 'public' AND c.relrowsecurity = false) THEN
        ALTER TABLE bloodwork_reports ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'photo_reports' AND n.nspname = 'public' AND c.relrowsecurity = false) THEN
        ALTER TABLE photo_reports ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'token_usage_log' AND n.nspname = 'public' AND c.relrowsecurity = false) THEN
        ALTER TABLE token_usage_log ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'side_effect_logs' AND n.nspname = 'public' AND c.relrowsecurity = false) THEN
        ALTER TABLE side_effect_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for enhanced_protocols
DROP POLICY IF EXISTS "Users can view their own protocols" ON enhanced_protocols;
CREATE POLICY "Users can view their own protocols"
  ON enhanced_protocols FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own protocols" ON enhanced_protocols;
CREATE POLICY "Users can insert their own protocols"
  ON enhanced_protocols FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own protocols" ON enhanced_protocols;
CREATE POLICY "Users can update their own protocols"
  ON enhanced_protocols FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own protocols" ON enhanced_protocols;
CREATE POLICY "Users can delete their own protocols"
  ON enhanced_protocols FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for bloodwork_reports
DROP POLICY IF EXISTS "Users can view their own bloodwork reports" ON bloodwork_reports;
CREATE POLICY "Users can view their own bloodwork reports"
  ON bloodwork_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own bloodwork reports" ON bloodwork_reports;
CREATE POLICY "Users can insert their own bloodwork reports"
  ON bloodwork_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bloodwork reports" ON bloodwork_reports;
CREATE POLICY "Users can update their own bloodwork reports"
  ON bloodwork_reports FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bloodwork reports" ON bloodwork_reports;
CREATE POLICY "Users can delete their own bloodwork reports"
  ON bloodwork_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for photo_reports
DROP POLICY IF EXISTS "Users can view their own photo reports" ON photo_reports;
CREATE POLICY "Users can view their own photo reports"
  ON photo_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own photo reports" ON photo_reports;
CREATE POLICY "Users can insert their own photo reports"
  ON photo_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own photo reports" ON photo_reports;
CREATE POLICY "Users can update their own photo reports"
  ON photo_reports FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own photo reports" ON photo_reports;
CREATE POLICY "Users can delete their own photo reports"
  ON photo_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for token_usage_log
DROP POLICY IF EXISTS "Users can view their own token usage" ON token_usage_log;
CREATE POLICY "Users can view their own token usage"
  ON token_usage_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own token usage" ON token_usage_log;
CREATE POLICY "Users can insert their own token usage"
  ON token_usage_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for side_effect_logs
DROP POLICY IF EXISTS "Users can view their own side effect logs" ON side_effect_logs;
CREATE POLICY "Users can view their own side effect logs"
  ON side_effect_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own side effect logs" ON side_effect_logs;
CREATE POLICY "Users can insert their own side effect logs"
  ON side_effect_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own side effect logs" ON side_effect_logs;
CREATE POLICY "Users can update their own side effect logs"
  ON side_effect_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for compounds (public read access, admin insert/update)
DROP POLICY IF EXISTS "Everyone can view compounds" ON compounds;
CREATE POLICY "Everyone can view compounds"
  ON compounds FOR SELECT
  USING (true);

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_enhanced_protocols_user_id;
CREATE INDEX idx_enhanced_protocols_user_id ON enhanced_protocols(user_id);
DROP INDEX IF EXISTS idx_enhanced_protocols_created_at;
CREATE INDEX idx_enhanced_protocols_created_at ON enhanced_protocols(created_at);

DROP INDEX IF EXISTS idx_bloodwork_reports_user_id;
CREATE INDEX idx_bloodwork_reports_user_id ON bloodwork_reports(user_id);
DROP INDEX IF EXISTS idx_bloodwork_reports_date;
CREATE INDEX idx_bloodwork_reports_date ON bloodwork_reports(report_date);

DROP INDEX IF EXISTS idx_photo_reports_user_id;
CREATE INDEX idx_photo_reports_user_id ON photo_reports(user_id);
DROP INDEX IF EXISTS idx_photo_reports_created_at;
CREATE INDEX idx_photo_reports_created_at ON photo_reports(created_at);

DROP INDEX IF EXISTS idx_token_usage_log_user_id;
CREATE INDEX idx_token_usage_log_user_id ON token_usage_log(user_id);
DROP INDEX IF EXISTS idx_token_usage_log_feature;
CREATE INDEX idx_token_usage_log_feature ON token_usage_log(feature_name);
DROP INDEX IF EXISTS idx_token_usage_log_created_at;
CREATE INDEX idx_token_usage_log_created_at ON token_usage_log(created_at);

DROP INDEX IF EXISTS idx_side_effect_logs_user_id;
CREATE INDEX idx_side_effect_logs_user_id ON side_effect_logs(user_id);
DROP INDEX IF EXISTS idx_side_effect_logs_created_at;
CREATE INDEX idx_side_effect_logs_created_at ON side_effect_logs(created_at);

DROP INDEX IF EXISTS idx_compounds_category;
CREATE INDEX idx_compounds_category ON compounds(category);
DROP INDEX IF EXISTS idx_compounds_risk_score;
CREATE INDEX idx_compounds_risk_score ON compounds(risk_score);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enhanced_protocols_updated_at BEFORE UPDATE ON enhanced_protocols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bloodwork_reports_updated_at BEFORE UPDATE ON bloodwork_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photo_reports_updated_at BEFORE UPDATE ON photo_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_side_effect_logs_updated_at BEFORE UPDATE ON side_effect_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compounds_updated_at BEFORE UPDATE ON compounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();