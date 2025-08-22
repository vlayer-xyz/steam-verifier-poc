import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

interface OpenIDParams {
  [key: string]: string
}

interface SteamPlayer {
  steamid: string
  personaname: string
  avatarfull: string
  profileurl: string
}

interface SteamAPIResponse {
  response: {
    players: SteamPlayer[]
  }
}

interface UserData {
  id: string
  name: string
  image: string
  profileUrl: string
}

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

async function verifySteamOpenID(openidParams: OpenIDParams): Promise<string> {
  const endpoint = "https://steamcommunity.com/openid/login";

  // Copy all params and replace mode
  const data = new URLSearchParams(openidParams);
  data.set("openid.mode", "check_authentication");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data.toString()
  });

  if (!res.ok) {
    throw new Error("Failed to contact Steam OpenID endpoint");
  }

  const text = await res.text();

  // Response is key-value pairs, we only care about is_valid
  if (/is_valid\s*:\s*true/.test(text)) {
    // Extract SteamID64
    const claimedId = openidParams["openid.claimed_id"];
    const match = claimedId.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
    if (!match) {
      throw new Error("Invalid claimed_id format");
    }
    return match[1]; // SteamID64 string
  } else {
    throw new Error("Steam OpenID response not valid");
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams
  const openidParams: OpenIDParams = Object.fromEntries(searchParams.entries())
  
  if (openidParams['openid.mode'] !== 'id_res') {
    return NextResponse.redirect('/?error=steam_auth_failed')
  }
  
  try {
    const steamId = await verifySteamOpenID(openidParams)
    
    if (!steamId) {
      return NextResponse.redirect('/?error=no_steam_id')
    }
    
    // Get user info from Steam API
    const steamApiResponse = await axios.get<SteamAPIResponse>(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
    )
    
    const player = steamApiResponse.data.response.players[0]
    
    if (!player) {
      return NextResponse.redirect(`${baseUrl}/?error=steam_user_not_found`)
    }
    
    // Store user data in session or JWT
    const userData: UserData = {
      id: player.steamid,
      name: player.personaname,
      image: player.avatarfull,
      profileUrl: player.profileurl,
    }
    

    const response = NextResponse.redirect(`${baseUrl}/?user=${encodeURIComponent(JSON.stringify(userData))}`)
    
    // Set a cookie with user data
    response.cookies.set('steam_user', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return response
    
  } catch (error) {
    console.error('Steam authentication error:', error)
    return NextResponse.redirect(`${baseUrl}/?error=steam_auth_error`)
  }
}