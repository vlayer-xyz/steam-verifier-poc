import { NextRequest, NextResponse } from 'next/server'

interface UserData {
  id: string
  name: string
  image: string
  profileUrl: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const steamUserCookie = request.cookies.get('steam_user')
  
  if (!steamUserCookie) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
  
  try {
    const userData: UserData = JSON.parse(steamUserCookie.value)
    return NextResponse.json({ user: userData }, { status: 200 })
  } catch (error) {
    console.error('Error parsing user cookie:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}