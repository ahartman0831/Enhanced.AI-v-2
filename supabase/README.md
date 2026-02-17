# Supabase Schema for Enhanced AI v2

This directory contains the database schema and migrations for the Enhanced AI v2 application.

## Files

- `schema.sql` - Complete database schema with all tables, RLS policies, and indexes
- `seed.sql` - Seed data with 20 common compounds for educational purposes
- `migrations/` - Supabase migration files for version control

## Tables

### User-Owned Tables (RLS Enabled)
- **profiles** - User profile information linked to auth.users
- **enhanced_protocols** - User's protocol stacks and nutrition impact analysis
- **bloodwork_reports** - Blood test reports with analysis and projections
- **photo_reports** - Body composition photo reports with AI analysis
- **token_usage_log** - API token usage tracking for AI features

### Public Tables
- **compounds** - Educational compound database (public read access)

## Row Level Security (RLS)

All user-owned tables have RLS enabled with `auth.uid() = user_id` policies ensuring users can only access their own data.

## Running Migrations

### Local Development
```bash
# Start Supabase locally (requires Docker)
npx supabase start

# Apply migrations
npx supabase db reset
```

### Production/Remote
```bash
# Link to your remote project
npx supabase link --project-ref your-project-ref

# Apply migrations
npx supabase db push
```

## Seed Data

The seed data includes 20 common compounds with educational information including:
- Risk scores (1-10 scale)
- Affected biological systems
- Key monitoring markers
- Nutrition impact summaries

⚠️ **Important**: This educational data does not include dosage information and is for informational purposes only.

## Environment Variables

Make sure your `.env.local` file contains:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```