-- =====================================================
-- Enhanced AI v2 Database Setup
-- Run this entire file in your Supabase SQL Editor
-- =====================================================

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

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloodwork_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE side_effect_logs ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX idx_enhanced_protocols_user_id ON enhanced_protocols(user_id);
CREATE INDEX idx_enhanced_protocols_created_at ON enhanced_protocols(created_at);

CREATE INDEX idx_bloodwork_reports_user_id ON bloodwork_reports(user_id);
CREATE INDEX idx_bloodwork_reports_date ON bloodwork_reports(report_date);

CREATE INDEX idx_photo_reports_user_id ON photo_reports(user_id);
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

-- =====================================================
-- SEED DATA: Insert 20 common compounds (idempotent)
-- =====================================================

-- Only insert compounds that don't already exist
DO $$
BEGIN
    -- Insert compounds only if they don't exist
    INSERT INTO compounds (name, category, common_uses, risk_score, affected_systems, key_monitoring_markers, nutrition_impact_summary)
    VALUES
        ('Testosterone', 'Anabolic Steroid', 'Muscle building, strength enhancement, hormone replacement therapy', 7, ARRAY['Endocrine', 'Cardiovascular', 'Hepatic', 'Reproductive'], ARRAY['Total Testosterone', 'Free Testosterone', 'SHBG', 'Estradiol', 'LH', 'FSH', 'HDL', 'LDL', 'Liver Enzymes'], 'May increase protein synthesis and nitrogen retention, potentially affecting calcium metabolism and bone health. Users should monitor zinc and magnesium intake for hormonal support.'),
        ('Trenbolone', 'Anabolic Steroid', 'Muscle preservation, fat loss, strength gains', 9, ARRAY['Endocrine', 'Cardiovascular', 'Hepatic', 'Mental Health'], ARRAY['Prolactin', 'Cortisol', 'Testosterone', 'Estrogen', 'Blood Pressure', 'Liver Enzymes', 'Sleep Quality'], 'Highly androgenic compound that may increase metabolic rate and protein turnover. Requires careful attention to electrolyte balance and may suppress appetite.'),
        ('Primobolan', 'Anabolic Steroid', 'Lean muscle gain, fat loss, joint health', 5, ARRAY['Endocrine', 'Hepatic', 'Skin'], ARRAY['Testosterone', 'Liver Enzymes', 'Cholesterol', 'Hair Loss Markers'], 'Mild anabolic effects with minimal impact on appetite. May support collagen synthesis and joint health while maintaining stable blood glucose levels.'),
        ('Masteron', 'Anabolic Steroid', 'Hardening effects, strength, definition', 6, ARRAY['Endocrine', 'Cardiovascular', 'Skin'], ARRAY['Testosterone', 'DHT', 'Estrogen', 'Blood Pressure', 'Cholesterol'], 'Androgenic compound that may enhance metabolic efficiency. Users should monitor androgen-sensitive tissues and maintain adequate hydration.'),
        ('Anavar', 'Anabolic Steroid', 'Lean muscle gain, strength, recovery', 4, ARRAY['Hepatic', 'Endocrine', 'Cardiovascular'], ARRAY['Liver Enzymes', 'Testosterone', 'Cholesterol', 'Blood Glucose'], 'Mild anabolic with potential liver stress. May support glycogen storage and recovery while having minimal impact on appetite regulation.'),
        ('Winstrol', 'Anabolic Steroid', 'Strength, vascularity, fat loss', 6, ARRAY['Hepatic', 'Cardiovascular', 'Joint Health'], ARRAY['Liver Enzymes', 'Cholesterol', 'Joint Markers', 'Blood Pressure'], 'Can increase vascularity and metabolic rate. May affect joint health and requires monitoring of liver function and lipid profiles.'),
        ('Deca-Durabolin', 'Anabolic Steroid', 'Muscle gain, joint health, recovery', 7, ARRAY['Endocrine', 'Hepatic', 'Reproductive', 'Joint Health'], ARRAY['Testosterone', 'Prolactin', 'Liver Enzymes', 'Joint Markers', 'Estradiol'], 'Strong anabolic effects with potential prolactin elevation. May support joint health and collagen synthesis while affecting nitrogen balance.'),
        ('Dianabol', 'Anabolic Steroid', 'Rapid muscle gain, strength, power', 8, ARRAY['Hepatic', 'Endocrine', 'Cardiovascular', 'Water Retention'], ARRAY['Liver Enzymes', 'Testosterone', 'Estrogen', 'Blood Pressure', 'Cholesterol'], 'Highly anabolic with significant liver stress potential. May increase appetite and glycogen storage while requiring careful water and electrolyte management.'),
        ('Boldenone', 'Anabolic Steroid', 'Lean muscle gain, endurance, appetite', 6, ARRAY['Endocrine', 'Hepatic', 'Cardiovascular'], ARRAY['Testosterone', 'Liver Enzymes', 'Hematocrit', 'Cholesterol'], 'May increase red blood cell production and appetite. Supports steady muscle gains with moderate androgenic effects.'),
        ('Turinabol', 'Anabolic Steroid', 'Lean muscle gain, strength, recovery', 5, ARRAY['Hepatic', 'Endocrine', 'Cardiovascular'], ARRAY['Liver Enzymes', 'Testosterone', 'Cholesterol', 'Blood Glucose'], 'Mild anabolic with liver protection features. May support recovery and metabolic efficiency while maintaining stable energy levels.'),
        ('Clenbuterol', 'Beta-2 Agonist', 'Fat loss, metabolism, performance', 7, ARRAY['Cardiovascular', 'Metabolic', 'Nervous System'], ARRAY['Heart Rate', 'Blood Pressure', 'Potassium', 'Magnesium', 'Body Temperature'], 'Powerful thermogenic that increases metabolic rate. Requires careful electrolyte monitoring and may affect cardiovascular parameters.'),
        ('Proviron', 'Androgen', 'Libido support, estrogen control, hardening', 4, ARRAY['Endocrine', 'Reproductive', 'Mental Health'], ARRAY['Testosterone', 'Estrogen', 'SHBG', 'Libido Markers'], 'Pure androgen that may support libido and mental clarity. Minimal anabolic effects with potential estrogen control benefits.'),
        ('Halotestin', 'Anabolic Steroid', 'Strength, aggression, power', 8, ARRAY['Hepatic', 'Cardiovascular', 'Mental Health'], ARRAY['Liver Enzymes', 'Blood Pressure', 'Aggression Markers', 'Cholesterol'], 'Highly androgenic with significant liver stress. May increase aggression and power output while requiring careful cardiovascular monitoring.'),
        ('Superdrol', 'Prohormone/Anabolic Steroid', 'Mass gain, strength, power', 9, ARRAY['Hepatic', 'Endocrine', 'Cardiovascular'], ARRAY['Liver Enzymes', 'Testosterone', 'Estrogen', 'Blood Pressure', 'Cholesterol'], 'Extremely potent anabolic with high liver toxicity risk. May dramatically increase strength and mass while requiring extensive liver support.'),
        ('Epistane', 'Prohormone', 'Lean muscle gain, strength, definition', 6, ARRAY['Hepatic', 'Endocrine', 'Cardiovascular'], ARRAY['Liver Enzymes', 'Testosterone', 'Cholesterol', 'Cortisol'], 'Methylated compound with anabolic effects. May suppress cortisol and support muscle preservation during caloric deficits.'),
        ('Ostarine', 'SARM', 'Muscle preservation, strength, recovery', 3, ARRAY['Endocrine', 'Hepatic'], ARRAY['Testosterone', 'LH', 'FSH', 'Liver Enzymes', 'SHBG'], 'Selective androgen receptor modulator with tissue-specific effects. May support muscle maintenance and recovery with minimal systemic androgenic activity.'),
        ('Ligandrol', 'SARM', 'Muscle gain, strength, bone health', 4, ARRAY['Endocrine', 'Hepatic', 'Skeletal'], ARRAY['Testosterone', 'LH', 'FSH', 'Liver Enzymes', 'Bone Markers'], 'SARM with anabolic effects on muscle and bone tissue. May support lean mass gains and bone mineral density with moderate endocrine impact.'),
        ('Cardarine', 'PPAR Agonist', 'Endurance, fat loss, metabolism', 4, ARRAY['Metabolic', 'Cardiovascular', 'Hepatic'], ARRAY['Endurance Markers', 'Cholesterol', 'Liver Enzymes', 'VO2 Max'], 'Metabolic modulator that enhances endurance and fat oxidation. May improve cardiovascular efficiency and metabolic flexibility.'),
        ('Nolvadex', 'SERMs', 'Estrogen control, PCT, gyno prevention', 3, ARRAY['Endocrine', 'Reproductive', 'Vision'], ARRAY['Estrogen', 'Testosterone', 'LH', 'FSH', 'Vision Markers'], 'Selective estrogen receptor modulator used for hormonal balance. May support natural testosterone production during recovery periods.'),
        ('Arimidex', 'AI', 'Estrogen control, estrogen management', 5, ARRAY['Endocrine', 'Skeletal', 'Cardiovascular'], ARRAY['Estrogen', 'Testosterone', 'Bone Markers', 'Cholesterol'], 'Aromatase inhibitor that reduces estrogen production. May affect bone health and lipid profiles while requiring careful estrogen monitoring.')
    ON CONFLICT (name) DO NOTHING;
END $$;

-- =====================================================
-- Setup Complete!
-- =====================================================