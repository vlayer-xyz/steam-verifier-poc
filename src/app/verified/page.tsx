'use client'

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl"></div>
      </div>

      <main className="relative z-10 max-w-lg w-full">
        <div className="glass-morphic rounded-3xl p-8 text-center">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center border border-green-400/30">
                <svg className="w-10 h-10 text-green-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-200 via-emerald-200 to-teal-200 bg-clip-text text-transparent mb-4">
              Sucess
            </h1>
            <p className="text-violet-200/80 text-lg">
              Your gaming activity has been successfully verified
            </p>
          </div>
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