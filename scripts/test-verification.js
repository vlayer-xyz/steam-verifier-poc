#!/usr/bin/env node

/**
 * Test script for Steam verification
 * Usage: node scripts/test-verification.js <steamId>
 * Example: node scripts/test-verification.js 76561198000000000
 */

const axios = require('axios')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

async function fetchSteamUserProfile(steamId) {
  const response = await axios.get(
    'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
    {
      params: {
        key: process.env.STEAM_API_KEY,
        steamids: steamId
      }
    }
  )
  
  const player = response.data.response.players[0]
  if (!player) {
    throw new Error('Steam user not found')
  }
  
  return {
    id: player.steamid,
    name: player.personaname,
    image: player.avatarfull,
    profileUrl: player.profileurl
  }
}

async function fetchSteamGames(steamId) {
  const response = await axios.get(
    'https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/',
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

async function generateVlayerProof(steamId) {
  try {
    const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&format=json`
    
    const response = await axios.post('https://web-prover.vlayer.xyz/api/v0/prove', {
      url: steamApiUrl,
      method: "GET",
      notaryUrl: "https://test-notary.vlayer.xyz/v0.1.0-alpha.11/",
      headers: []
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000
    })
    
    return response.data
  } catch (error) {
    console.error('Error generating vlayer proof:', error.message)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
    return null
  }
}

async function sendWebhook(payload) {
  if (!process.env.WEBHOOK_URL) {
    console.log('⚠️  No webhook URL configured, skipping webhook')
    return null
  }

  try {
    const response = await axios.post(process.env.WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Steam-Games-Verification-Test/1.0'
      },
      timeout: 10000
    })

    return {
      status: response.status,
      success: response.status >= 200 && response.status < 300
    }
  } catch (error) {
    console.error('Webhook error:', error.message)
    return {
      status: error.response?.status || 0,
      success: false
    }
  }
}

async function performVerification(steamId) {
  console.log(`🎮 Starting verification for Steam ID: ${steamId}`)
  console.log('─'.repeat(50))
  
  try {
    // Fetch user profile
    console.log('📋 Fetching Steam user profile...')
    const user = await fetchSteamUserProfile(steamId)
    console.log(`✅ User found: ${user.name}`)
    
    // Fetch games data
    console.log('🎲 Fetching Steam games library...')
    const gamesData = await fetchSteamGames(steamId)
    console.log(`✅ Found ${gamesData.game_count} games`)
    
    // Generate vlayer proof
    console.log('🔐 Generating vlayer proof...')
    const vlayerProof = await generateVlayerProof(steamId)
    if (vlayerProof) {
      console.log('✅ Vlayer proof generated successfully')
    } else {
      console.log('⚠️  Failed to generate vlayer proof')
    }
    
    // Send webhook if configured
    let webhookResult = null
    if (process.env.WEBHOOK_URL) {
      console.log('📡 Sending webhook...')
      const webhookPayload = {
        steam_user: user,
        games: gamesData,
        vlayer_proof: vlayerProof,
        timestamp: new Date().toISOString()
      }
      
      webhookResult = await sendWebhook(webhookPayload)
      if (webhookResult?.success) {
        console.log(`✅ Webhook sent successfully (Status: ${webhookResult.status})`)
      } else {
        console.log(`❌ Webhook failed (Status: ${webhookResult?.status || 'unknown'})`)
      }
    }
    
    console.log('─'.repeat(50))
    console.log('📊 VERIFICATION SUMMARY')
    console.log('─'.repeat(50))
    console.log(`Steam User: ${user.name} (${user.id})`)
    console.log(`Games Found: ${gamesData.game_count}`)
    console.log(`Vlayer Proof: ${vlayerProof ? 'Generated' : 'Failed'}`)
    console.log(`Webhook: ${webhookResult ? (webhookResult.success ? 'Sent' : 'Failed') : 'Not configured'}`)
    
    if (gamesData.games.length > 0) {
      console.log('\n🏆 Top 5 most played games:')
      const topGames = gamesData.games
        .filter(game => game.playtime_forever > 0)
        .sort((a, b) => b.playtime_forever - a.playtime_forever)
        .slice(0, 5)
      
      topGames.forEach((game, index) => {
        const hours = Math.floor(game.playtime_forever / 60)
        console.log(`${index + 1}. ${game.name || 'Unknown Game'} - ${hours}h ${game.playtime_forever % 60}m`)
      })
    }
    
    return {
      success: true,
      user,
      gamesData,
      vlayerProof,
      webhookResult
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    
    if (error.response?.status === 403) {
      console.log('\n💡 Tip: This might be because the Steam profile is private.')
      console.log('   The profile needs to be public to access game data.')
    }
    
    return {
      success: false,
      error: error.message
    }
  }
}

// Main execution
async function main() {
  const steamId = process.argv[2]
  
  if (!steamId) {
    console.error('❌ Error: Steam ID is required')
    console.log('Usage: node scripts/test-verification.js <steamId>')
    console.log('Example: node scripts/test-verification.js 76561198000000000')
    process.exit(1)
  }
  
  if (!process.env.STEAM_API_KEY) {
    console.error('❌ Error: STEAM_API_KEY not found in environment variables')
    console.log('Please add STEAM_API_KEY to your .env.local file')
    process.exit(1)
  }
  
  const result = await performVerification(steamId)
  
  if (result.success) {
    console.log('\n🎉 Verification completed successfully!')
    process.exit(0)
  } else {
    console.log('\n💥 Verification failed!')
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error.message)
    process.exit(1)
  })
}

module.exports = { performVerification, fetchSteamUserProfile, fetchSteamGames }