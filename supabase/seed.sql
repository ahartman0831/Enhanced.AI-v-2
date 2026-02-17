-- Insert 20 common compounds with educational information
-- Note: This data is for educational purposes only and does not include dosage information

INSERT INTO compounds (name, category, common_uses, risk_score, affected_systems, key_monitoring_markers, nutrition_impact_summary) VALUES
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

('Anavar', 'Anabolic Steroid', 'Lean muscle gain, strength, recovery', 4, ARRAY['Hepatic', 'Endocrine', 'Cardiovascular'], ARRAY['Liver Enzymes', 'Testosterone', 'Cholesterol', 'Blood Glucose'], 'Mild anabolic with potential liver stress. May support glycogen storage and recovery while having minimal impact on appetite regulation.'),

('Proviron', 'Androgen', 'Libido support, estrogen control, hardening', 4, ARRAY['Endocrine', 'Reproductive', 'Mental Health'], ARRAY['Testosterone', 'Estrogen', 'SHBG', 'Libido Markers'], 'Pure androgen that may support libido and mental clarity. Minimal anabolic effects with potential estrogen control benefits.'),

('Halotestin', 'Anabolic Steroid', 'Strength, aggression, power', 8, ARRAY['Hepatic', 'Cardiovascular', 'Mental Health'], ARRAY['Liver Enzymes', 'Blood Pressure', 'Aggression Markers', 'Cholesterol'], 'Highly androgenic with significant liver stress. May increase aggression and power output while requiring careful cardiovascular monitoring.'),

('Superdrol', 'Prohormone/Anabolic Steroid', 'Mass gain, strength, power', 9, ARRAY['Hepatic', 'Endocrine', 'Cardiovascular'], ARRAY['Liver Enzymes', 'Testosterone', 'Estrogen', 'Blood Pressure', 'Cholesterol'], 'Extremely potent anabolic with high liver toxicity risk. May dramatically increase strength and mass while requiring extensive liver support.'),

('Epistane', 'Prohormone', 'Lean muscle gain, strength, definition', 6, ARRAY['Hepatic', 'Endocrine', 'Cardiovascular'], ARRAY['Liver Enzymes', 'Testosterone', 'Cholesterol', 'Cortisol'], 'Methylated compound with anabolic effects. May suppress cortisol and support muscle preservation during caloric deficits.'),

('Ostarine', 'SARM', 'Muscle preservation, strength, recovery', 3, ARRAY['Endocrine', 'Hepatic'], ARRAY['Testosterone', 'LH', 'FSH', 'Liver Enzymes', 'SHBG'], 'Selective androgen receptor modulator with tissue-specific effects. May support muscle maintenance and recovery with minimal systemic androgenic activity.'),

('Ligandrol', 'SARM', 'Muscle gain, strength, bone health', 4, ARRAY['Endocrine', 'Hepatic', 'Skeletal'], ARRAY['Testosterone', 'LH', 'FSH', 'Liver Enzymes', 'Bone Markers'], 'SARM with anabolic effects on muscle and bone tissue. May support lean mass gains and bone mineral density with moderate endocrine impact.'),

('Cardarine', 'PPAR Agonist', 'Endurance, fat loss, metabolism', 4, ARRAY['Metabolic', 'Cardiovascular', 'Hepatic'], ARRAY['Endurance Markers', 'Cholesterol', 'Liver Enzymes', 'VO2 Max'], 'Metabolic modulator that enhances endurance and fat oxidation. May improve cardiovascular efficiency and metabolic flexibility.'),

('Nolvadex', 'SERMs', 'Estrogen control, PCT, gyno prevention', 3, ARRAY['Endocrine', 'Reproductive', 'Vision'], ARRAY['Estrogen', 'Testosterone', 'LH', 'FSH', 'Vision Markers'], 'Selective estrogen receptor modulator used for hormonal balance. May support natural testosterone production during recovery periods.'),

('Arimidex', 'AI', 'Estrogen control, estrogen management', 5, ARRAY['Endocrine', 'Skeletal', 'Cardiovascular'], ARRAY['Estrogen', 'Testosterone', 'Bone Markers', 'Cholesterol'], 'Aromatase inhibitor that reduces estrogen production. May affect bone health and lipid profiles while requiring careful estrogen monitoring.');