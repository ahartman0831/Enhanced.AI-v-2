/**
 * URL scraper for supplement product pages.
 * Fetches and extracts product info from retailer URLs.
 * SSRF-safe: blocks localhost, internal IPs, file://, etc.
 */

import { load } from 'cheerio'

const MAX_URL_LENGTH = 2048
const FETCH_TIMEOUT_MS = 15000
const MAX_BODY_BYTES = 2 * 1024 * 1024 // 2MB
const ALLOWED_PROTOCOLS = ['http:', 'https:']

/** Blocked hostnames and patterns */
const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
])

/** Private IP ranges (CIDR-style checks) */
function isPrivateOrLoopback(hostname: string): boolean {
  if (BLOCKED_HOSTS.has(hostname.toLowerCase())) return true
  // 10.x.x.x
  if (/^10\./.test(hostname)) return true
  // 192.168.x.x
  if (/^192\.168\./.test(hostname)) return true
  // 172.16.x.x - 172.31.x.x
  const m172 = hostname.match(/^172\.(\d+)\./)
  if (m172) {
    const second = parseInt(m172[1], 10)
    if (second >= 16 && second <= 31) return true
  }
  // IPv6 loopback
  if (hostname === '::1' || hostname.startsWith('::ffff:127.')) return true
  return false
}

export interface ScrapeResult {
  success: boolean
  extractedText?: string
  error?: string
}

/**
 * Validate URL for SSRF safety. Returns error message if invalid.
 */
export function validateProductUrl(urlStr: string): string | null {
  if (!urlStr || typeof urlStr !== 'string') return 'URL is required'
  const trimmed = urlStr.trim()
  if (trimmed.length > MAX_URL_LENGTH) return 'URL is too long'
  if (trimmed.length < 10) return 'URL is too short'

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return 'Invalid URL format'
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return 'Only http and https URLs are allowed'
  }

  const hostname = url.hostname
  if (!hostname) return 'Invalid hostname'

  if (isPrivateOrLoopback(hostname)) {
    return 'This URL is not allowed for security reasons'
  }

  // Block metadata endpoints (cloud providers)
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
    return 'This URL is not allowed for security reasons'
  }

  return null
}

/**
 * Fetch and extract product-relevant text from a URL.
 */
export async function scrapeProductPage(urlStr: string): Promise<ScrapeResult> {
  const validationError = validateProductUrl(urlStr)
  if (validationError) {
    return { success: false, error: validationError }
  }

  const url = new URL(urlStr.trim())
  let html: string

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      return {
        success: false,
        error: `Page returned ${res.status}. Some sites block automated access.`,
      }
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      return { success: false, error: 'URL does not point to an HTML page' }
    }

    const buffer = await res.arrayBuffer()
    if (buffer.byteLength > MAX_BODY_BYTES) {
      return { success: false, error: 'Page is too large to process' }
    }

    html = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Request timed out. The site may be slow or blocking access.' }
      }
      return { success: false, error: err.message }
    }
    return { success: false, error: 'Failed to fetch URL' }
  }

  try {
    const $ = load(html)

    // Remove noise
    $('script, style, noscript, iframe, nav, footer, header, [role="navigation"]').remove()

    // Prefer product-specific selectors (common patterns)
    const productSelectors = [
      '#productDescription',
      '#feature-bullets',
      '#productDetails_techSpec_section_1',
      '.product-description',
      '.product-info',
      '[data-feature-name="productDetails"]',
      '#prodDetails',
      '.a-section.a-spacing-medium.a-spacing-top-small',
      '#important-information',
      '.ingredients',
      '.supplement-facts',
      '[class*="ingredient"]',
      '[class*="product-detail"]',
      '[class*="description"]',
      'main',
      'article',
      '#content',
      '.content',
    ]

    let bestText = ''
    for (const sel of productSelectors) {
      const el = $(sel).first()
      if (el.length) {
        const t = el.text().trim()
        if (t.length > bestText.length && t.length < 50000) {
          bestText = t
        }
      }
    }

    // Fallback: main body text
    if (bestText.length < 100) {
      const body = $('body').text().trim()
      if (body.length > 0 && body.length < 50000) {
        bestText = body
      }
    }

    // Also grab meta description and og:description
    const metaDesc = $('meta[name="description"]').attr('content')?.trim()
    const ogDesc = $('meta[property="og:description"]').attr('content')?.trim()
    const title = $('title').text().trim()

    const parts: string[] = []
    if (title) parts.push(`Title: ${title}`)
    if (metaDesc) parts.push(`Description: ${metaDesc}`)
    if (ogDesc && ogDesc !== metaDesc) parts.push(`Product info: ${ogDesc}`)
    if (bestText) parts.push(`\nPage content:\n${bestText}`)

    const extractedText = parts.join('\n\n').trim()
    if (extractedText.length < 50) {
      return {
        success: false,
        error: 'Could not extract enough text from this page. It may require JavaScript or block automated access.',
      }
    }

    // Truncate for API (keep first ~30k chars to stay within token limits)
    const maxChars = 30000
    const finalText = extractedText.length > maxChars
      ? extractedText.slice(0, maxChars) + '\n\n[Content truncated...]'
      : extractedText

    return { success: true, extractedText: finalText }
  } catch (err) {
    console.error('URL scrape parse error:', err)
    return { success: false, error: 'Failed to parse page content' }
  }
}
