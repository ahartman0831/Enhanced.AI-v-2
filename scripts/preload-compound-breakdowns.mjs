#!/usr/bin/env node
/**
 * Bulk preload compound scientific breakdowns via Grok API.
 * Processes compounds in parallel (default 4 at a time) to avoid rate limits.
 *
 * Run: node --env-file=.env.local scripts/preload-compound-breakdowns.mjs
 * Options:
 *   --all         Preload ALL compounds (default: only those missing/invalid breakdown)
 *   --concurrency=N  Max parallel Grok calls (default: 4)
 *   --backfill    Fill null what_it_is/common_uses/etc from existing full_breakdown_json (no Grok calls)
 *   --fix-limited Update compounds with limited card display (missing Common Uses, What It Is, etc.)
 *                 Runs backfill first, then Grok for any still missing data.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import https from 'https'

const __dirname = dirname(fileURLToPath(import.meta.url))

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const grokKey = process.env.GROK_API_KEY

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}
if (!grokKey) {
  console.error('Missing GROK_API_KEY in .env.local')
  process.exit(1)
}

const args = process.argv.slice(2)
const preloadAll = args.includes('--all')
const backfillOnly = args.includes('--backfill')
const fixLimited = args.includes('--fix-limited')
const concurrencyArg = args.find((a) => a.startsWith('--concurrency='))
const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : 4

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

const PROMPT_PATH = join(__dirname, '..', 'prompts', 'full_compound_breakdown.txt')
const GROK_URL = 'https://api.x.ai/v1/chat/completions'

function loadPrompt() {
  return readFileSync(PROMPT_PATH, 'utf8')
    .replace(/\$\{compoundName\}/g, 'PLACEHOLDER_NAME')
    .replace(/\$\{aaRatioJson\}/g, 'PLACEHOLDER_AA')
}

function buildPrompt(compoundName, aaRatioJson) {
  const template = loadPrompt()
  return template
    .replace(/PLACEHOLDER_NAME/g, compoundName)
    .replace(/PLACEHOLDER_AA/g, aaRatioJson != null ? JSON.stringify(aaRatioJson) : 'null')
}

async function callGrok(compoundName, aaRatioJson) {
  const prompt = buildPrompt(compoundName, aaRatioJson)
  const body = JSON.stringify({
    messages: [{ role: 'user', content: prompt }],
    model: 'grok-4-1-fast-reasoning',
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      GROK_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${grokKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Grok API ${res.statusCode}: ${data}`))
            return
          }
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.message?.content
            if (!content) reject(new Error('No content from Grok'))
            else resolve(JSON.parse(content.trim()))
          } catch (e) {
            reject(e)
          }
        })
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function parseBreakdownForDb(breakdown) {
  const arr = (v) => (Array.isArray(v) ? v.map(String) : null)
  const str = (v) => (v != null && typeof v === 'string' ? v : null)
  const toStrArray = (v) => {
    if (!Array.isArray(v)) return null
    return v.map((item) => (typeof item === 'string' ? item : item?.marker != null ? String(item.marker) : '')).filter(Boolean)
  }
  const risksToStr = (v) => {
    if (v != null && typeof v === 'string') return v
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      const parts = Object.values(v).filter((x) => x != null && typeof x === 'string').map((x) => String(x))
      return parts.length > 0 ? parts.join(' ') : null
    }
    return null
  }
  return {
    key_monitoring_markers: toStrArray(breakdown.monitoring_markers) ?? arr(breakdown.monitoring_markers),
    affected_systems: arr(breakdown.affected_systems),
    what_it_is: str(breakdown.what_it_is) ?? null,
    common_uses: str(breakdown.bodybuilding_discussions) ?? str(breakdown.medical_uses) ?? null,
    nutrition_impact_summary: str(breakdown.nutrition_impact) ?? null,
    side_effects: risksToStr(breakdown.risks_and_side_effects) ?? null,
  }
}

async function processCompound(compound, index, total) {
  const { id, name, aa_ratio, aromatization_score, aromatization_notes } = compound
  process.stdout.write(`[${index + 1}/${total}] ${name}... `)
  try {
    const breakdown = await callGrok(name, aa_ratio)
    if (aromatization_score != null || aromatization_notes) {
      const sciMetrics = breakdown.scientific_metrics || {}
      sciMetrics.aromatization = {
        score: aromatization_score,
        notes: aromatization_notes,
        disclaimer: 'Generalized community/literature observation only — individual responses vary dramatically. Not predictive or medical advice.',
      }
      breakdown.scientific_metrics = sciMetrics
    }
    const row = parseBreakdownForDb(breakdown)
    const { error } = await supabase
      .from('compounds')
      .update({
        full_breakdown_json: breakdown,
        breakdown_updated_at: new Date().toISOString(),
        key_monitoring_markers: row.key_monitoring_markers,
        affected_systems: row.affected_systems,
        what_it_is: row.what_it_is,
        common_uses: row.common_uses,
        nutrition_impact_summary: row.nutrition_impact_summary,
        side_effects: row.side_effects,
      })
      .eq('id', id)
    if (error) throw error
    console.log('✓')
    return { name, ok: true }
  } catch (err) {
    console.log('✗')
    return { name, ok: false, error: err.message }
  }
}

async function runInParallel(items, fn, limit) {
  const results = []
  const executing = []
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item))
    results.push(p)
    const e = p.then(() => executing.splice(executing.indexOf(e), 1))
    executing.push(e)
    if (executing.length >= limit) await Promise.race(executing)
  }
  return Promise.all(results)
}

async function backfillFromJson(compounds) {
  const needBackfill = compounds.filter((c) => {
    const json = c.full_breakdown_json
    if (!json || typeof json !== 'object') return false
    return !c.what_it_is || !c.common_uses || !c.nutrition_impact_summary || !c.side_effects
  })
  if (needBackfill.length === 0) {
    console.log('No compounds need backfill (all have what_it_is, common_uses, etc.).')
    return
  }
  console.log(`Backfilling ${needBackfill.length} compound(s) from existing breakdown JSON...\n`)
  for (const c of needBackfill) {
    const row = parseBreakdownForDb(c.full_breakdown_json)
    const updates = {}
    if (!c.what_it_is && row.what_it_is) updates.what_it_is = row.what_it_is
    if (!c.common_uses && row.common_uses) updates.common_uses = row.common_uses
    if (!c.nutrition_impact_summary && row.nutrition_impact_summary) updates.nutrition_impact_summary = row.nutrition_impact_summary
    if (!c.side_effects && row.side_effects) updates.side_effects = row.side_effects
    if (Object.keys(updates).length === 0) {
      console.log(`  - ${c.name} (no extractable data)`)
      continue
    }
    const { error } = await supabase.from('compounds').update(updates).eq('id', c.id)
    if (error) console.error(`  ✗ ${c.name}: ${error.message}`)
    else console.log(`  ✓ ${c.name}`)
  }
  console.log('\nBackfill done.')
}

function isLimited(compound) {
  return (
    !compound.common_uses ||
    !compound.what_it_is ||
    !compound.nutrition_impact_summary ||
    !compound.side_effects
  )
}

async function runFixLimited(compounds) {
  const limited = compounds.filter(isLimited)
  if (limited.length === 0) {
    console.log('All compounds have full card display (Common Uses, What It Is, Nutrition Impact, Side Effects).')
    return
  }
  console.log(`Found ${limited.length} compound(s) with limited card display.\n`)

  // Step 1: Backfill from existing full_breakdown_json (no Grok calls)
  const needBackfill = limited.filter((c) => {
    const json = c.full_breakdown_json
    return json && typeof json === 'object'
  })
  if (needBackfill.length > 0) {
    console.log(`Step 1: Backfilling ${needBackfill.length} compound(s) from existing breakdown JSON...`)
    for (const c of needBackfill) {
      const row = parseBreakdownForDb(c.full_breakdown_json)
      const updates = {}
      if (!c.what_it_is && row.what_it_is) updates.what_it_is = row.what_it_is
      if (!c.common_uses && row.common_uses) updates.common_uses = row.common_uses
      if (!c.nutrition_impact_summary && row.nutrition_impact_summary) updates.nutrition_impact_summary = row.nutrition_impact_summary
      if (!c.side_effects && row.side_effects) updates.side_effects = row.side_effects
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('compounds').update(updates).eq('id', c.id)
        if (error) console.error(`  ✗ ${c.name}: ${error.message}`)
        else console.log(`  ✓ ${c.name}`)
      }
    }
    console.log('')
  }

  // Step 2: Re-fetch and find compounds still limited (need Grok)
  const { data: refreshed } = await supabase
    .from('compounds')
    .select('id, name, full_breakdown_json, breakdown_updated_at, aa_ratio, aromatization_score, aromatization_notes, what_it_is, common_uses, nutrition_impact_summary, side_effects')
    .order('name')

  const stillLimited = refreshed.filter(isLimited)
  if (stillLimited.length === 0) {
    console.log('All limited compounds updated via backfill. Done.')
    return
  }

  console.log(`Step 2: ${stillLimited.length} compound(s) still need Grok (no valid breakdown). Preloading...\n`)
  const results = await runInParallel(
    stillLimited.map((c, i) => ({ compound: c, index: i, total: stillLimited.length })),
    ({ compound, index, total }) => processCompound(compound, index, total),
    CONCURRENCY
  )
  const ok = results.filter((r) => r.ok)
  const fail = results.filter((r) => !r.ok)
  console.log(`\nDone: ${ok.length} succeeded, ${fail.length} failed`)
  if (fail.length > 0) fail.forEach((r) => console.error(`  ✗ ${r.name}: ${r.error}`))
}

async function main() {
  const { data: compounds, error } = await supabase
    .from('compounds')
    .select('id, name, full_breakdown_json, breakdown_updated_at, aa_ratio, aromatization_score, aromatization_notes, what_it_is, common_uses, nutrition_impact_summary, side_effects')
    .order('name')

  if (error) {
    console.error('Failed to fetch compounds:', error.message)
    process.exit(1)
  }

  if (backfillOnly) {
    await backfillFromJson(compounds)
    return
  }

  if (fixLimited) {
    await runFixLimited(compounds)
    return
  }

  const CACHE_DAYS = 30
  const cacheCutoff = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000)

  const toProcess = preloadAll
    ? compounds
    : compounds.filter((c) => {
        const json = c.full_breakdown_json
        const hasLayman = json && typeof json === 'object' && json.layman_summary
        const updated = c.breakdown_updated_at ? new Date(c.breakdown_updated_at) : null
        const isStale = !updated || updated < cacheCutoff
        return !hasLayman || isStale
      })

  if (toProcess.length === 0) {
    console.log('All compounds already have valid breakdowns. Use --all to force refresh.')
    return
  }

  console.log(`Preloading ${toProcess.length} compound(s) with concurrency ${CONCURRENCY}...\n`)

  const results = await runInParallel(
    toProcess.map((c, i) => ({ compound: c, index: i, total: toProcess.length })),
    ({ compound, index, total }) => processCompound(compound, index, total),
    CONCURRENCY
  )

  const ok = results.filter((r) => r.ok)
  const fail = results.filter((r) => !r.ok)

  console.log(`\nDone: ${ok.length} succeeded, ${fail.length} failed`)
  if (fail.length > 0) {
    fail.forEach((r) => console.error(`  ✗ ${r.name}: ${r.error}`))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
