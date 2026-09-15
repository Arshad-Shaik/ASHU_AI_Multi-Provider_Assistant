# ASHU AI Assistant - Frontend

## AdvancedSystemHolographicUnified Artificial Intelligence Assistant

Next.js 15 frontend with Iron Man Jarvis cinematic holographic UI, multi-provider AI terminal, Web Speech Synthesis voice agent, and device-adaptive animations across Mobile, Tablet, Desktop, Laptop, and Android TV.

---

## Project Structure

    frontend/
    +-- app/
    |   +-- auth/
    |   |   +-- callback/
    |   |       +-- page.tsx                    OAuth redirect handler
    |   +-- globals.css                         Global CSS and GPU-composited keyframes
    |   +-- icon.tsx                            Dynamic animated favicon
    |   +-- layout.tsx                          Root layout with metadata and fonts
    |   +-- page.tsx                            Root page mounting HolographicTerminal
    +-- components/
    |   +-- animations/
    |   |   +-- AnimationsWrapper.tsx           Device-tier animation orchestrator
    |   |   +-- GlitchText.tsx                  Glitch text animation layer
    |   |   +-- HolographicGrid.tsx             CSS holographic grid background
    |   |   +-- MatrixRain.tsx                  Canvas-based matrix rain effect
    |   |   +-- ParticleField.tsx               RAF particle system
    |   |   +-- ScanlineEffect.tsx              CRT scanline overlay
    |   +-- auth/
    |   |   +-- AuthModal.tsx                   Email Google GitHub login modal
    |   |   +-- AuthTransitionOverlay.tsx       Auth state transition animation
    |   +-- panels/
    |   |   +-- AnalyticsDashboard.tsx          Provider metrics and stats panel
    |   |   +-- ConversationPanel.tsx           Conversation history panel
    |   |   +-- MemoryPanel.tsx                 Memory ID hover preview panel
    |   +-- terminal/
    |   |   +-- HolographicTerminal.tsx         Root terminal orchestrator
    |   |   +-- ProviderStatusBar.tsx           13 provider status with active glow
    |   |   +-- TerminalInput.tsx               Input with voice agent robot icon
    |   |   +-- TerminalOutput.tsx              Markdown output with command buttons
    |   +-- ui/
    |   |   +-- CommandPalette.tsx              Slash command suggestions palette
    |   |   +-- CookieBanner.tsx                GDPR cookie notice
    |   |   +-- DynamicFavicon.tsx              Theme-reactive animated favicon
    |   |   +-- HolographicFooter.tsx           Privacy policy and developer links
    |   |   +-- HolographicLogoButton.tsx       Jarvis hexagonal logo modulator button
    |   |   +-- LoadingBeam.tsx                 Loading animation beam
    |   |   +-- ProviderBadge.tsx               Provider name badge component
    |   +-- voice/
    |       +-- VoiceController.tsx             Web Speech Synthesis robot agent icon
    +-- hooks/
    |   +-- useAnalytics.ts                     Event tracking hook
    |   +-- useAuth.ts                          Supabase session management
    |   +-- useConversation.ts                  Conversation CRUD hook
    |   +-- useIsomorphicLayoutEffect.ts        SSR-safe layout effect
    |   +-- useProviderStatus.ts               Provider health polling hook
    |   +-- useTerminal.ts                      Main terminal state machine
    |   +-- useTheme.ts                         Theme and color scheme state
    |   +-- useVoice.ts                         Voice recognition input hook
    |   +-- useVoiceAgent.ts                    Web Speech Synthesis API agent
    +-- lib/
    |   +-- api/
    |   |   +-- client.ts                       HTTP client for backend API calls
    |   +-- supabase/
    |   |   +-- client.ts                       Supabase browser client singleton
    |   |   +-- queries.ts                      Supabase database query functions
    |   +-- utils/
    |       +-- commandParser.ts                Command type detection and parsing
    |       +-- idGenerator.ts                  USR ASH MEM ID generation
    |       +-- sanitizer.ts                    XSS and injection input cleaning
    +-- public/
    |   +-- apple-touch-icon.png                iOS home screen icon
    |   +-- icon-192.png                        PWA icon 192px
    |   +-- icon-512.png                        PWA icon 512px
    |   +-- manifest.json                       PWA manifest
    +-- store/
    |   +-- terminalStore.ts                    Zustand global state store
    +-- types/
    |   +-- index.ts                            Shared TypeScript type definitions
    |   +-- speech.d.ts                         Web Speech API type declarations
    +-- next.config.ts                          Next.js configuration
    +-- tailwind.config.ts                      Tailwind CSS configuration
    +-- tsconfig.json                           TypeScript strict mode configuration
    +-- package.json                            Dependencies and scripts

---

