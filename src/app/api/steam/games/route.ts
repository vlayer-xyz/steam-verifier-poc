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

function isAuthenticated(request: NextRequest): string | null {
  const steamUserCookie = request.cookies.get('steam_user')
  
  if (!steamUserCookie) {
    return null
  }
  
  try {
    const userData = JSON.parse(steamUserCookie.value)
    return userData.id
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const steamId = isAuthenticated(request)
  
  if (!steamId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  
  if (!process.env.STEAM_API_KEY) {
    return NextResponse.json({ error: 'Steam API key not configured' }, { status: 500 })
  }
  
  try {
    const gamesData = await fetchSteamGames(steamId)
    return NextResponse.json(gamesData)
    
  } catch (error) {
    console.error('Error fetching Steam games:', error)
    return NextResponse.json({ error: 'Failed to fetch games from Steam API' }, { status: 500 })
  }
}