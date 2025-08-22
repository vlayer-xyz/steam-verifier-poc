import { NextResponse } from 'next/server'

// Get the correct base URL based on environment
function getBaseUrl() {
  if (process.env.VERCEL_ENV === "production") {
    return "https://steam-verifier-poc.vercel.app"; // Your custom domain
  } else if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`; // Preview/deployment URL
  } else {
    return process.env.APP_URL || 'http://localhost:3000'; // Local development
  }
}

const baseUrl = getBaseUrl();

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