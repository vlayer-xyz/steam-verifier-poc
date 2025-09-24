import { NextRequest, NextResponse } from 'next/server'
import { performVerification, UserData } from '@/lib/services/verification'

function getAuthenticatedUser(request: NextRequest): UserData | null {
  const steamUserCookie = request.cookies.get('steam_user')
  
  if (!steamUserCookie) {
    return null
  }
  
  try {
    const userData: UserData = JSON.parse(steamUserCookie.value)
    return userData
  } catch {
    return null
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = getAuthenticatedUser(request)
  
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  
  if (!process.env.STEAM_API_KEY) {
    return NextResponse.json({ error: 'Steam API key not configured' }, { status: 500 })
  }
  
  try {
    let webhookUrl: string | null = null
    try {
      const body = await request.json()
      webhookUrl = typeof body?.webhookUrl === 'string' ? body.webhookUrl : null
    } catch {
      // Ignore JSON parse errors; webhookUrl handled below
    }

    if (!webhookUrl) {
      return NextResponse.json({ error: 'webhookUrl is required' }, { status: 400 })
    }

    try {
      webhookUrl = new URL(webhookUrl).toString()
    } catch {
      return NextResponse.json({ error: 'webhookUrl must be a valid absolute URL' }, { status: 400 })
    }

    const result = await performVerification(user, webhookUrl)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Verification process failed' 
    }, { status: 500 })
  }
}
