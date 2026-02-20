-- Clear pre-seeded minimal full_breakdown_json placeholders so the next user request
-- triggers fresh AI generation via full_compound_breakdown prompt.
-- Minimal placeholders lack layman_summary (required by the prompt) and have
-- abbreviated what_it_is / risks_and_side_effects.
UPDATE compounds
SET full_breakdown_json = NULL,
    breakdown_updated_at = NULL
WHERE full_breakdown_json IS NOT NULL
  AND (full_breakdown_json->>'layman_summary') IS NULL;
