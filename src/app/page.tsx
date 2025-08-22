'use client'

import { useEffect, useState } from 'react'
import { SteamLoginButton } from '@/components/SteamLoginButton'

interface SteamUser {
  id: string
  name: string
  image: string
  profileUrl?: string
}

interface SteamGame {
  appid: number
  name?: string
  playtime_forever: number
  img_icon_url?: string
  img_logo_url?: string
}

interface GamesResponse {
  game_count: number
  games: SteamGame[]
}

export default function Home() {
  const [user, setUser] = useState<SteamUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [games, setGames] = useState<SteamGame[]>([])
  const [gamesLoading, setGamesLoading] = useState(false)
  const [gamesError, setGamesError] = useState<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const userParam = urlParams.get('user')
    
    if (userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam))
        setUser(userData)
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    
    setLoading(false)
  }, [])

  const fetchGames = async () => {
    if (!user) return
    
    setGamesLoading(true)
    setGamesError(null)
    
    try {
      const response = await fetch('/api/steam/games')
      
      if (!response.ok) {
        throw new Error('Failed to fetch games')
      }
      
      const data: GamesResponse = await response.json()
      setGames(data.games)
    } catch (error) {
      setGamesError(error instanceof Error ? error.message : 'Failed to load games')
    } finally {
      setGamesLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchGames()
    }
  }, [user])

  const handleLogout = () => {
    setUser(null)
    setGames([])
    setGamesError(null)
    document.cookie = 'steam_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }

  const formatPlaytime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    return hours > 0 ? `${hours}h` : `${minutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-morphic rounded-2xl p-8">
          <div className="animate-pulse text-violet-200">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl"></div>
      </div>

      <main className="relative z-10 max-w-md w-full">
        <div className="glass-morphic rounded-3xl p-8 text-center">
          {!user && (
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-200 via-purple-200 to-indigo-200 bg-clip-text text-transparent mb-4">
                Verify your Steam
              </h1>
              <p className="text-violet-200/80 text-lg">
                Connect to prove your game activity
              </p>
            </div>
          )}

          {user ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-24 h-24 rounded-full border-4 border-violet-400/30 shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-violet-900/50"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-violet-100 mb-1">
                    Welcome, {user.name}!
                  </h2>
                  <p className="text-violet-200/60 text-sm">
                    Steam ID: {user.id}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-violet-400/20 space-y-4">
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-violet-100 mb-3">Your Steam Games</h3>
                  
                  {gamesLoading && (
                    <div className="text-violet-200/60 text-sm">Loading games...</div>
                  )}
                  
                  {gamesError && (
                    <div className="text-red-400 text-sm mb-2">{gamesError}</div>
                  )}
                  
                  {games.length > 0 && (
                    <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                      {games
                        .filter(game => game.name && game.playtime_forever > 0)
                        .sort((a, b) => b.playtime_forever - a.playtime_forever)
                        .slice(0, 10)
                        .map(game => (
                          <div key={game.appid} className="flex justify-between items-center bg-violet-900/20 rounded-lg p-3">
                            <span className="text-violet-100 text-sm font-medium truncate">
                              {game.name}
                            </span>
                            <span className="text-violet-300 text-sm font-mono ml-2">
                              {formatPlaytime(game.playtime_forever)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                  
                  {games.length === 0 && !gamesLoading && !gamesError && (
                    <div className="text-violet-200/60 text-sm mb-4">No games found</div>
                  )}
                </div>
                
                <button
                  onClick={handleLogout}
                  className="glass-button w-full py-3 px-6 rounded-xl text-violet-100 font-semibold hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <SteamLoginButton />

              <p className="text-violet-200/60 text-sm leading-relaxed">
                We'll redirect you to Steam's secure login page.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-violet-300/60 text-sm">
            <span>Powered by</span>
            <a 
              href="https://vlayer.xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src="/vlayer-logo.svg" 
                alt="vlayer"
                className="h-6 w-auto"
              />
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