## Tech Stack

    Technology       Version    Purpose
    +--------------+-----------+-------------------------------+
    | Next.js      | 15        | App Router SSG and SSR        |
    | TypeScript   | 7.0.2     | Strict type safety            |
    | Tailwind CSS | 4         | Utility-first styling         |
    | Framer Motion| Latest    | Cinematic animations          |
    | Zustand      | Latest    | Global state management       |
    | Supabase JS  | Latest    | Auth and database client      |
    +--------------+-----------+-------------------------------+

---

## Command System

    Command        Prefix   Description
    +-------------+--------+-------------------------------------------+
    | Expert Mode  | @      | PhD-level explanation from basics to advanced |
    | Code Analysis| $      | Line-by-line code breakdown with version context |
    | Memory Save  | #      | Save response with unique MEM ID         |
    | Regenerate   | *      | Regenerate or extend a saved memory entry |
    | Slash Cmds   | /      | Terminal utility commands                 |
    +-------------+--------+-------------------------------------------+

---

## Slash Commands

    Command      Action
    +------------+--------------------------------------------+
    | /help      | Show all commands as clickable buttons     |
    | /clear     | Clear terminal output                      |
    | /status    | Show provider status                       |
    | /providers | List all 13 AI providers                   |
    | /history   | Show conversation history                  |
    | /export    | Export chat as PDF                         |
    | /theme     | Cycle terminal theme                       |
    | /version   | Show version info                          |
    | /login     | Sign in or create account                  |
    | /logout    | Sign out                                   |
    +------------+--------------------------------------------+

---

## Terminal Themes

    Theme        Primary Color   Style
    +-------------+--------------+-------------------------+
    | matrix      | #00ff88      | Classic green matrix    |
    | cyberpunk   | #ff0088      | Hot pink cyberpunk      |
    | holographic | #00ffff      | Cyan holographic        |
    | neon        | #b400ff      | Purple neon             |
    | cyber       | #0088ff      | Electric blue           |
    | plasma      | #ff4400      | Plasma orange           |
    | aurora      | #00ffcc      | Aurora teal             |
    | inferno     | #ff8800      | Inferno amber           |
    | ghost       | #aaaaff      | Ghost lavender          |
    | crimson     | #ff2244      | Crimson red             |
    +-------------+--------------+-------------------------+

Each theme supports dark, light, and system color schemes.

---

## Device Animation Tiers

    Tier    Screen           Particles   Matrix   Grid   Scanline   FPS
    +--------+-----------------+-----------+--------+------+-----------+-----+
    | low    | Mobile low-end  | 0         | off    | off  | off       | 30  |
    | mid    | Mobile high-end | 25        | off    | on   | on        | 60  |
    | high   | Desktop and TV  | 60        | on     | on   | on        | 60  |
    +--------+-----------------+-----------+--------+------+-----------+-----+

Animation rules:
Only transform and opacity used in all animation loops.
No box-shadow animation. No filter animation in loops.
requestAnimationFrame only ? never setInterval.
IntersectionObserver pauses animations outside viewport.

---

## Authentication

Two-layer security model:

Layer 1 - Frontend gate blocks terminal until authenticated.
AuthModal shown on every unauthenticated action.
Terminal input disabled. Side panels hidden.

Layer 2 - Backend JWT verification on every protected API call.
python-jose decodes Supabase JWT.
HTTP 401 returned for any invalid or expired token.

Supported providers: Email and Password, Google OAuth, GitHub OAuth.

---

## Holographic Logo Button

Unique cinematic Jarvis-style button for ASHU AI Logo Modulator.

Before login: visible in navbar next to title on desktop and tablet.
Before login: visible right side before LOGIN button on mobile.
After login: inside user profile dropdown menu on all devices.

Animation sequence on click:
  1. Button implodes inward with cyan shockwave ring
  2. Hexagonal Jarvis frame spins 360 degrees
  3. Particle burst explodes outward from center
  4. Screen edge holographic blue sweep pulse
  5. Button settles back with glow
  6. Logo Modulator opens in new tab

URL: https://ashu-ai-assistant-logo.ai.studio/

---

## Voice Agent

Web Speech Synthesis API integration with female voice only.

Speaks dynamically on every user interaction:
Theme changes, login, logout, command submission, panel open, provider change.
Zero hardcoded speech strings ? all text generated from runtime values.

Robot agent icon in terminal input shows last spoken text as subtitle.
Animated glow when actively speaking.
Click to toggle voice agent on or off.

---

## Environment Variables

Create frontend/.env.local with these values:

    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

---

## Local Development

Step 1 - Install dependencies:
    npm install

Step 2 - Create environment file:
    Copy the environment variables above into frontend/.env.local

Step 3 - Start development server:
    npm run dev

Step 4 - Open browser:
    http://localhost:3000

---

## Production Build

    npm run build
    npm run start

---

## TypeScript Check

    npx tsc --noEmit

Zero errors expected on clean codebase.

---

## Developer

AWS - Arshad Wasib Shaik
LinkedIn: https://www.linkedin.com/in/arshadwasibshaik
GitHub: https://github.com/Arshad-Shaik

---

## License

MIT License - 2026 ASHU AI Assistant