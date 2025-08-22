# Steam owned games verification POC

A proof-of-concept application that demonstrates Steam authentication and game library integration. Users can authenticate with their Steam account and view their owned games with playtime statistics.

## Features

- Steam OpenID authentication
- Fetch and display user's Steam game library
- Show game titles with playtime hours
- Webhook integration for verification events
- Cryptographic proof generation using vlayer
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
APP_URL=http://localhost:3000
WEBHOOK_URL=https://your-webhook-endpoint.com/steam-games
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
5. **Verification**: Users can trigger verification which generates a cryptographic proof and sends data to configured webhook

## API Endpoints

- `GET /api/auth/steam` - Initiates Steam OpenID authentication
- `GET /api/auth/steam/callback` - Handles Steam authentication callback
- `GET /api/steam/games` - Fetches authenticated user's game library (protected route)
- `GET /api/user` - Returns current authenticated user from session
- `POST /api/verify` - Triggers verification process with webhook delivery and vlayer proof generation

## Webhook Integration

When a user successfully completes verification, the application sends a POST request to the configured `WEBHOOK_URL` with the following JSON payload:

```json
{
  "steam_user": {
    "id": "76561198000000000",
    "name": "PlayerUsername",
    "image": "https://avatars.steamstatic.com/abcd1234_full.jpg",
    "profileUrl": "https://steamcommunity.com/profiles/76561198000000000/"
  },
  "games": {
    "game_count": 150,
    "games": [
      {
        "appid": 730,
        "name": "Counter-Strike 2",
        "playtime_forever": 2847,
        "img_icon_url": "0123456789abcdef",
        "img_logo_url": "fedcba9876543210",
        "playtime_windows_forever": 2847,
        "playtime_mac_forever": 0,
        "playtime_linux_forever": 0,
        "rtime_last_played": 1703980800,
        "playtime_disconnected": 0
      }
    ]
  },
  "vlayer_proof": {
    "proof": "0x...",
    "public_inputs": {...},
    "verification_key": "...",
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Webhook Requirements

- **Endpoint**: Must accept POST requests with JSON payload
- **Response**: Should return 2xx status code to indicate success
- **Timeout**: Webhook requests timeout after 10 seconds
- **Retry**: No automatic retries are performed

The webhook URL should be configured in your environment variables. If no webhook URL is provided, verification will still complete but no external notification will be sent.

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Steam Web API** - Game data and authentication
- **Axios** - HTTP client for API requests

## Powered by

Built with ❤️ using [vlayer](https://vlayer.xyz) - The verifiable data layer for applications.

## License

Copyright 2025 vlayer.xyz

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.