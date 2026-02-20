-- compound_suggestions: user-submitted compound suggestions for moderation
-- No location data per requirements
CREATE TABLE IF NOT EXISTS compound_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  suggested_name TEXT NOT NULL,
  category TEXT,
  common_uses TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: users can insert their own suggestions; users can view their own; admins need service role for moderation
ALTER TABLE compound_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own suggestions" ON compound_suggestions;
CREATE POLICY "Users can insert own suggestions"
  ON compound_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own suggestions" ON compound_suggestions;
CREATE POLICY "Users can view own suggestions"
  ON compound_suggestions FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for compound_suggestions
CREATE INDEX IF NOT EXISTS idx_compound_suggestions_user_id ON compound_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_compound_suggestions_status ON compound_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_compound_suggestions_created_at ON compound_suggestions(created_at);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_compound_suggestions_updated_at ON compound_suggestions;
CREATE TRIGGER update_compound_suggestions_updated_at BEFORE UPDATE ON compound_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for pending suggestions (useful for admin dashboards)
CREATE OR REPLACE VIEW compound_suggestions_pending AS
SELECT id, user_id, suggested_name, category, common_uses, notes, created_at
FROM compound_suggestions
WHERE status = 'pending'
ORDER BY created_at DESC;

-- =============================================================================
-- Batch INSERT: 25 new compounds (full data like Anadrol example)
-- Educational data only. ON CONFLICT updates existing rows.
-- =============================================================================

INSERT INTO compounds (
  name, category, what_it_is, common_uses, risk_score, side_effects,
  affected_systems, key_monitoring_markers, nutrition_impact_summary, sources,
  full_breakdown_json, breakdown_updated_at
) VALUES
-- 1. DHB (1-Testosterone / Dihydroboldenone)
('DHB', 'AAS', '1-Testosterone (dihydroboldenone), a reduced form of boldenone that does not aromatize. Synthetic androgen with high anabolic-to-androgenic ratio.', 'Commonly discussed for lean muscle gains, strength, and hardness without estrogenic effects.', 7, 'Commonly reported side effects include injection site pain, acne, hair loss, and lipid alterations.', ARRAY['Endocrine', 'Dermatological', 'Lipids']::TEXT[], ARRAY['Total Testosterone', 'Estradiol', 'HDL', 'LDL', 'Liver Enzymes']::TEXT[], 'Commonly discussed as improving nutrient partitioning with minimal water retention. May support lean gains without significant appetite changes.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"1-Testosterone, non-aromatizing synthetic androgen.","risks_and_side_effects":"Injection site discomfort, lipid changes, androgenic side effects.","monitoring_markers":["Testosterone","Estradiol","HDL","LDL","ALT","AST"],"sources":[]}'::JSONB, NOW()),

-- 2. Ment (Trestolone / MENT)
('Ment', 'AAS', 'Trestolone (7α-methyl-19-nortestosterone), a synthetic androgen with high receptor affinity. Non-aromatizing, short half-life.', 'Commonly discussed for muscle gains, strength, and as a potential TRT alternative.', 8, 'Commonly reported side effects include suppression, libido changes, and cardiovascular strain.', ARRAY['Endocrine', 'Cardiovascular', 'Reproductive']::TEXT[], ARRAY['Total Testosterone', 'LH', 'FSH', 'Estradiol', 'Blood Pressure', 'HDL', 'LDL']::TEXT[], 'Commonly discussed as having potent anabolic effects with potential appetite modulation.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Trestolone, potent synthetic androgen.","risks_and_side_effects":"HPTA suppression, cardiovascular considerations.","monitoring_markers":["Testosterone","LH","FSH","Blood Pressure","Lipids"],"sources":[]}'::JSONB, NOW()),

