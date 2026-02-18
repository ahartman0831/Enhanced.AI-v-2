-- Use lbs for all weight measurements
ALTER TABLE profiles RENAME COLUMN weight_kg TO weight_lbs;
