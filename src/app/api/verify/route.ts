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
    const result = await performVerification(user)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Verification process failed' 
    }, { status: 500 })
  }
}