/**
 * Supplement analysis cache and lookup logging.
 * Caches analyses per user (personalized by stack). Logs all lookups for
 * analytics and future sales/discount monitoring.
 */

import { createHash } from 'crypto'

export type SupplementInputType = 'barcode' | 'url' | 'text' | 'image'

export interface CacheLookupParams {
  userId: string
  inputType: SupplementInputType
  inputValue: string
  barcode?: string | null
  productUrl?: string | null
}

export interface SaveAnalysisParams {
  userId: string
  cacheKey: string
  inputType: SupplementInputType
  inputSummary: string
  barcode?: string | null
  productUrl?: string | null
  responseJson: Record<string, unknown>
  productName?: string | null
}

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 32)
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim().toLowerCase())
    u.searchParams.delete('ref')
    u.searchParams.delete('ref_')
    u.searchParams.delete('utm_source')
    u.searchParams.delete('utm_medium')
    u.searchParams.delete('utm_campaign')
    u.searchParams.delete('tag')
    return u.toString()
  } catch {
    return url.trim().toLowerCase()
  }
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Compute cache key for lookup. Same input = same key for cache hit.
 */
export function computeCacheKey(params: CacheLookupParams): string {
  const { userId, inputType, inputValue } = params
  const base = `${userId}:`

  switch (inputType) {
    case 'barcode':
      return base + 'barcode:' + (inputValue.replace(/\D/g, '') || inputValue)
    case 'url':
      return base + 'url:' + sha256(normalizeUrl(inputValue))
    case 'text':
      return base + 'text:' + sha256(normalizeText(inputValue))
    case 'image':
      return base + 'image:' + sha256(inputValue)
    default:
      return base + 'unknown:' + sha256(inputValue)
  }
}

/**
 * Get human-readable input summary for display (max 500 chars).
 */
export function getInputSummary(
  inputType: SupplementInputType,
  inputValue: string,
  barcode?: string | null,
  productUrl?: string | null
): string {
  if (barcode) return barcode
  if (productUrl) return productUrl.length > 200 ? productUrl.slice(0, 200) + '...' : productUrl
  const t = inputValue.trim()
  return t.length > 500 ? t.slice(0, 500) + '...' : t
}

/**
 * Extract product name from analysis response.
 */
export function getProductNameFromResponse(response: Record<string, unknown>): string | null {
  const name = response?.productName
  return typeof name === 'string' ? name : null
}

export interface CachedAnalysis {
  id: string
  response_json: Record<string, unknown>
  lookup_count: number
}

/**
 * Get cached analysis if exists. Returns null on miss.
 */
export async function getCachedAnalysis(
  supabase: Awaited<ReturnType<typeof import('./supabase-server').createSupabaseServerClient>>,
  userId: string,
  cacheKey: string
): Promise<CachedAnalysis | null> {
  const { data, error } = await supabase
    .from('supplement_analyses')
    .select('id, response_json, lookup_count')
    .eq('user_id', userId)
    .eq('cache_key', cacheKey)
    .single()

  if (error || !data) return null
  return data as CachedAnalysis
}

/**
 * Save new analysis to cache and increment lookup count on upsert.
 */
export async function saveAnalysis(
  supabase: Awaited<ReturnType<typeof import('./supabase-server').createSupabaseServerClient>>,
  params: SaveAnalysisParams
): Promise<string> {
  const { userId, cacheKey, inputType, inputSummary, barcode, productUrl, responseJson, productName } = params

  const { data: existing } = await supabase
    .from('supplement_analyses')
    .select('id, lookup_count')
    .eq('user_id', userId)
    .eq('cache_key', cacheKey)
    .single()

  if (existing) {
    await supabase
      .from('supplement_analyses')
      .update({
        lookup_count: (existing.lookup_count as number) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    return existing.id as string
  }

  const { data: inserted, error } = await supabase
    .from('supplement_analyses')
    .insert({
      user_id: userId,
      cache_key: cacheKey,
      input_type: inputType,
      input_summary: inputSummary,
      barcode: barcode || null,
      product_url: productUrl || null,
      product_name: productName || null,
      response_json: responseJson,
      lookup_count: 1,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: raceRow } = await supabase
        .from('supplement_analyses')
        .select('id, lookup_count')
        .eq('user_id', userId)
        .eq('cache_key', cacheKey)
        .single()
      if (raceRow) {
        await supabase
          .from('supplement_analyses')
          .update({
            lookup_count: ((raceRow.lookup_count as number) ?? 1) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', raceRow.id)
        return raceRow.id as string
      }
    }
    throw error
  }
  return (inserted as { id: string }).id
}

/**
 * Increment lookup count for cache hit (call after getCachedAnalysis returns data).
 */
export async function incrementCacheHit(
  supabase: Awaited<ReturnType<typeof import('./supabase-server').createSupabaseServerClient>>,
  analysisId: string
): Promise<void> {
  const { data } = await supabase
    .from('supplement_analyses')
    .select('lookup_count')
    .eq('id', analysisId)
    .single()
  if (data?.lookup_count != null) {
    await supabase
      .from('supplement_analyses')
      .update({
        lookup_count: (data.lookup_count as number) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)
  }
}

/**
 * Log every supplement lookup for analytics and future sales/discount monitoring.
 */
export async function logLookup(
  supabase: Awaited<ReturnType<typeof import('./supabase-server').createSupabaseServerClient>>,
  params: {
    userId: string
    analysisId: string | null
    inputType: SupplementInputType
    inputSummary: string
    barcode?: string | null
    productUrl?: string | null
    productName?: string | null
    wasCacheHit: boolean
  }
): Promise<void> {
  await supabase.from('supplement_lookup_log').insert({
    user_id: params.userId,
    analysis_id: params.analysisId,
    input_type: params.inputType,
    input_summary: params.inputSummary,
    barcode: params.barcode || null,
    product_url: params.productUrl || null,
    product_name: params.productName || null,
    was_cache_hit: params.wasCacheHit,
  })
}
