-- Add aromatization_score and aromatization_notes to compounds
-- Educational reference only — generalized observational score, not predictive. Extreme individual variability.

ALTER TABLE public.compounds ADD COLUMN IF NOT EXISTS aromatization_score integer DEFAULT NULL
  CHECK (aromatization_score IS NULL OR (aromatization_score >= 0 AND aromatization_score <= 10));

ALTER TABLE public.compounds ADD COLUMN IF NOT EXISTS aromatization_notes text DEFAULT NULL;

COMMENT ON COLUMN public.compounds.aromatization_score IS 'Generalized observational aromatization potential score 0–10 based on literature (Kicman 2008, Vida 1969) and community bloodwork patterns. NOT predictive — individual conversion varies dramatically by genetics, dose, metabolism. Educational reference only. Not medical advice.';
COMMENT ON COLUMN public.compounds.aromatization_notes IS 'Brief rationale and disclaimer for aromatization_score when score > 0. Always includes variability disclaimer. Educational only.';

-- Populate aromatization_score and aromatization_notes for all compounds in the list
-- Uses ON CONFLICT-style logic via UPDATE FROM; only existing rows are updated

UPDATE public.compounds c SET
  aromatization_score = v.score,
  aromatization_notes = v.notes,
  updated_at = NOW()