-- 3. Trenbolone Acetate
('Trenbolone Acetate', 'AAS', 'Short-ester form of trenbolone with approximately 3-day half-life. Highly androgenic synthetic steroid.', 'Commonly discussed for cutting, hardness, and strength with frequent injection schedules.', 9, 'Commonly reported side effects include night sweats, insomnia, aggression, and severe cardiovascular strain.', ARRAY['Endocrine', 'Cardiovascular', 'Central Nervous System']::TEXT[], ARRAY['Prolactin', 'Cortisol', 'Testosterone', 'Estrogen', 'Blood Pressure', 'Liver Enzymes', 'Lipids']::TEXT[], 'Commonly discussed as increasing metabolic rate and reducing insulin sensitivity. May suppress appetite in some users.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Short-ester trenbolone, highly androgenic.","risks_and_side_effects":"Severe cardiovascular and CNS effects.","monitoring_markers":["Prolactin","Blood Pressure","Lipids","Liver Enzymes"],"sources":[]}'::JSONB, NOW()),

-- 4. Trenbolone Enanthate
('Trenbolone Enanthate', 'AAS', 'Long-ester form of trenbolone with approximately 10-day half-life. Same active compound as acetate with less frequent dosing.', 'Commonly discussed for cutting and lean mass with fewer injections.', 9, 'Commonly reported side effects include night sweats, insomnia, aggression, and cardiovascular strain.', ARRAY['Endocrine', 'Cardiovascular', 'Central Nervous System']::TEXT[], ARRAY['Prolactin', 'Testosterone', 'Estrogen', 'Blood Pressure', 'Liver Enzymes', 'Lipids']::TEXT[], 'Commonly discussed as having similar metabolic effects to acetate with longer ester clearance.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Long-ester trenbolone.","risks_and_side_effects":"Same as trenbolone acetate; ester affects clearance.","monitoring_markers":["Prolactin","Blood Pressure","Lipids"],"sources":[]}'::JSONB, NOW()),

-- 5. Testosterone Propionate
('Testosterone Propionate', 'AAS', 'Short-ester testosterone with approximately 2-day half-life. Requires frequent injection for stable levels.', 'Commonly discussed for TRT and cycles with precise control and faster clearance.', 6, 'Commonly reported side effects include injection site discomfort, acne, and estrogenic effects.', ARRAY['Endocrine', 'Cardiovascular', 'Dermatological']::TEXT[], ARRAY['Total Testosterone', 'Free Testosterone', 'Estradiol', 'SHBG', 'HDL', 'LDL', 'Hematocrit']::TEXT[], 'Commonly discussed as allowing fine-tuned dosing with minimal long-term accumulation.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Short-ester testosterone.","risks_and_side_effects":"Estrogenic effects, hematocrit elevation.","monitoring_markers":["Testosterone","Estradiol","Hematocrit","Lipids"],"sources":[]}'::JSONB, NOW()),

-- 6. Testosterone Undecanoate
('Testosterone Undecanoate', 'AAS', 'Very long-ester testosterone with extended half-life. Can be administered orally (in oil) or via injection.', 'Commonly discussed for TRT with infrequent dosing and steady-state levels.', 5, 'Commonly reported side effects include estrogenic effects and hematocrit elevation with long-term use.', ARRAY['Endocrine', 'Cardiovascular', 'Hematological']::TEXT[], ARRAY['Total Testosterone', 'Estradiol', 'Hematocrit', 'HDL', 'LDL']::TEXT[], 'Commonly discussed as providing stable hormone levels with minimal injection frequency.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Long-ester testosterone, oral or injectable.","risks_and_side_effects":"Hematocrit, estrogen management.","monitoring_markers":["Testosterone","Estradiol","Hematocrit","Lipids"],"sources":[]}'::JSONB, NOW()),

-- 7. Methyltestosterone
('Methyltestosterone', 'AAS', 'Oral synthetic androgen, 17-alpha alkylated. High liver stress potential.', 'Commonly discussed historically for androgen replacement; less common in modern protocols.', 8, 'Commonly reported side effects include severe liver strain, cholestasis, and lipid alterations.', ARRAY['Hepatic', 'Endocrine', 'Cardiovascular']::TEXT[], ARRAY['Liver Enzymes', 'ALT', 'AST', 'Bilirubin', 'HDL', 'LDL', 'Testosterone']::TEXT[], 'Commonly discussed as having significant hepatotoxicity; nutritional support for liver often emphasized.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Oral methylated testosterone.","risks_and_side_effects":"Severe hepatotoxicity.","monitoring_markers":["ALT","AST","Bilirubin","Lipids"],"sources":[]}'::JSONB, NOW()),

