'use client'

import { useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

function normalizeCallbackUrl(callbackUrl: string | null): string | null {
  if (!callbackUrl) {
    return null
  }

  try {
    return new URL(callbackUrl).toString()
  } catch (error) {
    console.error('Invalid callbackUrl:', error)
    return null
  }
}

export default function FailedPage() {
  const searchParams = useSearchParams()

  const messageParam = searchParams.get('message')
  const callbackParam = searchParams.get('callbackUrl')

  const errorMessage = useMemo(() => {
    if (messageParam && messageParam.trim().length > 0) {
      return messageParam
    }

    return 'We were unable to complete your verification.'
  }, [messageParam])

  const callbackTarget = useMemo(() => normalizeCallbackUrl(callbackParam), [callbackParam])

  useEffect(() => {
    if (!callbackTarget) {
      return
    }

    const redirect = setTimeout(() => {
      window.location.href = callbackTarget
    }, 3000)

    return () => clearTimeout(redirect)
  }, [callbackTarget])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-red-500/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-rose-500/5 blur-3xl"></div>
      </div>

      <main className="relative z-10 max-w-lg w-full">
        <div className="flex justify-center mb-6">
          <Image
            src="/elympics-logo.svg"
            alt="elympics"
            width={188}
            height={30}
            className="h-8 w-auto"
            priority
          />
        </div>
        <div className="glass-morphic rounded-3xl p-8 text-center border border-red-400/30 bg-gradient-to-br from-red-500/20 to-rose-600/20">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center border border-red-400/30 bg-red-500/10">
                <svg className="w-10 h-10 text-red-300" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-9.536a1 1 0 00-1.414-1.414L10 9.172 7.879 7.05a1 1 0 10-1.414 1.415L8.586 10.586 6.465 12.707a1 1 0 101.414 1.414L10 12l2.121 2.121a1 1 0 001.415-1.414L11.414 10.586l2.122-2.122z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-200 via-rose-200 to-pink-200 bg-clip-text text-transparent mb-4">
              Verification Failed
            </h1>
            <p className="text-rose-200/80 text-lg">
              {errorMessage}
            </p>
            <p className="text-rose-200/60 text-sm mt-4">
              {callbackTarget
                ? 'Hang tight. We are sending you back to your dashboard.'
                : 'You can safely close this window and try again later.'}
            </p>
          </div>

          {callbackTarget && (
            <p className="text-xs text-rose-200/40">
              Redirecting to {callbackTarget}
            </p>
          )}
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-rose-300/60 text-sm">
            <span>Powered by</span>
            <a
              href="https://vlayer.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
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
        </div>
      </main>
    </div>
  )
}
