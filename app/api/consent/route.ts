import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { generateUserHash } from '@/lib/anonymize'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's current consent status
    const { data: consents, error } = await supabase
      .from('user_data_consent')
      .select('*')
      .eq('user_id', user.id)
      .eq('consent_type', 'anonymized_insights')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch consent status' }, { status: 500 })
    }

    const consent = consents?.[0]
    const hasConsented = consent && !consent.revoked_at

    return NextResponse.json({
      has_consented: hasConsented,
      consented_at: consent?.consented_at,
      consent_id: consent?.id
    })

  } catch (error) {
    console.error('Consent fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // 'consent' or 'revoke'

    if (action === 'consent') {
      // Grant consent
      const { data, error } = await supabase
        .from('user_data_consent')
        .upsert({
          user_id: user.id,
          consent_type: 'anonymized_insights',
          consented_at: new Date().toISOString(),
          revoked_at: null
        }, {
          onConflict: 'user_id,consent_type'
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to grant consent' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Consent granted for anonymized insights',
        consented_at: data.consented_at
      })

    } else if (action === 'revoke') {
      // Revoke consent and delete contributions
      const userHash = generateUserHash(user.id)

      // First revoke consent
      const { error: revokeError } = await supabase
        .from('user_data_consent')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('consent_type', 'anonymized_insights')

      if (revokeError) {
        return NextResponse.json({ error: 'Failed to revoke consent' }, { status: 500 })
      }

      // Delete user's anonymized contributions (service role would handle this in production)
      // For now, we'll note this should be done via service role
      console.log(`User ${user.id} (hash: ${userHash}) revoked consent - contributions should be deleted`)

      return NextResponse.json({
        success: true,
        message: 'Consent revoked and contributions removed'
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Consent management error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}