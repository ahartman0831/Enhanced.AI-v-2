-- Add input/output token columns and cost for Grok API cost tracking
-- Input: $0.20 per million tokens, Output: $0.50 per million tokens

ALTER TABLE token_usage_log
  ADD COLUMN IF NOT EXISTS input_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS output_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(12, 8);

-- Backfill tokens_used as input+output where we only have total (legacy rows)
-- New rows will have input_tokens + output_tokens populated
COMMENT ON COLUMN token_usage_log.input_tokens IS 'Prompt/input tokens from Grok API';
COMMENT ON COLUMN token_usage_log.output_tokens IS 'Completion/output tokens from Grok API';
COMMENT ON COLUMN token_usage_log.cost_usd IS 'Calculated cost: input*0.20/1e6 + output*0.50/1e6';

-- Example: total cost by feature
-- SELECT feature_name, SUM(cost_usd) AS total_cost_usd, SUM(input_tokens) AS total_input, SUM(output_tokens) AS total_output
-- FROM token_usage_log WHERE cost_usd IS NOT NULL GROUP BY feature_name;
