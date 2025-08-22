'use client'

export function SteamLoginButton() {
  const handleSteamLogin = () => {
    window.location.href = '/api/auth/steam'
  }

  return (
    <button
      onClick={handleSteamLogin}
      className="glass-button w-full py-4 px-6 rounded-xl font-semibold text-violet-100 hover:text-white transition-all duration-300 flex items-center justify-center space-x-3 group"
    >
      <div className="relative">
        <svg 
          className="w-6 h-6 text-violet-300 group-hover:text-white transition-colors" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.030 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.62 20.51 6.363 24 11.979 24c6.624 0 11.979-5.357 11.979-11.979C23.958 5.357 18.603.001 11.979.001zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.218-1.319-.115-1.913-.333-.593-.87-1.011-1.511-1.178-.65-.17-1.28-.049-1.872.302l1.525.63c.956.396 1.407 1.5 1.009 2.456-.397.957-1.497 1.41-2.454 1.016l.245-.578z"/>
        </svg>
      </div>
      <span className="text-lg font-bold">Sign in with Steam</span>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}