-- 8. Stenbolone
('Stenbolone', 'AAS', 'Dihydroboldenone derivative, DHT-based synthetic androgen. Non-aromatizing.', 'Commonly discussed for lean gains, hardness, and strength with moderate androgenic profile.', 6, 'Commonly reported side effects include injection site pain, hair loss, and lipid changes.', ARRAY['Endocrine', 'Dermatological', 'Lipids']::TEXT[], ARRAY['Testosterone', 'Estradiol', 'HDL', 'LDL', 'Liver Enzymes']::TEXT[], 'Commonly discussed as supporting lean mass with minimal water retention.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"DHT-derived synthetic androgen.","risks_and_side_effects":"Androgenic side effects, lipid impact.","monitoring_markers":["Testosterone","Lipids","Liver Enzymes"],"sources":[]}'::JSONB, NOW()),

-- 9. KPV (Lys-Pro-Val)
('KPV', 'Peptide', 'Lys-Pro-Val, a tripeptide fragment of alpha-MSH. Anti-inflammatory and immunomodulatory properties.', 'Commonly discussed for gut health, inflammation reduction, and skin conditions.', 3, 'Commonly reported side effects include mild injection site reactions.', ARRAY['Immune', 'Gastrointestinal', 'Dermatological']::TEXT[], ARRAY['Inflammatory Markers', 'Gut Health Markers']::TEXT[], 'Commonly discussed as having minimal impact on appetite or metabolism.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Tripeptide fragment of alpha-MSH.","risks_and_side_effects":"Generally well tolerated.","monitoring_markers":["Inflammatory markers"],"sources":[]}'::JSONB, NOW()),

-- 10. Thymosin Beta-4
('Thymosin Beta-4', 'Peptide', 'Naturally occurring peptide involved in cell migration, angiogenesis, and wound healing.', 'Commonly discussed for tissue repair, injury recovery, and anti-aging.', 4, 'Commonly reported side effects include fatigue and flu-like symptoms.', ARRAY['Musculoskeletal', 'Immune', 'Cardiovascular']::TEXT[], ARRAY['Inflammatory Markers', 'Recovery Markers']::TEXT[], 'Commonly discussed as supporting recovery with minimal nutritional impact.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Peptide involved in tissue repair.","risks_and_side_effects":"Fatigue, flu-like symptoms.","monitoring_markers":["Inflammatory markers"],"sources":[]}'::JSONB, NOW()),

-- 11. 5-Amino-1MQ
('5-Amino-1MQ', 'Supplement', '5-Amino-1MQ, an inhibitor of NNMT (nicotinamide N-methyltransferase). May affect NAD+ metabolism.', 'Commonly discussed for metabolic health, fat loss, and potential longevity benefits.', 5, 'Commonly reported side effects include mild gastrointestinal discomfort.', ARRAY['Metabolic', 'Hepatic']::TEXT[], ARRAY['Metabolic Markers', 'Liver Enzymes']::TEXT[], 'Commonly discussed as potentially improving metabolic flexibility and fat oxidation.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"NNMT inhibitor, NAD+ pathway.","risks_and_side_effects":"Limited long-term data.","monitoring_markers":["Metabolic markers"],"sources":[]}'::JSONB, NOW()),

-- 12. Selank
('Selank', 'Peptide', 'Synthetic heptapeptide with anxiolytic and nootropic properties. Derived from tuftsin.', 'Commonly discussed for anxiety reduction, cognitive support, and stress resilience.', 4, 'Commonly reported side effects include mild nasal irritation when used intranasally.', ARRAY['Central Nervous System', 'Immune']::TEXT[], ARRAY['Cognitive Markers', 'Stress Markers']::TEXT[], 'Commonly discussed as having minimal impact on appetite or metabolism.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Synthetic heptapeptide, anxiolytic.","risks_and_side_effects":"Generally mild.","monitoring_markers":[],"sources":[]}'::JSONB, NOW()),

