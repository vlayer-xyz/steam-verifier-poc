import { NextResponse } from 'next/server'

const baseUrl = process.env.VERCEL_URL || process.env.APP_URL || 'http://localhost:3000';

export async function GET() {  
  const steamOpenIdUrl = new URL('https://steamcommunity.com/openid/login')
  steamOpenIdUrl.searchParams.set('openid.ns', 'http://specs.openid.net/auth/2.0')
  steamOpenIdUrl.searchParams.set('openid.mode', 'checkid_setup')
  steamOpenIdUrl.searchParams.set('openid.return_to', `${baseUrl}/api/auth/steam/callback`)
  steamOpenIdUrl.searchParams.set('openid.realm', baseUrl)
  steamOpenIdUrl.searchParams.set('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select')
  steamOpenIdUrl.searchParams.set('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select')
  
  return NextResponse.redirect(steamOpenIdUrl.toString())
}