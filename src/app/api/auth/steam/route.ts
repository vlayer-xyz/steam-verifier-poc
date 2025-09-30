import { NextRequest, NextResponse } from 'next/server'

// Get the correct base URL based on environment
function getBaseUrl() {
  if (process.env.VERCEL_ENV === "production") {
    return "https://elympics.vlayer.xyz"; // Your custom domain
  } else if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`; // Preview/deployment URL
  } else {
    return process.env.APP_URL || 'http://localhost:3000'; // Local development
  }
}

const baseUrl = getBaseUrl();

export async function GET(request: NextRequest) {  
  const webhookUrl = request.nextUrl.searchParams.get('webhookUrl')
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
  const steamOpenIdUrl = new URL('https://steamcommunity.com/openid/login')
  steamOpenIdUrl.searchParams.set('openid.ns', 'http://specs.openid.net/auth/2.0')
  steamOpenIdUrl.searchParams.set('openid.mode', 'checkid_setup')

  const returnToUrl = new URL(`${baseUrl}/api/auth/steam/callback`)
  if (webhookUrl) {
    returnToUrl.searchParams.set('webhookUrl', webhookUrl)
  }
  if (callbackUrl) {
    returnToUrl.searchParams.set('callbackUrl', callbackUrl)
  }

  steamOpenIdUrl.searchParams.set('openid.return_to', returnToUrl.toString())
  steamOpenIdUrl.searchParams.set('openid.realm', baseUrl)
  steamOpenIdUrl.searchParams.set('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select')
  steamOpenIdUrl.searchParams.set('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select')
  
  return NextResponse.redirect(steamOpenIdUrl.toString())
}
