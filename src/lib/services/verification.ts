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
  vlayer_proof_error?: string
  webhook_error?: string
}

export async function generateVlayerProof(steamId: string): Promise<VlayerProof> {
  try {
    // Build the Steam API URL for vlayer proof (without include_appinfo to reduce payload size)
    const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&format=json`
    
    
    const response = await axios.post(
      'https://web-prover.vlayer.xyz/api/v1/prove', 
      {
        url: steamApiUrl,
        method: "GET",
        headers: []
      }, 
      {
        headers: {
          'Content-Type': 'application/json',
           "x-client-id": "35f0d2ff-a881-45a9-ac36-21ad4006a625",
           "Authorization": "Bearer RDDH7QMHAkyfmtLgQ5EMh671haJnRl9Lzgy5TSLNabZkm2IMhKKTkiOVWsxW"
        },
        timeout: 30000, // 30 second timeout for proof generation
      }
    )
    
    console.log('✅ Vlayer proof generated successfully')
    return response.data
  } catch (error) {
    console.error('❌ Error generating vlayer proof:', error)
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Vlayer proof generation timed out')
      }
      if (error.response) {
        throw new Error(`Vlayer service error: ${error.response.status} - ${error.response.statusText}`)
      }
      if (error.request) {
        throw new Error('Unable to connect to vlayer service')
      }
    }
    
    throw new Error('Failed to generate vlayer proof')
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

export async function sendWebhook(webhookUrl: string, payload: WebhookPayload): Promise<{ status: number; success: boolean }> {
  const response = await axios.post(webhookUrl, payload, {
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

export async function performVerification(user: UserData, webhookUrl: string): Promise<VerificationResult> {
  try {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required')
    }

    // Fetch Steam games data
    const gamesData = await fetchSteamGames(user.id)
    
    // Generate vlayer proof
    let vlayerProof = null
    let vlayerProofError: string | null = null
    try {
      vlayerProof = await generateVlayerProof(user.id)
      console.log('Vlayer proof generated successfully:', vlayerProof)
    } catch (proofError) {
      console.warn('Failed to generate vlayer proof, continuing without it:', proofError)
      if (proofError instanceof Error) {
        vlayerProofError = proofError.message
      } else {
        vlayerProofError = 'Unknown vlayer proof error'
      }
    }
    
    // Send webhook if URL is configured
    let webhookStatus = null
    let webhookSent = false
    let webhookErrorMessage: string | null = null

    try {
      const webhookPayload: WebhookPayload = {
        steam_user: user,
        games: gamesData,
        vlayer_proof: vlayerProof,
        timestamp: new Date().toISOString()
      }

      const webhookResult = await sendWebhook(webhookUrl, webhookPayload)
      webhookStatus = webhookResult.status
      webhookSent = webhookResult.success
      console.log('Webhook sent successfully:', webhookStatus)
    } catch (webhookError) {
      console.error('Webhook failed:', webhookError)
      if (axios.isAxiosError(webhookError)) {
        if (webhookError.response) {
          const status = webhookError.response.status
          const statusText = webhookError.response.statusText
          webhookErrorMessage = `Webhook delivery failed with status ${status} ${statusText}`
        } else if (webhookError.request) {
          webhookErrorMessage = 'Webhook delivery failed: no response from endpoint'
        } else {
          webhookErrorMessage = webhookError.message
        }
      } else if (webhookError instanceof Error) {
        webhookErrorMessage = webhookError.message
      } else {
        webhookErrorMessage = 'Unknown webhook delivery error'
      }
      // Continue with verification even if webhook fails
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
        : 'Verification completed but webhook delivery failed',
      webhook_sent: webhookSent,
      webhook_status: webhookStatus || undefined,
      games_sent: gamesData.game_count,
      vlayer_proof: vlayerProof ? 'Generated successfully' : 'Failed to generate',
      vlayer_proof_data: vlayerProof,
      verification_id: verificationId || undefined,
      vlayer_proof_error: vlayerProofError || undefined,
      webhook_error: webhookErrorMessage || undefined
    }
  } catch (error) {
    console.error('Error during verification:', error)
    
    if (axios.isAxiosError(error) && error.config?.url?.includes('steampowered.com')) {
      throw new Error('Failed to fetch Steam games data')
    }
    
    throw new Error('Verification process failed')
  }
}
