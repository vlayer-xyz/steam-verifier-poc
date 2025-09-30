'use client'

import { Suspense, useEffect, useMemo } from 'react'
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

function VerifiedPageContent() {
  const searchParams = useSearchParams()

  const successParam = searchParams.get('success')
  const isSuccess = successParam !== 'false'

  const typeParam = searchParams.get('type')
  const messageParam = searchParams.get('message')
  const callbackParam = searchParams.get('callbackUrl')

  const statusType = useMemo<'success' | 'error' | 'info'>(() => {
    if (isSuccess) {
      return 'success'
    }

    if (typeParam === 'info') {
      return 'info'
    }

    return 'error'
  }, [isSuccess, typeParam])

  const statusMessage = useMemo(() => {
    if (messageParam) {
      return messageParam
    }

    if (statusType === 'success') {
      return 'Your gaming activity has been successfully verified.'
    }

    if (statusType === 'info') {
      return 'Verification completed with additional notes.'
    }

    return 'We were unable to verify your gaming activity.'
  }, [messageParam, statusType])

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

  const heading = useMemo(() => {
    if (statusType === 'success') {
      return 'Success'
    }

    if (statusType === 'info') {
      return 'Verification Pending'
    }

    return 'Verification Failed'
  }, [statusType])

  const supportingText = useMemo(() => {
    if (callbackTarget) {
      return 'Sit tight! We’ll send you back to your dashboard in a couple of seconds.'
    }

    if (statusType === 'success') {
      return 'You can now close this window.'
    }

    return 'You can safely close this window and try again later.'
  }, [callbackTarget, statusType])

  const statusStyles = useMemo(() => {
    switch (statusType) {
      case 'success':
        return {
          wrapper: 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-400/30',
          iconColor: 'text-green-300',
          iconPath: (
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          ),
        }
      case 'info':
        return {
          wrapper: 'bg-gradient-to-br from-blue-500/20 to-sky-600/20 border-blue-400/30',
          iconColor: 'text-blue-300',
          iconPath: (
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 11-2 0 1 1 0 012 0zm-1 2a1 1 0 00-.993.883L9 10v4a1 1 0 001.993.117L11 14v-4a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          ),
        }
      default:
        return {
          wrapper: 'bg-gradient-to-br from-red-500/20 to-rose-600/20 border-red-400/30',
          iconColor: 'text-red-300',
          iconPath: (
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-9.536a1 1 0 00-1.414-1.414L10 9.172 7.879 7.05a1 1 0 10-1.414 1.415L8.586 10.586 6.465 12.707a1 1 0 101.414 1.414L10 12l2.121 2.121a1 1 0 001.415-1.414L11.414 10.586l2.122-2.122z"
              clipRule="evenodd"
            />
          ),
        }
    }
  }, [statusType])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl"></div>
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
        <div className="glass-morphic rounded-3xl p-8 text-center">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border ${statusStyles.wrapper}`}>
                <svg className={`w-10 h-10 ${statusStyles.iconColor}`} fill="currentColor" viewBox="0 0 24 24">
                  {statusStyles.iconPath}
                </svg>
              </div>
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-200 via-emerald-200 to-teal-200 bg-clip-text text-transparent mb-4">
              {heading}
            </h1>
            <p className="text-violet-200/80 text-lg">
              {statusMessage}
            </p>
            <p className="text-violet-200/60 text-sm mt-4">
              {supportingText}
            </p>
          </div>

          {callbackTarget && (
            <p className="text-xs text-violet-200/40">
              Redirecting to {callbackTarget}
            </p>
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

export default function VerifiedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifiedPageContent />
    </Suspense>
  )
}