FROM (VALUES
  -- Score 10: Extremely high aromatization
  ('Trestolone Acetate (MENT)', 10, 'Extremely high aromatization — commonly associated with significant estradiol elevation and water retention patterns in community bloodwork. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  ('Ment', 10, 'Extremely high aromatization — commonly associated with significant estradiol elevation and water retention patterns in community bloodwork. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  -- Score 8: High (Dianabol, Anadrol)
  ('Dianabol', 8, 'High aromatization — commonly associated with significant estradiol elevation and water retention patterns in community bloodwork. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  ('Anadrol', 8, 'High aromatization — commonly associated with significant estradiol elevation and water retention patterns in community bloodwork. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  -- Score 7: Methyltestosterone
  ('Methyltestosterone', 7, 'High aromatization — commonly associated with significant estradiol elevation and water retention patterns in community bloodwork. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  -- Score 6: Testosterone esters
  ('Testosterone', 6, 'Moderate-high aromatization — commonly associated with estradiol elevation and water retention patterns in community bloodwork. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  ('Testosterone Propionate', 6, 'Moderate-high aromatization — commonly associated with estradiol elevation and water retention patterns in community bloodwork. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  ('Testosterone Undecanoate', 6, 'Moderate-high aromatization — commonly associated with estradiol elevation and water retention patterns in community bloodwork. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  -- Score 5: Boldenone, Equipoise, 4-Andro
  ('Boldenone', 5, 'Moderate aromatization — commonly associated with estradiol elevation and water retention patterns in community bloodwork. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  ('Equipoise', 5, 'Moderate aromatization — commonly associated with estradiol elevation and water retention patterns in community bloodwork. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  ('4-Andro', 5, 'Prohormone converts to testosterone — moderate aromatization potential. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  -- Score 4: DHB
  ('DHB', 4, 'Low-moderate aromatization — some community reports of estradiol impact. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  -- Score 3: Nandrolone, Deca, NPP
  ('Nandrolone', 3, 'Low direct aromatization; high progestin mimicry commonly discussed. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  ('Deca-Durabolin', 3, 'Low direct aromatization; high progestin mimicry commonly discussed. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  ('NPP', 3, 'Low direct aromatization; high progestin mimicry commonly discussed. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  -- Score 2: Stenbolone, Superdrol
  ('Stenbolone', 2, 'Low aromatization — DHT-derived. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  ('Superdrol', 2, 'Low aromatization — DHT-derived. Generalized observational score only — individual conversion varies dramatically by genetics, dose, metabolism. Not medical advice.'),
  -- Score 1: Anavar, Primobolan, Turinabol, Winstrol
  ('Anavar', 1, 'Minimal aromatization — 17-alpha alkylated, does not convert to estrogen. Generalized observational score only — individual responses vary dramatically. Not medical advice.'),
  ('Primobolan', 1, 'Minimal aromatization — DHT-derived. Generalized observational score only — individual responses vary dramatically. Not medical advice.'),
  ('Turinabol', 1, 'Minimal aromatization — chlorinated structure. Generalized observational score only — individual responses vary dramatically. Not medical advice.'),
  ('Winstrol', 1, 'Minimal aromatization — DHT-derived. Generalized observational score only — individual responses vary dramatically. Not medical advice.'),
  -- Score 0: All others (no notes)
  ('1-Andro', 0, NULL),
  ('5-Amino-1MQ', 0, NULL),
  ('AC-262', 0, NULL),
  ('ACP-105', 0, NULL),
  ('Albuterol', 0, NULL),
  ('Andarine', 0, NULL),
  ('AOD-9604', 0, NULL),
  ('Arimidex', 0, NULL),
  ('Aspirin', 0, NULL),
  ('BPC-157', 0, NULL),
  ('Cabergoline', 0, NULL),
  ('Cardarine', 0, NULL),
  ('Cardarine (GW-501516)', 0, NULL),
  ('Cialis (Tadalafil)', 0, NULL),
  ('Citicoline', 0, NULL),
  ('CJC-1295', 0, NULL),
  ('Clenbuterol', 0, NULL),
  ('Clomid', 0, NULL),
  ('Cytomel', 0, NULL),
  ('DNP', 0, NULL),
  ('DSIP', 0, NULL),
  ('Dutasteride', 0, NULL),
  ('Ephedrine', 0, NULL),
  ('Epistane', 0, NULL),
  ('Epitalon', 0, NULL),
  ('Finasteride', 0, NULL),
  ('Follistatin 344', 0, NULL),
  ('GHK-Cu', 0, NULL),
  ('GHRP-2', 0, NULL),
  ('GHRP-6', 0, NULL),
  ('Halotestin', 0, NULL),
  ('HCG', 0, NULL),
  ('Hexarelin', 0, NULL),
  ('HGH', 0, NULL),
  ('IGF-1 LR3', 0, NULL),
  ('Ipamorelin', 0, NULL),
  ('Ketoconazole', 0, NULL),
  ('KPV', 0, NULL),
  ('Letrozole', 0, NULL),
  ('Levitra (Vardenafil)', 0, NULL),
  ('LGD-4033', 0, NULL),
  ('Ligandrol', 0, NULL),
  ('LL-37', 0, NULL),
  ('Masteron', 0, NULL),
  ('Melanotan II', 0, NULL),
  ('Minoxidil', 0, NULL),
  ('MK-677', 0, NULL),
  ('MOTS-C', 0, NULL),
  ('Niacin', 0, NULL),
  ('Nolvadex', 0, NULL),
  ('Ostarine', 0, NULL),
  ('Pramipexole', 0, NULL),
  ('Proviron', 0, NULL),
  ('PT-141', 0, NULL),
  ('RAD-140', 0, NULL),
  ('Raloxifene', 0, NULL),
  ('Retatrutide', 0, NULL),
  ('RU58841', 0, NULL),
  ('S-23', 0, NULL),
  ('S-4', 0, NULL),
  ('Salbutamol', 0, NULL),
  ('Selank', 0, NULL),
  ('Semaglutide', 0, NULL),
  ('Semax', 0, NULL),
  ('Sermorelin', 0, NULL),
  ('SLU-PP-332', 0, NULL),
  ('SR-9009', 0, NULL),
  ('Synthroid', 0, NULL),
  ('T3 (Liothyronine)', 0, NULL),
  ('T4 (Levothyroxine)', 0, NULL),
  ('TB-500', 0, NULL),
  ('Telmisartan', 0, NULL),
  ('Tesamorelin', 0, NULL),
  ('Tesofensine', 0, NULL),
  ('Thymosin Alpha-1', 0, NULL),
  ('Thymosin Beta-4', 0, NULL),
  ('Tirzepatide', 0, NULL),
  ('Trenbolone', 0, NULL),
  ('Trenbolone Acetate', 0, NULL),
  ('Trenbolone Enanthate', 0, NULL),
  ('Viagra (Sildenafil)', 0, NULL)
) AS v(name, score, notes)
WHERE c.name = v.name;

-- Verification: run after migration to confirm populated rows
-- SELECT name, aromatization_score, LEFT(aromatization_notes, 80) AS notes_preview
-- FROM public.compounds
-- WHERE aromatization_score IS NOT NULL
-- ORDER BY aromatization_score DESC, name;
