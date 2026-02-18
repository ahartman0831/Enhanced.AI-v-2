import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to determine relevant trends
    const { data: profileData } = await supabase
      .from('profiles')
      .select('experience_level')
      .eq('id', user.id)
      .single()

    const experienceLevel = profileData?.experience_level || 'intermediate'

    // Get anonymized trends from the database
    const { data: trends, error } = await supabase
      .from('anonymized_trends')
      .select('*')
      .or(`subgroup.is.null,subgroup.eq.${experienceLevel}_experience`)
      .order('calculated_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching anonymized trends:', error)
      return NextResponse.json({
        insights: [{
          category: 'System Status',
          insight: 'Community insights are being calculated. Check back later!',
          educational_note: 'Trends require minimum participation to maintain privacy.'
        }]
      })
    }

    if (!trends || trends.length === 0) {
      return NextResponse.json({
        insights: [{
          category: 'Getting Started',
          insight: 'Be among the first to contribute anonymized insights for better community data.',
          educational_note: 'More participants help create more accurate educational trends.'
        }]
      })
    }

    // Format trends into insights
    const insights = trends.slice(0, 3).map(trend => {
      let insight = ''
      let educational_note = ''

      switch (trend.category) {
        case 'bloodwork':
          if (trend.metric.includes('testosterone')) {
            insight = `Users with similar experience averaged ${trend.value.average} in ${trend.metric.replace('_average_range', '').replace(/_/g, ' ')} ranges`
            educational_note = 'Individual responses vary significantly from population averages.'
          } else {
            insight = `Community data shows average ${trend.metric.replace(/_/g, ' ')} of ${trend.value.average} for ${trend.subgroup || 'general users'}`
            educational_note = 'Population averages provide educational context, not predictions.'
          }
          break

        case 'protocols':
          if (trend.metric.includes('duration')) {
            insight = `Users typically maintain protocols for an average of ${trend.value.average} days`
            educational_note = 'Protocol duration varies based on individual goals and responses.'
          } else {
            insight = `Community trends show ${trend.value.average} average ${trend.metric.replace(/_/g, ' ')}`
            educational_note = 'Educational insights based on anonymized user experiences.'
          }
          break

        default:
          insight = `Community trend: ${trend.category} - ${trend.metric} (${trend.value.average})`
          educational_note = 'Anonymized data helps improve educational insights.'
      }

      return {
        category: trend.category === 'bloodwork' ? 'Bloodwork Trends' :
                 trend.category === 'protocols' ? 'Protocol Patterns' :
                 'Community Data',
        insight,
        educational_note
      }
    })

    return NextResponse.json({ insights })

  } catch (error) {
    console.error('Community insights error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}