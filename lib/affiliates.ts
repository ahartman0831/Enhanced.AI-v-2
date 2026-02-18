/**
 * Amazon Affiliate Link Generation
 * Supports development through affiliate commissions
 */

const AMAZON_ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'enhancedai-20'
const AMAZON_DOMAIN = 'amazon.com'

/**
 * Common supplements with their Amazon search terms and ASINs
 * ASINs can be updated for specific products
 */
const SUPPLEMENT_ASINS: { [key: string]: string } = {
  // Common supports
  'Fish Oil': 'B000GGK0A0', // NOW Foods Ultra Omega-3
  'Vitamin D3': 'B07P9QJQ5Q', // NOW Foods Vitamin D3
  'Magnesium': 'B00014D1Z6', // NOW Foods Magnesium Citrate
  'Zinc': 'B00014D1Z8', // NOW Foods Zinc
  'Vitamin K2': 'B07P9QJQ5R', // NOW Foods Vitamin K2
  'CoQ10': 'B000GGK0A2', // NOW Foods CoQ10
  'N-Acetyl Cysteine (NAC)': 'B00014D1Z4', // NOW Foods NAC
  'Milk Thistle': 'B000GGK0A4', // NOW Foods Milk Thistle
  'TUDCA': 'B08L9Q8Q3L', // Double Wood Supplements TUDCA
  'Ashwagandha': 'B07P9QJQ5T', // NOW Foods Ashwagandha
  'Rhodiola Rosea': 'B000GGK0A6', // NOW Foods Rhodiola
  'L-Theanine': 'B07P9QJQ5U', // NOW Foods L-Theanine
  'Melatonin': 'B000GGK0A8', // NOW Foods Melatonin
  'Vitamin C': 'B000GGK0AA', // NOW Foods Vitamin C
  'Probiotics': 'B07P9QJQ5V', // NOW Foods Probiotics
  'Electrolyte Powder': 'B07P9QJQ5W', // Ultima Replenisher Electrolytes

  // Hormonal supports
  'D-Aspartic Acid': 'B08L9Q8Q3M', // BulkSupplements DAA
  'Fenugreek': 'B07P9QJQ5X', // NOW Foods Fenugreek
  'Tribulus Terrestris': 'B000GGK0AC', // NOW Foods Tribulus
  'Maca Root': 'B07P9QJQ5Y', // NOW Foods Maca
  'DIM': 'B006KL4TYG', // DIM for estrogen metabolism
  'Vitamin B6': 'B0013OUPJ0', // B6 for prolactin

  // Recovery supports
  'Glutamine': 'B000GGK0AE', // NOW Foods Glutamine
  'BCAAs': 'B07P9QJQ5Z', // NOW Foods BCAAs
  'Creatine Monohydrate': 'B000GGK0AG', // NOW Foods Creatine
  'Beta-Alanine': 'B07P9QJQ6A', // NOW Foods Beta-Alanine
}

/**
 * Generate Amazon affiliate link for a supplement
 * @param supplementName - Name of the supplement
 * @param searchTerm - Optional custom search term if ASIN not found
 * @returns Full Amazon affiliate URL
 */
export function generateAmazonAffiliateLink(supplementName: string, searchTerm?: string): string {
  // Try to find ASIN first
  const asin = SUPPLEMENT_ASINS[supplementName] || SUPPLEMENT_ASINS[supplementName.toLowerCase()]

  if (asin) {
    // Direct product link
    return `https://${AMAZON_DOMAIN}/dp/${asin}?tag=${AMAZON_ASSOCIATE_TAG}`
  } else {
    // Fallback to search link
    const term = searchTerm || supplementName.replace(/\s+/g, '+').toLowerCase()
    return `https://${AMAZON_DOMAIN}/s?k=${encodeURIComponent(term)}&tag=${AMAZON_ASSOCIATE_TAG}`
  }
}

/**
 * Get affiliate disclosure text for legal compliance
 */
export function getAffiliateDisclosure(): string {
  return "Some links earn commissions to support app development. Prices and availability subject to change."
}

/**
 * Check if a supplement has a direct product link
 */
export function hasDirectProductLink(supplementName: string): boolean {
  return !!(SUPPLEMENT_ASINS[supplementName] || SUPPLEMENT_ASINS[supplementName.toLowerCase()])
}

/**
 * Get all available supplements with affiliate links
 */
export function getAvailableSupplements(): string[] {
  return Object.keys(SUPPLEMENT_ASINS)
}

/**
 * Generate search-based affiliate link for any product
 */
export function generateSearchAffiliateLink(searchTerm: string): string {
  const encodedTerm = encodeURIComponent(searchTerm.replace(/\s+/g, ' '))
  return `https://${AMAZON_DOMAIN}/s?k=${encodedTerm}&tag=${AMAZON_ASSOCIATE_TAG}`
}

/**
 * Telehealth & lab partner URLs (affiliate links when available)
 * Set env vars for actual affiliate URLs: HIMS_AFFILIATE_URL, HAPPY_HEAD_AFFILIATE_URL, QUEST_AFFILIATE_URL, LETSGETCHECKED_AFFILIATE_URL
 */
export const TELEHEALTH_PARTNERS = {
  hims: process.env.NEXT_PUBLIC_HIMS_AFFILIATE_URL || 'https://www.forhims.com/',
  happyHead: process.env.NEXT_PUBLIC_HAPPY_HEAD_AFFILIATE_URL || 'https://happyhead.com/',
  quest: process.env.NEXT_PUBLIC_QUEST_AFFILIATE_URL || 'https://www.questdiagnostics.com/',
  letsGetChecked: process.env.NEXT_PUBLIC_LETSGETCHECKED_AFFILIATE_URL || 'https://www.letsgetchecked.com/',
} as const

/**
 * Lab testing partners for counterfeit/product verification (educational)
 * AnabolicLab: independent testing for supplements/compounds
 */
export const LAB_TESTING_PARTNERS = {
  anabolicLab: process.env.NEXT_PUBLIC_ANABOLICLAB_AFFILIATE_URL || 'https://anaboliclab.com/',
} as const

/**
 * Get lab testing CTA URL for counterfeit checker verification methods
 */
export function getLabTestingLink(partner: keyof typeof LAB_TESTING_PARTNERS = 'anabolicLab'): string {
  return LAB_TESTING_PARTNERS[partner]
}

/**
 * Get CTA link for a partner type (used in partnership_note parsing)
 */
export function getPartnerLink(partner: keyof typeof TELEHEALTH_PARTNERS): string {
  return TELEHEALTH_PARTNERS[partner]
}

/**
 * Generate affiliate link for supplement category
 */
export function generateCategoryAffiliateLink(category: string): string {
  const categorySearches: { [key: string]: string } = {
    'Cardiovascular': 'omega 3 fish oil coq10',
    'Hormonal': 'vitamin d3 zinc magnesium',
    'Liver': 'milk thistle nac tudca',
    'Recovery': 'glutamine bcaa creatine',
    'Sleep': 'magnesium l-theanine melatonin',
    'Stress': 'ashwagandha rhodiola',
    'Digestive': 'probiotics digestive enzymes',
    'Electrolyte': 'electrolyte powder minerals',
  }

  const searchTerm = categorySearches[category] || `${category} supplements`
  return generateSearchAffiliateLink(searchTerm)
}