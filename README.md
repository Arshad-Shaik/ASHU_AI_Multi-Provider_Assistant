

<div align="center">

# ASHU_AI_Assistant

# AdvancedSystemHolographicUnified_Artificial_Intelligence_Assistant

### The Ultimate AI Terminal Experience - Zero Rate Limits. PhD-Level Intelligence. Futuristic Interface.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.22-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.14-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Docker](https://img.shields.io/badge/Docker-29.5.3-2496ED?style=for-the-badge&logo=docker)](https://docker.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Live Demo](https://your-vercel-url.vercel.app) | [Backend API](https://your-hf-space.hf.space) | [API Docs](https://your-hf-space.hf.space/docs) | [Architecture](ARCHITECTURE.md)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Solution Architecture](#solution-architecture)
4. [Tech Stack](#tech-stack)
5. [AI Providers - 13 Provider Fallback Chain](#ai-providers)
6. [Command System](#command-system)
7. [Memory ID System](#memory-id-system)
8. [Authentication Architecture](#authentication-architecture)
9. [Database Schema](#database-schema)
10. [Project Structure](#project-structure)
11. [Quick Start - Local Development](#quick-start)
12. [Environment Variables](#environment-variables)
13. [Backend API Reference](#backend-api-reference)
14. [Python Dependencies with Versions](#python-dependencies)
15. [UI Animation System](#ui-animation-system)
16. [Voice Synthesis Agent](#voice-synthesis-agent)
17. [Security Architecture](#security-architecture)
18. [Errors Encountered and Fixed](#errors-encountered-and-fixed)
19. [Deployment Guide](#deployment-guide)
20. [Performance Targets](#performance-targets)
21. [Developer](#developer)
22. [License](#license)

---

## Overview

**ASHU AI Assistant** (AdvancedSystemHolographicUnified Artificial Intelligence Assistant) is a production-grade AI terminal assistant built with Next.js 15, FastAPI Python 3.14, and Supabase. It features a 13-provider intelligent LLM fallback router, persistent memory with unique IDs, Web Speech Synthesis voice agent, and a 2050 futuristic Iron Man Jarvis cinematic holographic terminal interface optimized for Mobile, Tablet, Desktop, Laptop, and Android TV.

---

## Problem Statement

Developers using AI assistants face three persistent engineering problems:

| Problem | Impact |
|---|---|
| API rate limits hit without warning | Workflow interrupted, productivity lost |
| AI responses lack engineering depth | Surface-level answers for complex technical problems |
| No structured way to revisit AI interactions | Valuable responses lost in chat scroll |

---

## Solution Architecture

ASHU AI Assistant solves all three problems through purpose-built systems:

```
[Browser Client - Next.js 15]
        |
        | HTTPS + JWT Bearer Token
        |
[FastAPI Backend - Python 3.14]
        |
        +-- JWT Verification (Supabase)
        +-- Rate Limiter (slowapi)
        +-- Request Sanitizer
        |
[LLM Router - Circuit Breaker Pattern]
        |
        +-- Provider 1:  Google Gemini
        +-- Provider 2:  Groq
        +-- Provider 3:  Mistral AI
        +-- Provider 4:  OpenAI
        +-- Provider 5:  Grok xAI
        +-- Provider 6:  Anthropic Claude
        +-- Provider 7:  Cerebras
        +-- Provider 8:  OpenRouter
        +-- Provider 9:  Cohere
        +-- Provider 10: HuggingFace
        +-- Provider 11: Cloudflare Workers AI
        +-- Provider 12: Together AI
        +-- Provider 13: DeepSeek
        |
[Supabase PostgreSQL]
        |
        +-- conversations table
        +-- messages table
        +-- memory_entries table
        +-- provider_logs table
        +-- user_analytics table
        +-- user_command_stats table
        +-- user_profiles table
```

When a provider returns HTTP 429 rate limit or connection timeout, the circuit breaker marks it as backed off and the router automatically selects the next available provider. The user never sees a failure - only which provider responded, shown in the provider status bar.

---


## ASHU AI Logo Modulator

ASHU AI Assistant features a unique **Holographic Logo Modulator** button ? a cinematic
Jarvis-style interactive element that gives users access to the official ASHU AI Assistant
Logo Modulator hosted on Google AI Studio.

### Logo Button Placement

| State | Position | Device |
|---|---|---|
| Before Login | Left side of navbar next to title | Desktop / Tablet |
| Before Login | Right side of navbar before LOGIN button | Mobile |
| After Login | Inside user profile dropdown menu | All devices |

### Logo Button Animation Sequence

When clicked the button plays a full cinematic holographic animation sequence:

1. Button implodes inward with cyan shockwave ring
2. Hexagonal Jarvis frame spins 360 degrees
3. Particle burst explodes outward from center
4. Screen edge holographic blue sweep pulse
5. Button settles back with glow
6. Logo Modulator opens in new tab

### Animation Budget Per Device

| Device | Particles | Ring | Sweep | FPS |
|---|---|---|---|---|
| Mobile low-end | 0 | CSS only | disabled | 30 |
| Mobile high-end | 10 | animated | subtle | 60 |
| Tablet | 20 | full | enabled | 60 |
| Desktop | 30 | cinematic | full sweep | 60 |
| Android TV | 30 | cinematic | full sweep | 60 |

### Voice Integration

The Logo Modulator button speaks dynamically via Web Speech Synthesis API on every click.
All speech is generated from runtime values ? zero hardcoded strings.

### Logo Modulator URL

[ASHU AI Logo Modulator](https://ashu-ai-assistant-logo.ai.studio/)

---
## Tech Stack

| Layer | Technology | Exact Version |
|---|---|---|
| Frontend Framework | Next.js | 15.5.22 |
| Frontend Language | TypeScript | 7.0.2 |
| CSS Framework | Tailwind CSS | 3.x |
| Animation Library | Framer Motion | 11.18.2 |
| State Management | Zustand | 5.0.5 |
| Markdown Rendering | react-markdown | 10.1.0 |
| HTTP Streaming | @microsoft/fetch-event-source | 2.0.1 |
| Backend Framework | FastAPI | 0.115.x |
| Backend Language | Python | 3.14.0 |
| ASGI Server | Uvicorn | 0.32.x |
| Data Validation | Pydantic | 2.x |
| Settings Management | pydantic-settings | 2.x |
| Database | Supabase PostgreSQL | latest |
| Authentication | Supabase Auth | latest |
| JWT Verification | python-jose | 3.3.0 |
| Rate Limiting | slowapi | 0.1.9 |
| Async HTTP Client | httpx | 0.27.x |
| Containerization | Docker | 29.5.3 |
| Voice | Web Speech Synthesis API | Native Browser |
| Node Runtime | Node.js | 22.20.0 |
| Package Manager | npm | 11.12.0 |
| Frontend Deployment | Vercel | latest |
| Backend Deployment | HuggingFace Spaces | Docker SDK |
| OS during development | Windows 11 | 10.0.26200 |
| Go toolchain present | Go | 1.26.4 |

---

## AI Providers

### 13 Provider Fallback Chain

| Priority | Provider | Model Used | Free Tier Available |
|---|---|---|---|
| 1 | Google Gemini | gemini-1.5-flash | Yes |
| 2 | Groq | qwen/qwen3.8-27b | Yes |
| 3 | Mistral AI | mistral-small-latest | Yes |
| 4 | OpenAI | gpt-4o-mini | Paid |
| 5 | Grok xAI | grok-beta | Limited free |
| 6 | Anthropic Claude | claude-3-haiku-20240307 | Paid |
| 7 | Cerebras | llama3.1-8b | Yes |
| 8 | OpenRouter | auto routing | Yes |
| 9 | Cohere | command-r | Yes |
| 10 | HuggingFace Inference | zephyr-7b-beta | Yes |
| 11 | Cloudflare Workers AI | llama-3-8b-instruct | Yes |
| 12 | Together AI | llama-3-8b-chat | Yes |
| 13 | DeepSeek | deepseek-chat | Yes |

### How the Fallback System Works

Each provider runs through a circuit breaker. When a provider fails:

1. Circuit breaker records the failure
2. After threshold failures (default 5) the circuit opens
3. Router skips that provider and selects next in priority order
4. Request retried on new provider transparently
5. Response returned with fallback indicator in terminal UI
6. Circuit breaker resets after recovery timeout (default 30 seconds)
7. Provider re-enters rotation in half-open state with limited calls

No request is ever lost. Every failure is logged to provider_logs table.

---

## Command System

| Command | Syntax | What It Does |
|---|---|---|
| Expert Mode | @ quantum computing | Generates PhD-level explanation from first principles to advanced theory |
| Code Analysis | $ print hello | Line-by-line code breakdown with version detection and deprecation warnings |
| Memory Save | # explain recursion | Saves AI response with unique memory ID to Supabase |
| Regenerate | * MEM-XXXXX | Regenerates or extends a saved memory entry |
| Help | /help | Shows all commands as clickable buttons that auto-submit |
| Clear | /clear | Clears terminal output |
| Status | /status | Shows all 13 provider availability |
| Providers | /providers | Lists all providers with model names and status |
| History | /history | Shows conversation history |
| Export | /export | Exports full chat as structured PDF |
| Theme | /theme | Cycles holographic themes Matrix, Cyberpunk, etc |
| Version | /version | Shows application version information |
| Login | /login | Opens authentication modal |
| Logout | /logout | Signs out current user |

---

## Memory ID System

Every hash command interaction generates unique IDs:

```
User Prompt ID:  USR-A3F2C891-[timestamp]
AI Response ID:  ASH-B7E1F234-[timestamp]
Memory Entry ID: MEM-[combined-hash]
```

IDs are stored in Supabase memory_entries table linked to the authenticated user via foreign key to auth.users.

How to use memory IDs:

1. Type # explain recursion - AI responds and memory ID is shown
2. Open MEM panel - all saved IDs listed chronologically
3. Hover over any ID - full prompt and AI response preview appears as tooltip
4. Click any ID - auto-pastes into terminal input
5. Press Enter - backend resolves ID and returns original content
6. Type * MEM-abc123 - regenerates or extends that specific memory entry

---

## Authentication Architecture

ASHU AI Assistant enforces authentication at two independent layers:

### Layer 1 - Frontend Gate

- Zero AI responses before authentication
- Terminal input disabled until Supabase session verified
- Auth modal opens automatically for unauthenticated users
- Side panels CMD, MEM, LOG, STATS only visible after login
- /login command opens auth modal programmatically

### Layer 2 - Backend JWT Verification

- Every request to /api/v1/chat, /api/v1/commands, /api/v1/memory requires valid Supabase JWT
- FastAPI middleware extracts Bearer token from Authorization header
- Token verified against Supabase JWT secret using python-jose
- Direct API calls without valid JWT return HTTP 401
- Session tokens refresh automatically via Supabase client

### Supported Authentication Methods

- Email and password signup and signin
- Google OAuth
- GitHub OAuth

### Auth Flow

```
User visits app
    |
    | Supabase session check
    |
    +-- No session found
    |       |
    |       | Show AuthModal
    |       |
    |       | User signs in via Email, Google, or GitHub
    |       |
    |       | Supabase returns JWT + user object
    |       |
    |       | /auth/callback route processes OAuth redirect
    |       |
    |       | Terminal enabled
    |
    +-- Session found
            |
            | Terminal enabled immediately
            |
            | JWT attached to every API request
            |
            | Backend verifies JWT on every protected endpoint
```

---

## Database Schema

All tables created via SQL migrations in database/migrations/. All tables enforce Row Level Security. Every table links to auth.users via user_id foreign key with CASCADE delete.

| Table | Primary Key | Purpose |
|---|---|---|
| conversations | id text | Conversation sessions with metadata, title, command type, provider used |
| messages | id text | Individual messages linked to conversations with token counts and latency |
| memory_entries | id uuid | Saved memory with unique memory_id, user prompt, AI response, tags |
| provider_logs | id text | Every LLM provider request logged with success, error, latency, tokens |
| user_analytics | id uuid | Per-user event tracking with command type, provider, response time |
| user_command_stats | user_id uuid | Aggregated command usage counts per user updated on each interaction |
| user_profiles | id uuid | User display name and avatar URL synced from auth provider |

SQL migrations run in this exact order:

```
001_conversations.sql
002_messages.sql
003_provider_logs.sql
004_user_analytics.sql
005_user_command_stats.sql
```

---

## Project Structure

```
ASHU_AI_Assistant/
|
+-- backend/
|   +-- app/
|   |   +-- core/
|   |   |   +-- config.py              Settings with pydantic-settings, all env vars
|   |   |   +-- identity.py            ASHU AI identity context builder
|   |   |   +-- limiter.py             slowapi rate limiter setup
|   |   |   +-- middleware.py          Request logging and security headers
|   |   |   +-- security.py            JWT verification with python-jose
|   |   |   +-- supabase.py            Supabase client initialization
|   |   |
|   |   +-- models/
|   |   |   +-- database.py            Database model definitions
|   |   |   +-- request.py             Pydantic request models
|   |   |   +-- response.py            Pydantic response models
|   |   |
|   |   +-- routers/
|   |   |   +-- analytics.py           GET /api/v1/analytics/dashboard
|   |   |   +-- auth.py                POST /api/v1/auth/verify
|   |   |   +-- chat.py                POST /api/v1/chat
|   |   |   +-- commands.py            POST /api/v1/commands
|   |   |   +-- health.py              GET /api/v1/health and /health/providers
|   |   |   +-- memory.py              GET POST DELETE /api/v1/memory
|   |   |
|   |   +-- services/
|   |   |   +-- llm/
|   |   |   |   +-- providers/
|   |   |   |   |   +-- cerebras_provider.py
|   |   |   |   |   +-- claude_provider.py
|   |   |   |   |   +-- cloudflare_provider.py
|   |   |   |   |   +-- cohere_provider.py
|   |   |   |   |   +-- deepseek_provider.py
|   |   |   |   |   +-- gemini.py
|   |   |   |   |   +-- grok_provider.py
|   |   |   |   |   +-- groq_provider.py
|   |   |   |   |   +-- huggingface_provider.py
|   |   |   |   |   +-- mistral_provider.py
|   |   |   |   |   +-- openai_provider.py
|   |   |   |   |   +-- openrouter_provider.py
|   |   |   |   |   +-- together_provider.py
|   |   |   |   +-- base.py            Abstract LLM provider base class
|   |   |   |   +-- router.py          Multi-provider router with circuit breaker
|   |   |   |
|   |   |   +-- commands/
|   |   |   |   +-- at_command.py      @ expert explanation handler
|   |   |   |   +-- dollar_command.py  $ code analysis handler
|   |   |   |   +-- hash_command.py    # memory save handler
|   |   |   |   +-- star_command.py    * regenerate handler
|   |   |   |
|   |   |   +-- memory/
|   |   |   |   +-- conversation.py        Conversation manager
|   |   |   |   +-- conversation_logger.py Logger
|   |   |   |   +-- id_generator.py        Unique ID generation
|   |   |   |   +-- manager.py             Memory CRUD operations
|   |   |   |
|   |   |   +-- auth/
|   |   |   |   +-- supabase_auth.py    Auth service
|   |   |   |
|   |   |   +-- analytics/
|   |   |   |   +-- tracker.py          Usage event tracker
|   |   |   |
|   |   |   +-- ai_router.py            Top-level AI routing service
|   |   |
|   |   +-- utils/
|   |   |   +-- circuit_breaker.py      Circuit breaker implementation
|   |   |   +-- command_types.py        Command type enums
|   |   |   +-- retry.py                Retry logic with backoff
|   |   |   +-- sanitizer.py            Input sanitization
|   |   |
|   |   +-- main.py                     FastAPI application factory
|   |
|   +-- Dockerfile                      HuggingFace Spaces deployment
|   +-- requirements.txt                All Python dependencies with versions
|
+-- frontend/
|   +-- app/
|   |   +-- auth/callback/page.tsx      OAuth callback handler
|   |   +-- globals.css                 Global styles and keyframe animations
|   |   +-- icon.tsx                    Dynamic favicon
|   |   +-- layout.tsx                  Root layout with metadata
|   |   +-- page.tsx                    Main application page
|   |
|   +-- components/
|   |   +-- animations/
|   |   |   +-- AnimationsWrapper.tsx   Device-tier animation coordinator
|   |   |   +-- GlitchText.tsx          Glitch text effect
|   |   |   +-- HolographicGrid.tsx     Grid background animation
|   |   |   +-- MatrixRain.tsx          Matrix rain canvas animation
|   |   |   +-- ParticleField.tsx       Particle system with device budget
|   |   |   +-- ScanlineEffect.tsx      CRT scanline overlay
|   |   |
|   |   +-- auth/
|   |   |   +-- AuthModal.tsx           Login modal with device-tier layout
|   |   |   +-- AuthTransitionOverlay.tsx  Auth state transition animation
|   |   |
|   |   +-- panels/
|   |   |   +-- AnalyticsDashboard.tsx  STATS panel with provider metrics
|   |   |   +-- ConversationPanel.tsx   CMD panel with conversation history
|   |   |   +-- MemoryPanel.tsx         MEM panel with ID hover preview
|   |   |
|   |   +-- terminal/
|   |   |   +-- HolographicTerminal.tsx Main terminal orchestrator 990 lines
|   |   |   +-- ProviderStatusBar.tsx   13-provider status with active glow
|   |   |   +-- TerminalInput.tsx       Input with voice agent and suggestions
|   |   |   +-- TerminalOutput.tsx      Markdown rendering with glowing buttons
|   |   |
|   |   +-- ui/
|   |   |   +-- CommandPalette.tsx      Slash command palette
|   |   |   +-- CookieBanner.tsx        GDPR cookie notice
|   |   |   +-- DynamicFavicon.tsx      Animated favicon
|   |   |   +-- HolographicFooter.tsx   Footer with privacy policy and dev links
|   |   |   +-- LoadingBeam.tsx         Loading animation beam
|   |   |   +-- ProviderBadge.tsx       Provider name badge component
|   |   |
|   |   +-- voice/
|   |       +-- VoiceController.tsx     Web Speech Synthesis robot agent
|   |
|   +-- hooks/
|   |   +-- useAnalytics.ts             Analytics event hook
|   |   +-- useAuth.ts                  Supabase auth state hook
|   |   +-- useConversation.ts          Conversation management hook
|   |   +-- useIsomorphicLayoutEffect.ts  SSR-safe layout effect
|   |   +-- useProviderStatus.ts        Provider polling hook
|   |   +-- useTerminal.ts              Main terminal state and command routing
|   |   +-- useTheme.ts                 Theme and color scheme management
|   |   +-- useVoice.ts                 Voice recognition hook
|   |   +-- useVoiceAgent.ts            Web Speech Synthesis agent hook
|   |
|   +-- lib/
|   |   +-- api/client.ts               API client with dynamic URL resolution
|   |   +-- supabase/client.ts          Supabase browser client
|   |   +-- supabase/queries.ts         Database query functions
|   |   +-- utils/
|   |       +-- commandParser.ts        Command type detection and parsing
|   |       +-- idGenerator.ts          Frontend ID generation utilities
|   |       +-- sanitizer.ts            XSS and injection sanitization
|   |
|   +-- store/terminalStore.ts          Zustand global terminal state
|   +-- types/index.ts                  All TypeScript type definitions
|
+-- database/
|   +-- migrations/                     SQL files run in Supabase SQL editor
|
+-- README.md
+-- ARCHITECTURE.md
```

---

## Quick Start

### Prerequisites

| Tool | Required Version |
|---|---|
| Python | 3.14.0 |
| Node.js | 22.20.0 |
| npm | 11.12.0 |
| Git | 2.52.0 |
| Docker | 29.5.3 optional for local |

### Step 1 - Clone Repository

```bash
git clone https://github.com/Arshad-Shaik/ASHU_AI_Assistant.git
cd ASHU_AI_Assistant
```

### Step 2 - Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create backend/.env with all API keys. See Environment Variables section.

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend starts at http://localhost:8000
API documentation at http://localhost:8000/docs

### Step 3 - Frontend Setup

```bash
cd frontend
npm install
```

Create frontend/.env.local:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

```bash
npm run dev
```

Frontend starts at http://localhost:3000
Mobile access at http://[your-lan-ip]:3000

### Step 4 - Database Migrations

Run SQL files in Supabase SQL editor in this exact order:

```
database/migrations/001_conversations.sql
database/migrations/002_messages.sql
database/migrations/003_provider_logs.sql
database/migrations/004_user_analytics.sql
database/migrations/005_user_command_stats.sql
```

### Step 5 - Verify Backend Health

```bash
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/health/providers
```

Expected health response:

```json
{"status": "healthy", "version": "2.0.0", "active_providers": ["groq", "gemini"]}
```

---

## Environment Variables

### frontend/.env.local

| Variable | Description | Required |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| NEXT_PUBLIC_BACKEND_URL | FastAPI backend URL | Yes |

### backend/.env

| Variable | Description | Required |
|---|---|---|
| SUPABASE_URL | Supabase project URL | Yes |
| SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| SUPABASE_SERVICE_KEY | Supabase service role key | Yes |
| SUPABASE_JWT_SECRET | Supabase JWT secret from project settings | Yes |
| GEMINI_API_KEY | Google AI Studio | Recommended |
| GROQ_API_KEY | Groq Console | Recommended |
| MISTRAL_API_KEY | Mistral AI Console | Optional |
| OPENAI_API_KEY | OpenAI Platform | Optional |
| GROK_API_KEY | xAI Console | Optional |
| CLAUDE_API_KEY | Anthropic Console | Optional |
| CEREBRAS_API_KEY | Cerebras Cloud | Optional |
| OPENROUTER_API_KEY | OpenRouter | Optional |
| COHERE_API_KEY | Cohere Dashboard | Optional |
| HUGGINGFACE_API_KEY | HuggingFace Settings | Optional |
| CLOUDFLARE_API_KEY | Cloudflare Dashboard | Optional |
| CLOUDFLARE_ACCOUNT_ID | Cloudflare Account ID | Optional |
| TOGETHER_API_KEY | Together AI | Optional |
| DEEPSEEK_API_KEY | DeepSeek Platform | Optional |
| ENVIRONMENT | development or production | Yes |
| FRONTEND_URL | Frontend URL for CORS | Yes |

---

## Backend API Reference

Base URL local: http://localhost:8000/api/v1
Base URL production: https://your-hf-space.hf.space/api/v1

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /health | No | System health with uptime and active providers |
| GET | /health/providers | No | All 13 provider availability and circuit state |
| POST | /chat | Yes | Main chat - routes through LLM provider chain |
| POST | /commands | Yes | Slash command handler |
| GET | /memory | Yes | List user memory entries |
| POST | /memory | Yes | Save new memory entry with unique ID |
| DELETE | /memory/{id} | Yes | Delete specific memory entry |
| GET | /analytics/dashboard | Yes | User usage analytics and stats |
| POST | /auth/verify | No | Verify Supabase JWT token |

Full interactive documentation available at /docs via Swagger UI.

---

## Python Dependencies

Exact versions from requirements.txt:

| Package | Version | Purpose |
|---|---|---|
| fastapi | 0.115.x | Web framework |
| uvicorn | 0.32.x | ASGI server |
| pydantic | 2.x | Data validation |
| pydantic-settings | 2.x | Environment variable management |
| supabase | 2.x | Supabase Python client |
| httpx | 0.27.x | Async HTTP client for provider calls |
| python-jose | 3.3.0 | JWT verification |
| cryptography | latest | Required by python-jose |
| google-generativeai | 0.8.x | Gemini provider |
| groq | 0.11.x | Groq provider |
| mistralai | 1.x | Mistral provider |
| openai | 1.x | OpenAI and Grok provider |
| anthropic | 0.34.x | Claude provider |
| cohere | 5.x | Cohere provider |
| slowapi | 0.1.9 | Rate limiting middleware |
| python-multipart | 0.0.x | Form data parsing |
| watchfiles | latest | Hot reload for development |

Install all dependencies: pip install -r requirements.txt

---

## UI Animation System

### Device Tier Detection

| Device | Detection Method | Animation Budget |
|---|---|---|
| Mobile low-end | max-width 768px and hardwareConcurrency 4 or less | CSS only, zero particles, 30fps |
| Mobile high-end | max-width 768px and hardwareConcurrency above 4 | Max 20 particles, 60fps |
| Tablet | 768px to 1024px | Max 50 particles, moderate scanline, 60fps |
| Desktop and Laptop | Above 1024px and high core count | Full 100 particles, holographic grid, glitch layers, 60fps |
| Android TV | hover none media query and min-width 1280px | Full effects, larger font scale, 10-foot viewing UI |

### Animation Rules

- All animations use only transform and opacity CSS properties - GPU composited
- Zero box-shadow animations - CPU painted and expensive
- Filter animations only on hover - not continuous
- requestAnimationFrame for particle systems - not setInterval
- IntersectionObserver pauses animations outside viewport
- React.memo and useMemo on all animation components
- Single shared animation loop across all particle systems

### Available Holographic Themes

- Matrix - green on black with digital rain
- Cyberpunk - yellow on dark with neon accents
- Ocean - cyan on deep blue
- Sunset - orange and red gradients
- Plasma - purple and magenta

Each theme has separate dark and light color scheme variants.

---

## Voice Synthesis Agent

ASHU AI Assistant uses the Web Speech Synthesis API:

- Voice: Female voice only - selected dynamically from available system voices
- Trigger: Every UI interaction - button clicks, theme changes, auth events, command execution
- Dynamic speech: Zero hardcoded strings - all spoken text generated from actual runtime data
- Robot agent icon: Displays in terminal input area and shows last spoken text
- Theme changes: Speaks newly applied theme name after applying it
- Auth events: Speaks user first name on login, logout, and account interactions
- Name extraction: Intelligently extracts first meaningful name - not surname prefix
- Device support: Chrome, Edge, Safari, Android Chrome, Android TV browser

---

## Security Architecture

| Layer | Technology | Detail |
|---|---|---|
| Authentication tokens | Supabase JWT RS256 | Signed tokens verified server-side |
| API authorization | FastAPI middleware | Bearer token on every protected endpoint |
| Input sanitization frontend | sanitizer.ts | XSS, script injection, iframe injection blocked |
| Input sanitization backend | sanitizer.py | Same patterns applied at API layer |
| CORS | FastAPI CORSMiddleware | Dynamic LAN IP detection in dev, strict allowlist in production |
| Security headers | SecurityHeadersMiddleware | X-Content-Type-Options, X-Frame-Options, Referrer-Policy |
| Rate limiting | slowapi | 60 requests per minute, 500 per hour per client IP |
| Circuit breaker | circuit_breaker.py | Per-provider failure threshold 5, recovery timeout 30 seconds |
| Data privacy | memory ID system | Prompts stored with IDs - never exposed as raw text in URLs |
| Row Level Security | Supabase PostgreSQL | Every table - users access only their own rows |
| Non-root container | Dockerfile | Runs as ashuai user UID 1001 - not root |

---

## Errors Encountered and Fixed

Every error encountered during development with root cause analysis and exact fix applied:

| Error | File | Root Cause | Fix Applied |
|---|---|---|---|
| React is not defined | HolographicTerminal.tsx | React.useRef used without React namespace import | Replaced with named useRef from react imports |
| Hydration mismatch on send button | TerminalInput.tsx | disabled prop differed between SSR and client hydration | Added mounted useState with useEffect guard |
| ts.primary does not exist on ThemeStyle | TerminalOutput.tsx | Property primary not in ThemeStyle interface | Replaced with ts.text which exists in interface |
| circuit_state.toUpperCase crash | AnalyticsDashboard.tsx | circuit_state undefined for some providers | Added nullish coalescing unknown fallback |
| Theme voice speaks wrong theme | HolographicTerminal.tsx | Voice called before React state update committed | Moved to useRef pattern with 150ms setTimeout |
| speakThemeChange used before declaration | HolographicTerminal.tsx | Hook destructure order issue | Converted to useRef pattern |
| Mobile backend connection refused | config.py and main.py | Backend bound to 127.0.0.1 only | Start with host 0.0.0.0, dynamic LAN IP CORS |
| CORS blocked on LAN mobile devices | config.py | Single hardcoded LAN IP in CORS | Dynamic socket.getaddrinfo LAN IP detection |
| Build error prefer-const in queries.ts | queries.ts | let totalRequests never reassigned | Changed to const |
| Build error prefer-const in sanitizer.ts | sanitizer.ts | let cleaned never reassigned | Changed to const |
| Build error no-img-element | HolographicTerminal.tsx | Native img tag used for avatar | Replaced with NextImage from next/image |
| Build error aria-expanded on textbox | TerminalInput.tsx | ARIA role mismatch on input element | Removed aria-expanded attribute |
| TypeScript strict array index undefined | sanitizer.ts | Array indexing returns string or undefined | Added nullish coalescing on all array accesses |
| Lockfile warning in Next.js dev | next.config.ts | Multiple package-lock.json files | Added turbopack.root dirname |
| next.config.ts throws on missing env | next.config.ts | getBackendUrl threw if env not set | Made it return localhost:8000 fallback |
| Cross-origin LAN warning | next.config.ts | allowedDevOrigins not configured | Added allowedDevOrigins with LAN IPs |

---

## Deployment Guide

### Frontend - Vercel (No Dockerfile needed)

Vercel handles Next.js deployment natively. No Dockerfile required for frontend.

Steps:
1. Push repository to GitHub
2. Go to vercel.com and import the repository
3. Set root directory to frontend
4. Add environment variables in Vercel Project Settings
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_BACKEND_URL set to your HuggingFace Space HTTPS URL
5. Deploy - Vercel auto-detects Next.js 15 and builds automatically

### Backend - HuggingFace Spaces (Dockerfile provided)

The backend Dockerfile is at backend/Dockerfile. HuggingFace builds it automatically.

Dockerfile details:
- Base image: python:3.14-slim
- Port: 7860 (HuggingFace standard port)
- Host: 0.0.0.0
- Non-root user: ashuai UID 1001
- Health check: curl localhost:7860/health every 30 seconds
- Workers: 1 for CPU Basic free tier

Steps:
1. Create HuggingFace Space - SDK Docker, Hardware CPU Basic free
2. Push backend directory contents to Space git repository
3. Add all API keys as Repository Secrets in Space Settings
4. HuggingFace auto-builds and deploys via Dockerfile
5. Space HTTPS URL becomes your NEXT_PUBLIC_BACKEND_URL

### Supabase OAuth Configuration

After Vercel deployment, add to Supabase Dashboard - Authentication - URL Configuration:

Site URL: https://your-vercel-app.vercel.app

Redirect URLs:

```
https://your-vercel-app.vercel.app/auth/callback
https://your-vercel-app.vercel.app/**
```

Enable in Supabase Auth providers:
- Email provider enabled
- Google OAuth enabled with client ID and secret from Google Cloud Console
- GitHub OAuth enabled with client ID and secret from GitHub Developer Settings

---

## Performance Targets

| Metric | Target | Method |
|---|---|---|
| First Contentful Paint | Under 1.5 seconds | Static generation, optimized bundle |
| Time to Interactive | Under 2.5 seconds | Code splitting, lazy loading |
| AI Response primary provider | Under 3 seconds | Fast providers first in chain |
| Fallback provider switch | Under 100ms | Circuit breaker in-memory state |
| Animation frame rate Desktop | 60fps | GPU composited transforms only |
| Animation frame rate Mobile | 30fps adaptive | Device tier detection with budget |
| Production build size main | 418 kB | Optimized with Next.js Turbopack |
| Shared chunks | 103 kB | Tree shaking and code splitting |

---

## Developer

**AWS - Arshad Wasib Shaik**

| Platform | URL |
|---|---|
| LinkedIn | https://www.linkedin.com/in/arshadwasibshaik |
| GitHub | https://github.com/Arshad-Shaik |

---

## License

MIT License

Copyright 2026 ASHU AI Assistant - AWS Arshad Wasib Shaik

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

---

<div align="center">

Built with precision by AWS - Arshad Wasib Shaik

*A working product you can click, type, and break.*

</div>
