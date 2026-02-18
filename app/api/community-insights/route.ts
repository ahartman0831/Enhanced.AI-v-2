import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's onboarding profile for tailored insights
    const { data: onboarding } = await supabase
      .from('user_onboarding_profiles')
      .select('age, sex, ped_experience_level, primary_goal')
      .eq('id', user.id)
      .single()

    const experienceLevel = onboarding?.ped_experience_level || 'intermediate'
    const ageBucket = onboarding?.age != null
      ? onboarding.age >= 40 ? 'age_40_plus' : onboarding.age >= 30 ? 'age_30_39' : 'age_18_29'
      : null
    const goalKey = onboarding?.primary_goal
      ? onboarding.primary_goal.toLowerCase().replace(/\s+/g, '_')
      : null

    // Build subgroup filter: match user's age, experience, goal
    const subgroups = [
      `${experienceLevel}_experience`,
      ...(ageBucket ? [ageBucket] : []),
      ...(goalKey ? [`goal_${goalKey}`] : []),
      null
    ].filter(Boolean)

    const orFilter = subgroups
      .map(s => s === null ? 'subgroup.is.null' : `subgroup.eq.${s}`)
      .join(',')

    // Get anonymized trends from the database
    const { data: trends, error } = await supabase
      .from('anonymized_trends')
      .select('*')
      .or(orFilter)
      .order('calculated_at', { ascending: false })
      .limit(15)

    if (error) {
      console.error('Error fetching anonymized trends:', error)
      return NextResponse.json({
        insights: [{
          category: 'System Status',
          insight: 'Community insights are being calculated. Check back later!',
          educational_note: 'Trends require minimum participation to maintain privacy.'
        }],
        layman_summary: "In plain terms: We're still gathering anonymized data from the community. Once we have enough, you'll see trends that help put your own results in context."
      })
    }

    if (!trends || trends.length === 0) {
      return NextResponse.json({
        insights: [{
          category: 'Getting Started',
          insight: 'Be among the first to contribute anonymized insights for better community data.',
          educational_note: 'More participants help create more accurate educational trends.'
        }],
        layman_summary: "In plain terms: The more people who contribute anonymized data, the more useful these insights become. Your participation helps others understand what's typical—while remembering everyone's results are different."
      })
    }

    // Format trends into insights (tailored to user's age/experience/goal)
    const getSubgroupLabel = (subgroup: string | null) => {
      if (!subgroup) return 'general users'
      if (subgroup.startsWith('age_')) return `users your age (${subgroup.replace('age_', '').replace('_', '-')})`
      if (subgroup.startsWith('goal_')) return `users on ${subgroup.replace('goal_', '').replace(/_/g, ' ')}`
      if (subgroup.endsWith('_experience')) return `users with ${subgroup.replace('_experience', '')} experience`
      return subgroup
    }

    const insights = trends.slice(0, 5).map(trend => {
      let insight = ''
      let educational_note = ''
      const subgroupLabel = getSubgroupLabel(trend.subgroup)
      const metricName = trend.metric.replace('_average_range', '').replace(/_/g, ' ')

      switch (trend.category) {
        case 'bloodwork':
          if (trend.metric.includes('hdl') || trend.metric.includes('cholesterol')) {
            insight = `${subgroupLabel.charAt(0).toUpperCase() + subgroupLabel.slice(1)} report average HDL of ${trend.value.average}`
            educational_note = 'Individual lipid responses vary. Discuss with your physician.'
          } else if (trend.metric.includes('testosterone')) {
            insight = `${subgroupLabel.charAt(0).toUpperCase() + subgroupLabel.slice(1)} averaged ${trend.value.average} in ${metricName} ranges`
            educational_note = 'Individual responses vary significantly from population averages.'
          } else {
            insight = `Community data: ${metricName} average ${trend.value.average} for ${subgroupLabel}`
            educational_note = 'Population averages provide educational context, not predictions.'
          }
          break

        case 'protocols':
          if (trend.metric.includes('duration')) {
            insight = `${subgroupLabel.charAt(0).toUpperCase() + subgroupLabel.slice(1)} typically maintain protocols ~${trend.value.average} days`
            educational_note = 'Protocol duration varies based on individual goals and responses.'
          } else {
            insight = `Community trends: ${trend.value.average} average ${trend.metric.replace(/_/g, ' ')}`
            educational_note = 'Educational insights based on anonymized user experiences.'
          }
          break

        default:
          insight = `Community trend: ${trend.category} - ${metricName} (${trend.value.average})`
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

    // Add layman's terms summary so people understand
    const laymanSummary = insights.length > 0
      ? "In plain terms: These numbers show what others in similar situations often see in their bloodwork and timelines. Your results may be different—everyone responds differently. Use this as general context, not a prediction. Always work with your doctor to interpret your own labs."
      : null

    return NextResponse.json({ insights, layman_summary: laymanSummary })

  } catch (error) {
    console.error('Community insights error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}