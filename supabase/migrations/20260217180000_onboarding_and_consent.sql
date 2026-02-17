-- user_onboarding_profiles: survey data for tailoring
CREATE TABLE IF NOT EXISTS user_onboarding_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ped_experience_level TEXT NOT NULL CHECK (ped_experience_level IN ('none', 'beginner', 'intermediate', 'advanced')),
  primary_goal TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_data_consent: for anonymized community insights (if not exists)
CREATE TABLE IF NOT EXISTS user_data_consent (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('anonymized_insights')),
  consented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, consent_type)
);

-- anonymized_trends: aggregated buckets (if not exists)
CREATE TABLE IF NOT EXISTS anonymized_trends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  subgroup TEXT,
  metric TEXT NOT NULL,
  value JSONB NOT NULL,
  sample_size INTEGER NOT NULL CHECK (sample_size >= 5),
  period TEXT NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, subgroup, metric, period)
);

-- RLS for user_onboarding_profiles
ALTER TABLE user_onboarding_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own onboarding" ON user_onboarding_profiles;
CREATE POLICY "Users can view own onboarding" ON user_onboarding_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own onboarding" ON user_onboarding_profiles;
CREATE POLICY "Users can insert own onboarding" ON user_onboarding_profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own onboarding" ON user_onboarding_profiles;
CREATE POLICY "Users can update own onboarding" ON user_onboarding_profiles FOR UPDATE USING (auth.uid() = id);

-- RLS for user_data_consent (if not already present)
ALTER TABLE user_data_consent ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own consent" ON user_data_consent;
CREATE POLICY "Users can view their own consent" ON user_data_consent FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own consent" ON user_data_consent;
CREATE POLICY "Users can insert their own consent" ON user_data_consent FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own consent" ON user_data_consent;
CREATE POLICY "Users can update their own consent" ON user_data_consent FOR UPDATE USING (auth.uid() = user_id);

-- RLS for anonymized_trends (public read)
ALTER TABLE anonymized_trends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view anonymized trends" ON anonymized_trends;
CREATE POLICY "Everyone can view anonymized trends" ON anonymized_trends FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_profiles_id ON user_onboarding_profiles(id);
CREATE INDEX IF NOT EXISTS idx_anonymized_trends_subgroup ON anonymized_trends(subgroup);
CREATE INDEX IF NOT EXISTS idx_anonymized_trends_category_subgroup ON anonymized_trends(category, subgroup);
