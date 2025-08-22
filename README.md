# Steam owned games verification POC

A proof-of-concept application that demonstrates Steam authentication and game library integration. Users can authenticate with their Steam account and view their owned games with playtime statistics.

## Features

- Steam OpenID authentication
- Fetch and display user's Steam game library
- Show game titles with playtime hours
- Modern, responsive UI with glassmorphic design
- Secure session management with HTTP-only cookies

## Getting Started

### Prerequisites

1. Steam API Key - Get one from [Steam Web API](https://steamcommunity.com/dev/apikey)
2. Node.js 18+ installed

### Environment Variables

Create a `.env.local` file in the root directory with:

```env
STEAM_API_KEY=your_steam_api_key_here
NEXTAUTH_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## How it Works

1. **Steam Authentication**: Users click "Sign in with Steam" and are redirected to Steam's OpenID authentication
2. **User Data Retrieval**: After successful authentication, the app fetches user profile information from Steam API
3. **Game Library Access**: For authenticated users, the app fetches their complete game library using Steam's `GetOwnedGames` API
4. **Display**: Games are displayed sorted by playtime, showing titles and hours played

## API Endpoints

- `GET /api/auth/steam` - Initiates Steam OpenID authentication
- `GET /api/auth/steam/callback` - Handles Steam authentication callback
- `GET /api/steam/games` - Fetches authenticated user's game library (protected route)

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Steam Web API** - Game data and authentication
- **Axios** - HTTP client for API requests

## Powered by

Built with ❤️ using [vlayer](https://vlayer.xyz) - The verifiable data layer for applications.

## License

This project is for demonstration purposes only.