-- 13. Semax
('Semax', 'Peptide', 'Synthetic peptide fragment of ACTH(4-10) with nootropic and neuroprotective properties.', 'Commonly discussed for cognitive enhancement, focus, and neuroprotection.', 4, 'Commonly reported side effects include mild headache or nasal irritation.', ARRAY['Central Nervous System']::TEXT[], ARRAY['Cognitive Markers']::TEXT[], 'Commonly discussed as having minimal nutritional impact.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"ACTH-derived peptide, nootropic.","risks_and_side_effects":"Generally mild.","monitoring_markers":[],"sources":[]}'::JSONB, NOW()),

-- 14. LL-37
('LL-37', 'Peptide', 'Human cathelicidin antimicrobial peptide. Part of innate immune response.', 'Commonly discussed for immune support, wound healing, and antimicrobial properties.', 4, 'Commonly reported side effects include injection site reactions.', ARRAY['Immune', 'Dermatological']::TEXT[], ARRAY['Immune Markers', 'Inflammatory Markers']::TEXT[], 'Commonly discussed as having minimal metabolic impact.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Antimicrobial peptide, immune function.","risks_and_side_effects":"Injection site reactions.","monitoring_markers":["Immune markers"],"sources":[]}'::JSONB, NOW()),

-- 15. ACP-105
('ACP-105', 'SARM', 'Selective androgen receptor modulator with tissue-selective anabolic effects.', 'Commonly discussed for lean muscle gains and fat loss with reduced systemic androgenic effects.', 5, 'Commonly reported side effects include suppression and mild lipid changes.', ARRAY['Endocrine', 'Lipids']::TEXT[], ARRAY['Testosterone', 'LH', 'FSH', 'HDL', 'LDL']::TEXT[], 'Commonly discussed as supporting body recomposition with moderate suppression risk.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"SARM, tissue-selective.","risks_and_side_effects":"HPTA suppression, lipid impact.","monitoring_markers":["Testosterone","LH","FSH","Lipids"],"sources":[]}'::JSONB, NOW()),

-- 16. AC-262
('AC-262', 'SARM', 'Selective androgen receptor modulator with partial agonist activity.', 'Commonly discussed for muscle gains and strength with potentially reduced side-effect profile.', 5, 'Commonly reported side effects include suppression and lipid alterations.', ARRAY['Endocrine', 'Lipids']::TEXT[], ARRAY['Testosterone', 'LH', 'FSH', 'HDL', 'LDL']::TEXT[], 'Commonly discussed as improving nutrient partitioning with moderate endocrine impact.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"SARM, partial agonist.","risks_and_side_effects":"Suppression, lipid changes.","monitoring_markers":["Testosterone","Lipids"],"sources":[]}'::JSONB, NOW()),

-- 17. 1-Andro
('1-Andro', 'Prohormone', '1-Androstenedione, a prohormone that converts to 1-testosterone. Often sold as dietary supplement.', 'Commonly discussed for lean muscle gains and strength in prohormone stacks.', 6, 'Commonly reported side effects include suppression, liver strain, and lipid changes.', ARRAY['Endocrine', 'Hepatic', 'Lipids']::TEXT[], ARRAY['Testosterone', 'LH', 'FSH', 'Liver Enzymes', 'HDL', 'LDL']::TEXT[], 'Commonly discussed as supporting lean gains with conversion to active androgen.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Prohormone to 1-testosterone.","risks_and_side_effects":"Suppression, hepatotoxicity.","monitoring_markers":["Testosterone","Liver Enzymes","Lipids"],"sources":[]}'::JSONB, NOW()),

-- 18. 4-Andro
('4-Andro', 'Prohormone', '4-Androstenediol, a prohormone that converts to testosterone. Often sold as dietary supplement.', 'Commonly discussed for testosterone support and muscle gains in prohormone stacks.', 6, 'Commonly reported side effects include suppression, estrogenic effects, and liver strain.', ARRAY['Endocrine', 'Hepatic', 'Lipids']::TEXT[], ARRAY['Testosterone', 'Estradiol', 'LH', 'FSH', 'Liver Enzymes', 'HDL', 'LDL']::TEXT[], 'Commonly discussed as providing exogenous testosterone precursor with conversion variability.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Prohormone to testosterone.","risks_and_side_effects":"Suppression, estrogen conversion.","monitoring_markers":["Testosterone","Estradiol","Liver Enzymes","Lipids"],"sources":[]}'::JSONB, NOW()),

-- 19. Pramipexole
('Pramipexole', 'Ancillary', 'Dopamine agonist used medically for Parkinson disease and restless legs syndrome.', 'Commonly discussed for prolactin control and libido support in certain protocols.', 6, 'Commonly reported side effects include nausea, dizziness, sleepiness, and impulse control issues.', ARRAY['Central Nervous System', 'Endocrine']::TEXT[], ARRAY['Prolactin', 'Dopamine Markers', 'Blood Pressure']::TEXT[], 'Commonly discussed as having minimal direct nutritional impact; may affect appetite in some.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Dopamine agonist, prescription medication.","risks_and_side_effects":"Impulse control, hypotension.","monitoring_markers":["Prolactin","Blood Pressure"],"sources":[]}'::JSONB, NOW()),

-- 20. Raloxifene
('Raloxifene', 'Ancillary', 'Selective estrogen receptor modulator (SERM) used for osteoporosis and breast cancer prevention.', 'Commonly discussed for estrogen management and gynecomastia prevention.', 5, 'Commonly reported side effects include hot flashes, blood clots, and leg cramps.', ARRAY['Endocrine', 'Cardiovascular', 'Skeletal']::TEXT[], ARRAY['Estradiol', 'Bone Markers', 'Lipids']::TEXT[], 'Commonly discussed as having minimal impact on appetite.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"SERM, prescription medication.","risks_and_side_effects":"Thromboembolism risk, hot flashes.","monitoring_markers":["Estradiol","Bone density"],"sources":[]}'::JSONB, NOW()),

-- 21. Telmisartan
('Telmisartan', 'Ancillary', 'Angiotensin II receptor blocker (ARB) used for hypertension. PPAR-gamma partial agonist.', 'Commonly discussed for blood pressure management and potential cardioprotective effects in certain protocols.', 4, 'Commonly reported side effects include dizziness, hyperkalemia, and hypotension.', ARRAY['Cardiovascular', 'Renal']::TEXT[], ARRAY['Blood Pressure', 'Potassium', 'Kidney Function']::TEXT[], 'Commonly discussed as having minimal direct nutritional impact.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"ARB, antihypertensive.","risks_and_side_effects":"Hyperkalemia, hypotension.","monitoring_markers":["Blood Pressure","Potassium","Creatinine"],"sources":[]}'::JSONB, NOW()),

-- 22. Aspirin
('Aspirin', 'Ancillary', 'Acetylsalicylic acid, NSAID with antiplatelet and anti-inflammatory properties.', 'Commonly discussed for cardiovascular support and inflammation reduction.', 4, 'Commonly reported side effects include GI bleeding, ulcers, and bleeding risk.', ARRAY['Gastrointestinal', 'Cardiovascular', 'Hematological']::TEXT[], ARRAY['Bleeding Markers', 'Kidney Function', 'Liver Enzymes']::TEXT[], 'Commonly discussed as having minimal impact on appetite; GI effects may affect nutrient absorption.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"NSAID, antiplatelet.","risks_and_side_effects":"GI bleeding, Reye syndrome.","monitoring_markers":["Bleeding time","Kidney function"],"sources":[]}'::JSONB, NOW()),

-- 23. Niacin
('Niacin', 'Supplement', 'Vitamin B3 (nicotinic acid), used for lipid management and NAD+ precursor.', 'Commonly discussed for cholesterol support and cardiovascular health.', 4, 'Commonly reported side effects include flushing, hepatotoxicity at high doses, and glucose intolerance.', ARRAY['Hepatic', 'Cardiovascular', 'Metabolic']::TEXT[], ARRAY['HDL', 'LDL', 'Triglycerides', 'Liver Enzymes', 'Blood Glucose']::TEXT[], 'Commonly discussed as affecting lipid metabolism; flushing can be managed with extended-release or flushing-free forms.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Vitamin B3, lipid modulator.","risks_and_side_effects":"Flushing, hepatotoxicity at high doses.","monitoring_markers":["Lipids","Liver Enzymes","Glucose"],"sources":[]}'::JSONB, NOW()),

-- 24. Citicoline
('Citicoline', 'Supplement', 'CDP-choline, a precursor for phospholipid synthesis and acetylcholine. Supports brain membrane health.', 'Commonly discussed for cognitive support, focus, and neuroprotection.', 3, 'Commonly reported side effects include mild headache and gastrointestinal discomfort.', ARRAY['Central Nervous System']::TEXT[], ARRAY['Cognitive Markers']::TEXT[], 'Commonly discussed as having minimal impact on appetite or metabolism.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Choline precursor, nootropic.","risks_and_side_effects":"Generally well tolerated.","monitoring_markers":[],"sources":[]}'::JSONB, NOW()),

-- 25. MOTS-C (re-insert/update if exists - educational refresh)
('MOTS-C', 'Peptide', 'Mitochondrial-derived peptide encoded in mitochondrial DNA. Involved in metabolic regulation and insulin sensitivity.', 'Commonly discussed for metabolic flexibility, fat loss, and muscle performance enhancement.', 4, 'Commonly reported side effects include mild fatigue.', ARRAY['Metabolic', 'Musculoskeletal']::TEXT[], ARRAY['Insulin Sensitivity', 'Metabolic Markers', 'Glucose']::TEXT[], 'Commonly discussed as enhancing fat burning and insulin sensitivity with minimal appetite impact.', ARRAY[]::TEXT[], '{"disclaimer":"Educational only. Not medical advice. Consult your physician.","what_it_is":"Mitochondrial peptide, metabolic regulator.","risks_and_side_effects":"Mild fatigue.","monitoring_markers":["Glucose","Insulin","Metabolic markers"],"sources":[]}'::JSONB, NOW())
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  what_it_is = EXCLUDED.what_it_is,
  common_uses = EXCLUDED.common_uses,
  risk_score = EXCLUDED.risk_score,
  side_effects = EXCLUDED.side_effects,
  affected_systems = EXCLUDED.affected_systems,
  key_monitoring_markers = EXCLUDED.key_monitoring_markers,
  nutrition_impact_summary = EXCLUDED.nutrition_impact_summary,
  sources = COALESCE(EXCLUDED.sources, compounds.sources),
  full_breakdown_json = COALESCE(EXCLUDED.full_breakdown_json, compounds.full_breakdown_json),
  breakdown_updated_at = COALESCE(EXCLUDED.breakdown_updated_at, compounds.breakdown_updated_at),
  updated_at = NOW();

-- =============================================================================
-- NOTES: Running in Supabase SQL Editor
-- =============================================================================
-- 1. Prerequisites: Ensure migrations 20260217055453 (initial_schema),
--    20260217120000 (add_compounds_columns), and 20260217190000 (full_breakdown)
--    have been applied so compounds has: what_it_is, side_effects, sources,
--    full_breakdown_json, breakdown_updated_at.
--
-- 2. Run this migration: Copy the entire file and execute in Supabase Dashboard
--    > SQL Editor > New query > Paste > Run.
--
-- 3. compound_suggestions: Users can submit suggestions via your app; moderation
--    requires service role or a separate admin flow (moderated_by, status).
--
-- 4. View pending suggestions: SELECT * FROM compound_suggestions_pending;
--
-- 5. All compound data is educational only. No dosages, no advice.
