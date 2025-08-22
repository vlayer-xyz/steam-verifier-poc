import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "steam",
      name: "Steam",
      type: "credentials",
      credentials: {},
      async authorize(credentials, req) {
        const steamOpenId = req.query?.["openid.identity"]
        const steamId = steamOpenId?.toString().match(/(\d+)$/)?.[1]
        
        if (!steamId) return null
        
        try {
          const response = await fetch(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
          )
          const data = await response.json()
          const player = data.response.players[0]
          
          if (player) {
            return {
              id: player.steamid,
              name: player.personaname,
              image: player.avatarfull,
              email: null,
            }
          }
        } catch (error) {
          console.error("Steam API error:", error)
        }
        
        return null
      },
    },
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.steamId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token.steamId) {
        session.user.id = token.steamId as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }