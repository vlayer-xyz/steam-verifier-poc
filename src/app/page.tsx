'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
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
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const [webhookError, setWebhookError] = useState<string | null>(null)
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null)
  const [callbackError, setCallbackError] = useState<string | null>(null)

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user')
      const data = await response.json()
      if (data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const webhookParam = urlParams.get('webhookUrl')
    const callbackParam = urlParams.get('callbackUrl')

    if (!webhookParam) {
      setWebhookUrl(null)
      setWebhookError('Provide a webhookUrl query parameter before continuing.')
    } else {
      try {
        const parsed = new URL(webhookParam)
        setWebhookUrl(parsed.toString())
        setWebhookError(null)
      } catch (error) {
        console.error('Invalid webhookUrl parameter:', error)
        setWebhookUrl(null)
        setWebhookError('Webhook URL is invalid. Supply a fully qualified webhookUrl query parameter.')
      }
    }

    if (!callbackParam) {
      setCallbackUrl(null)
      setCallbackError('Provide a callbackUrl query parameter so we know where to send you next.')
    } else {
      try {
        const parsedCallback = new URL(callbackParam)
        setCallbackUrl(parsedCallback.toString())
        setCallbackError(null)
      } catch (error) {
        console.error('Invalid callbackUrl parameter:', error)
        setCallbackUrl(null)
        setCallbackError('Callback URL is invalid. Supply a fully qualified callbackUrl query parameter.')
      }
    }

    const userParam = urlParams.get('user')

    if (userParam) {
      try {
        const userData = JSON.parse(userParam)
        setUser(userData)
        const cleanedParams = new URLSearchParams(urlParams)
        cleanedParams.delete('user')
        const query = cleanedParams.toString()
        const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    } else {
      fetchCurrentUser()
    }

    setLoading(false)
  }, [])

  const fetchGames = useCallback(async () => {
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
  }, [user])

  useEffect(() => {
    if (user) {
      fetchGames()
    }
  }, [user, fetchGames])

  const handleLogout = () => {
    setUser(null)
    setGames([])
    setGamesError(null)
    setVerificationResult(null)
    document.cookie = 'steam_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }

  const verifyGamingActivity = async () => {
    if (!user) return
    if (!webhookUrl || webhookError) {
      setVerificationResult(`❌ ${webhookError ?? 'Provide a valid webhookUrl query parameter before verification.'}`)
      return
    }
    if (!callbackUrl || callbackError) {
      setVerificationResult(`❌ ${callbackError ?? 'Provide a valid callbackUrl query parameter before verification.'}`)
      return
    }

    setVerifying(true)
    setVerificationResult(null)

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhookUrl, callbackUrl }),
      })

      const data = await response.json()

          if (response.ok) {
            if (data.success) {
              const params = new URLSearchParams({
                success: 'true',
                message: data.message,
                webhook_status: data.webhook_status?.toString() || '',
                games_sent: data.games_sent?.toString() || '',
                vlayer_proof: data.vlayer_proof || '',
              })
              params.set('callbackUrl', callbackUrl)
              window.location.href = `/verified?${params.toString()}`
            } else {
              setVerificationResult(`ℹ️ ${data.message}`)
            }
      } else {
        setVerificationResult(`❌ Verification failed: ${data.error}`)
      }
    } catch {
      setVerificationResult('❌ Network error during verification')
    } finally {
      setVerifying(false)
    }
  }

  const formatPlaytime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    return hours > 0 ? `${hours}h` : `${minutes}m`
  }

  const curatedGames = useMemo(
    () =>
      games
        .filter((game) => game.name && game.playtime_forever > 0)
        .sort((a, b) => b.playtime_forever - a.playtime_forever)
        .slice(0, 5),
    [games]
  )

  const totalHours = useMemo(
    () => Math.floor(games.reduce((acc, game) => acc + game.playtime_forever, 0) / 60),
    [games]
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="glass-morphic rounded-[28px] px-10 py-8 text-center">
          <div className="animate-pulse text-muted text-base">Loading interface…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <main className="relative z-10 max-w-md w-full space-y-8">
        <div className="glass-morphic rounded-[28px] px-8 py-10 text-center">
          {(webhookError || callbackError) && (
            <div className="mb-6 space-y-3 text-left">
              {webhookError && (
                <div className="flex items-start gap-3 rounded-2xl border border-[rgba(255,107,107,0.25)] bg-[rgba(255,107,107,0.08)] px-4 py-3">
                  <svg
                    className="w-5 h-5 text-[var(--color-warning)] mt-0.5 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14A1 1 0 003 18h14a1 1 0 00.894-1.447l-7-14zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-2a1 1 0 01-2 0V8a1 1 0 012 0v4z" />
                  </svg>
                  <p className="text-secondary text-sm leading-relaxed">
                    {webhookError}
                  </p>
                </div>
              )}
              {callbackError && (
                <div className="flex items-start gap-3 rounded-2xl border border-[rgba(255,107,107,0.25)] bg-[rgba(255,107,107,0.08)] px-4 py-3">
                  <svg
                    className="w-5 h-5 text-[var(--color-warning)] mt-0.5 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14A1 1 0 003 18h14a1 1 0 00.894-1.447l-7-14zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-2a1 1 0 01-2 0V8a1 1 0 012 0v4z" />
                  </svg>
                  <p className="text-secondary text-sm leading-relaxed">
                    {callbackError}
                  </p>
                </div>
              )}
            </div>
          )}
          {!user && (
            <>
              <header className="space-y-3 mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-primary">
                  Verify your Steam
                </h1>
                <p className="text-secondary text-base">
                  Connect your account to earn reputation.
                </p>
              </header>
              <SteamLoginButton
                webhookUrl={webhookUrl ?? undefined}
                callbackUrl={callbackUrl ?? undefined}
                disabled={Boolean(webhookError) || Boolean(callbackError)}
              />
              <p className="text-muted text-sm mt-5">
                We’ll redirect you to Steam’s secure login page.
              </p>
            </>
          )}

          {user && (
            <div className="space-y-8">
              <header className="flex flex-col items-center gap-5 text-primary">
                <div className="relative">
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full border-4 border-[#2f3542] shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
                    priority
                  />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold">Welcome {user.name}!</h2>
                  <p className="text-muted text-sm">Steam ID: {user.id}</p>
                </div>
              </header>

              <section className="space-y-6 text-left">
                <div>
                  <h3 className="text-primary text-sm font-medium uppercase tracking-[0.2em] mb-3">
                    Your Steam Games
                  </h3>

                  {gamesLoading && (
                    <div className="text-muted text-sm">Loading games…</div>
                  )}

                  {gamesError && (
                    <div className="text-[#ff8b8b] text-sm">{gamesError}</div>
                  )}

                  {!gamesLoading && !gamesError && curatedGames.length > 0 && (
                    <div className="space-y-3">
                      {curatedGames.map((game) => (
                        <div
                          key={game.appid}
                          className="surface-elevated rounded-full px-5 py-3 flex items-center justify-between"
                        >
                          <span className="text-primary text-sm font-medium truncate pr-2">
                            {game.name}
                          </span>
                          <span className="text-secondary text-sm font-semibold">
                            {formatPlaytime(game.playtime_forever)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!gamesLoading && !gamesError && curatedGames.length === 0 && (
                    <div className="text-muted text-sm">No games with recorded playtime yet.</div>
                  )}
                </div>

                <div className="surface-elevated rounded-2xl px-4 py-5 flex flex-col gap-1 text-left">
                  <span className="text-muted text-xs uppercase tracking-[0.25em]">
                    All Hours
                  </span>
                  <span className="text-primary text-2xl font-semibold">
                    {totalHours > 0 ? `${totalHours}h` : '—'}
                  </span>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-[rgba(82,208,217,0.35)] bg-[rgba(82,208,217,0.12)] px-4 py-3 text-left">
                  <svg
                    className="w-5 h-5 text-[var(--color-accent-teal)] mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a7 7 0 100 14h6.586l-1.293 1.293a1 1 0 101.414 1.414l3.003-3.003a1 1 0 000-1.414l-3.003-3.003a1 1 0 10-1.414 1.414L15.586 14H9a5 5 0 110-10 1 1 0 100-2z" />
                  </svg>
                  <p className="text-secondary text-sm leading-relaxed">
                    We import the playtime you share publicly—set your Steam stats to public to showcase your full library.
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={verifyGamingActivity}
                    disabled={verifying || Boolean(webhookError) || Boolean(callbackError)}
                    className="button-primary w-full py-4 px-6 rounded-full font-semibold flex items-center justify-center gap-3"
                  >
                    {verifying ? (
                      <>
                        <svg
                          className="w-5 h-5 animate-spin text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            d="M4 12a8 8 0 018-8"
                            strokeWidth="4"
                            strokeLinecap="round"
                          ></path>
                        </svg>
                        <span>Verifying…</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Verify my gaming activity</span>
                      </>
                    )}
                  </button>

                  {verificationResult && (
                    <div className="surface-elevated rounded-2xl px-4 py-3 text-sm text-secondary">
                      {verificationResult}
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-muted hover:text-secondary text-sm font-medium transition-colors"
                  >
                    Back
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>

        <footer className="text-center text-muted text-sm">
          <div className="inline-flex items-center gap-2">
            <span>Powered by</span>
            <a
              href="https://vlayer.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary transition-colors"
            >
              <Image
                src="/vlayer-logo.svg"
                alt="vlayer"
                width={48}
                height={24}
                className="h-6 w-auto"
              />
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
