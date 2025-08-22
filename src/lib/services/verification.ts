import axios from 'axios'
import { getDatabase, isDatabaseEnabled, schema } from '../db'

export interface SteamGame {
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

export interface GamesData {
  game_count: number
  games: SteamGame[]
}

export interface VlayerProof {
  presentation?: string
  data?: string
  meta?: {
    notaryUrl?: string
    websocketProxyUrl?: string
  }
  version?: string
  [key: string]: unknown // Allow additional properties
}

export interface SteamOwnedGamesResponse {
  response: {
    game_count: number
    games: SteamGame[]
  }
}

export interface UserData {
  id: string
  name: string
  image: string
  profileUrl: string
}

export interface WebhookPayload {
  steam_user: UserData
  games: GamesData
  vlayer_proof: VlayerProof | null
  timestamp: string
}

export interface VerificationResult {
  success: boolean
  message: string
  webhook_sent?: boolean
  webhook_status?: number
  games_sent: number
  vlayer_proof: string
  vlayer_proof_data?: VlayerProof | null
  verification_id?: string
}

export async function generateVlayerProof(steamId: string): Promise<VlayerProof> {
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

export async function fetchSteamGames(steamId: string): Promise<GamesData> {
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

export async function sendWebhook(payload: WebhookPayload): Promise<{ status: number; success: boolean }> {
  if (!process.env.WEBHOOK_URL) {
    throw new Error('Webhook URL not configured')
  }

  const response = await axios.post(process.env.WEBHOOK_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Steam-Games-Verification/1.0'
    },
    timeout: 10000
  })

  return {
    status: response.status,
    success: response.status >= 200 && response.status < 300
  }
}

export async function storeVerificationResult(
  user: UserData,
  gamesData: GamesData,
  vlayerProof: VlayerProof | null,
  webhookSent: boolean,
  webhookStatus?: number
): Promise<string | null> {
  if (!isDatabaseEnabled()) {
    return null
  }

  const db = getDatabase()
  if (!db) {
    return null
  }

  try {
    const result = await db.insert(schema.verifications).values({
      steamId: user.id,
      steamUsername: user.name,
      steamAvatar: user.image,
      steamProfileUrl: user.profileUrl,
      gameCount: gamesData.game_count,
      gamesData: gamesData,
      vlayerProof: vlayerProof,
      webhookSent: webhookSent.toString(),
      webhookStatus: webhookStatus || null,
    }).returning({ id: schema.verifications.id })

    return result[0]?.id || null
  } catch (error) {
    console.error('Error storing verification result:', error)
    return null
  }
}

export async function performVerification(user: UserData): Promise<VerificationResult> {
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
    
    // Send webhook if URL is configured
    let webhookStatus = null
    let webhookSent = false
    
    if (process.env.WEBHOOK_URL) {
      try {
        const webhookPayload: WebhookPayload = {
          steam_user: user,
          games: gamesData,
          vlayer_proof: vlayerProof,
          timestamp: new Date().toISOString()
        }
        
        const webhookResult = await sendWebhook(webhookPayload)
        webhookStatus = webhookResult.status
        webhookSent = webhookResult.success
        console.log('Webhook sent successfully:', webhookStatus)
      } catch (webhookError) {
        console.error('Webhook failed:', webhookError)
        // Continue with verification even if webhook fails
      }
    }

    // Store verification result in database if enabled
    const verificationId = await storeVerificationResult(
      user,
      gamesData,
      vlayerProof,
      webhookSent,
      webhookStatus || undefined
    )
    
    return {
      success: true,
      message: webhookSent 
        ? 'Verification completed and webhook sent successfully' 
        : 'Verification completed (no webhook configured)',
      webhook_sent: webhookSent,
      webhook_status: webhookStatus || undefined,
      games_sent: gamesData.game_count,
      vlayer_proof: vlayerProof ? 'Generated successfully' : 'Failed to generate',
      vlayer_proof_data: vlayerProof,
      verification_id: verificationId || undefined
    }
  } catch (error) {
    console.error('Error during verification:', error)
    
    if (axios.isAxiosError(error) && error.config?.url?.includes('steampowered.com')) {
      throw new Error('Failed to fetch Steam games data')
    }
    
    throw new Error('Verification process failed')
  }
}