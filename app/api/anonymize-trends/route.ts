import { NextRequest, NextResponse } from 'next/server'
import { aggregateTrends } from '@/lib/anonymize'

/**
 * Weekly job stub — aggregate consented data into anonymized_trends.
 * Call via cron (e.g. Vercel Cron, GitHub Actions) with CRON_SECRET header.
 * Buckets: age (18-29, 30-39, 40+), sex, experience, goal.
 */
export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '') || request.headers.get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await aggregateTrends()

    return NextResponse.json({ success: true, message: 'Anonymized trends aggregated' })
  } catch (error) {
    console.error('Anonymize trends error:', error)
    return NextResponse.json(
      { error: 'Failed to aggregate trends' },
      { status: 500 }
    )
  }
}
