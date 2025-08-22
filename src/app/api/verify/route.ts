import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

interface SteamGame {
  appid: number
  name?: string
  playtime_forever: number
  img_icon_url?: string
  img_logo_url?: string
  playtime_windows_forever?: number
  playtime_mac_forever?: number
  playtime_linux_forever?: number
  rtime_last_played?: number
  playtime_disconnected?: number
}

interface SteamOwnedGamesResponse {
  response: {
    game_count: number
    games: SteamGame[]
  }
}

interface UserData {
  id: string
  name: string
  image: string
  profileUrl: string
}

interface WebhookPayload {
  steam_user: UserData
  games: {
    game_count: number
    games: SteamGame[]
  }
  vlayer_proof: any | null
  timestamp: string
}

async function generateVlayerProof(steamId: string) {
  try {
    // Build the Steam API URL with all required query parameters
    const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&format=json`
    
    const response = await axios.post('https://web-proof-vercel-oq8rvyvuw-vlayer.vercel.app/api/handler', {
      url: steamApiUrl,
      method: "GET",
      notaryUrl: "https://test-notary.vlayer.xyz/v0.1.0-alpha.11/",
      headers: []
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    return response.data
  } catch (error) {
    console.error('Error generating vlayer proof:', error)
    throw error
  }
}

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

async function fetchSteamGames(steamId: string): Promise<{ game_count: number; games: SteamGame[] }> {
  const response = await axios.get<SteamOwnedGamesResponse>(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`,
    {
      params: {
        key: process.env.STEAM_API_KEY,
        steamid: steamId,
        include_appinfo: true,
        format: 'json'
      }
    }
  )
  
  const games = response.data.response.games || []
  
  return {
    game_count: response.data.response.game_count,
    games: games
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
  
  if (!process.env.WEBHOOK_URL) {
    return NextResponse.json({ 
      success: false,
      message: 'Webhook URL not configured - games not sent',
      games_count: 0
    })
  }
  
  try {
    // Fetch Steam games data
    const gamesData = await fetchSteamGames(user.id)
    
    // Generate vlayer proof
    let vlayerProof = null
    try {
      vlayerProof = await generateVlayerProof(user.id)
      console.log('Vlayer proof generated successfully:', vlayerProof)
    } catch (proofError) {
      console.warn('Failed to generate vlayer proof, continuing without it:', proofError)
    }
    
    const webhookPayload: WebhookPayload = {
      steam_user: user,
      games: gamesData,
      vlayer_proof: vlayerProof,
      timestamp: new Date().toISOString()
    }
    
    const webhookResponse = await axios.post(process.env.WEBHOOK_URL, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Steam-Games-Verification/1.0'
      },
      timeout: 10000
    })
    
    return NextResponse.json({
      success: true,
      message: 'Games data sent to webhook successfully',
      webhook_status: webhookResponse.status,
      games_sent: gamesData.game_count,
      vlayer_proof: vlayerProof ? 'Generated successfully' : 'Failed to generate',
      vlayer_proof_data: vlayerProof
    })
    
  } catch (error) {
    console.error('Error sending to webhook:', error)
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return NextResponse.json({ error: 'Webhook request timed out' }, { status: 408 })
      }
      if (error.response) {
        return NextResponse.json({
          error: 'Webhook request failed',
          webhook_status: error.response.status,
          webhook_error: error.response.data
        }, { status: 502 })
      }
    }
    
    return NextResponse.json({ error: 'Failed to send data to webhook' }, { status: 500 })
  }
}