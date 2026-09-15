# ARCHITECTURE.md

# ASHU AI Assistant - Complete System Architecture

**AdvancedSystemHolographicUnified Artificial Intelligence Assistant**

This document describes the complete end-to-end architecture of ASHU AI Assistant.
Every system, subsystem, data flow, security layer, and deployment configuration
is documented with ASCII diagrams and blueprint-level explanations.

---

## Table of Contents

1. [System Overview Diagram](#1-system-overview-diagram)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [AI Provider Router Architecture](#4-ai-provider-router-architecture)
5. [Circuit Breaker Architecture](#5-circuit-breaker-architecture)
6. [Command System Architecture](#6-command-system-architecture)
7. [Memory ID System Architecture](#7-memory-id-system-architecture)
8. [Authentication Architecture](#8-authentication-architecture)
9. [Security Architecture](#9-security-architecture)
10. [Database Architecture - Supabase PostgreSQL](#10-database-architecture)
11. [Row Level Security Architecture](#11-row-level-security-architecture)
12. [Voice Synthesis Architecture](#12-voice-synthesis-architecture)
13. [Animation System Architecture](#13-animation-system-architecture)
14. [API Request Lifecycle](#14-api-request-lifecycle)
15. [Deployment Architecture](#15-deployment-architecture)
16. [Project Structure Architecture](#16-project-structure-architecture)
17. [Data Flow Diagrams](#17-data-flow-diagrams)
18. [Error Handling Architecture](#18-error-handling-architecture)

---

## 1. System Overview Diagram

```
+===========================================================================+
|                        ASHU AI ASSISTANT                                 |
|              AdvancedSystemHolographicUnified AI Assistant                |
+===========================================================================+

  [USER DEVICE]
       |
       | HTTPS Request + Supabase JWT Bearer Token
       |
       v
  +--------------------+
  | VERCEL CDN         |    Next.js 15 Static + SSR
  | Frontend           |    TypeScript 7.0.2
  | http://app.vercel  |    Tailwind CSS + Framer Motion
  +--------------------+
       |
       | API calls to backend with JWT
       |
       v
  +--------------------+
  | HUGGINGFACE SPACES |    FastAPI Python 3.14
  | Backend API        |    Uvicorn ASGI Server
  | Port 7860          |    Docker Container
  +--------------------+
       |
       +-- JWT Verified
       +-- Rate Limited
       +-- Sanitized
       |
       v
  +--------------------+
  | LLM ROUTER         |    13 Provider Fallback Chain
  | Circuit Breaker    |    Auto-switching on rate limits
  +--------------------+
       |
       +-- Gemini / Groq / Mistral / OpenAI
       +-- Grok / Claude / Cerebras / OpenRouter
       +-- Cohere / HuggingFace / Cloudflare
       +-- Together / DeepSeek
       |
       v
  +--------------------+
  | SUPABASE           |    PostgreSQL Database
  | Auth + DB          |    Row Level Security
  | JWT Authority      |    7 Tables
  +--------------------+
```

**Blueprint:** The user accesses the frontend deployed on Vercel over HTTPS. The frontend
authenticates via Supabase Auth (Email, Google OAuth, GitHub OAuth) and receives a JWT.
Every API call to the FastAPI backend on HuggingFace Spaces includes this JWT in the
Authorization header. The backend verifies the JWT, applies rate limiting, sanitizes
input, then routes through the 13-provider LLM chain. Results are persisted in Supabase
PostgreSQL with Row Level Security enforcing per-user data isolation.

---

## 2. Frontend Architecture

```
+===========================================================================+
|                     FRONTEND ARCHITECTURE                                 |
|                    Next.js 15 + TypeScript 7                              |
+===========================================================================+

  app/
  +-- page.tsx                    Root page - mounts HolographicTerminal
  +-- layout.tsx                  Root layout - metadata, fonts, providers
  +-- globals.css                 Global CSS + GPU-composited keyframes
  +-- icon.tsx                    Dynamic animated favicon
  +-- auth/callback/page.tsx      OAuth redirect handler

  COMPONENT TREE
  ==============

  Page (app/page.tsx)
    |
    +-- HolographicTerminal (orchestrator - 990 lines)
         |
         +-- AnimationsWrapper
         |     +-- MatrixRain          Canvas-based matrix rain
         |     +-- ParticleField       RAF particle system
         |     +-- HolographicGrid     CSS grid animation
         |     +-- ScanlineEffect      CRT scanline overlay
         |     +-- GlitchText          Glitch animation layer
         |
         +-- AuthModal                 Email / Google / GitHub login
         +-- AuthTransitionOverlay     Auth state animation
         |
         +-- Navbar (inline)
         |     +-- Mac dots with labels
         |     +-- ASHU AI v2.0 title
         |     +-- Theme switcher
         |     +-- Color scheme switcher
         |     +-- User profile square avatar
         |     +-- Panel buttons (CMD MEM LOG STATS)
         |
         +-- ProviderStatusBar         13 providers with active glow
         |
         +-- TerminalOutput            Markdown + glowing dev link buttons
         |
         +-- TerminalInput             Input + voice agent robot icon
         |     +-- VoiceController     Web Speech Synthesis agent
         |
         +-- ConversationPanel (CMD)   Conversation history
         +-- MemoryPanel (MEM)         Memory IDs with hover preview
         +-- AnalyticsDashboard (STATS) Provider metrics + charts
         +-- HolographicFooter         Privacy policy + dev credit links
         +-- CommandPalette            Slash command suggestions
         +-- CookieBanner              GDPR notice

  HOOKS LAYER
  ===========

  useTerminal        Main state machine - routes commands to backend
  useAuth            Supabase session management
  useTheme           Theme + color scheme state
  useVoiceAgent      Web Speech Synthesis API integration
  useVoice           Voice recognition input
  useProviderStatus  Polls backend /health/providers every 30s
  useConversation    Conversation CRUD via Supabase
  useAnalytics       Event tracking
  useIsomorphicLayoutEffect  SSR-safe layout effect

  STATE MANAGEMENT
  ================

  Zustand terminalStore
    +-- messages[]           All terminal messages
    +-- isLoading            Request in flight
    +-- isStreaming          Stream active
    +-- currentProvider      Active LLM provider name
    +-- sessionId            Current session UUID
    +-- theme                Matrix / Cyberpunk / Ocean / Sunset / Plasma
    +-- colorScheme          dark / light / system

  ROUTING
  =======

  Next.js App Router
    /                     Main terminal application
    /auth/callback        OAuth redirect processing

  RENDERING STRATEGY
  ==================

  All pages: Static Generation (SSG)
  Dynamic content: Client-side after hydration
  SSR guard: mounted useState prevents hydration mismatch
```

**Blueprint:** The frontend is a single-page application built on Next.js 15 App Router.
HolographicTerminal is the root orchestrator component managing all state, panels, and
animations. Zustand provides global state without prop drilling. Every dynamic value
(theme colors, auth state, provider status) is computed client-side after mount to
prevent SSR hydration mismatches. All API calls go through lib/api/client.ts which
resolves the backend URL dynamically from environment variables or window.location.hostname.

---

## 3. Backend Architecture

```
+===========================================================================+
|                     BACKEND ARCHITECTURE                                  |
|                    FastAPI + Python 3.14 + Uvicorn                        |
+===========================================================================+

  main.py  (Application Factory)
    |
    +-- create_app()
    |     +-- FastAPI instance
    |     +-- CORSMiddleware        Dynamic LAN + production origins
    |     +-- RequestLoggingMiddleware
    |     +-- SecurityHeadersMiddleware
    |     +-- Router registration
    |
    +-- lifespan()
          +-- LLM router init
          +-- Provider availability check
          +-- Startup log

  ROUTER LAYER  (app/routers/)
  ============================

  health.py      GET /api/v1/health
                 GET /api/v1/health/providers
                 No auth required
                 Returns: status, version, uptime, active providers

  chat.py        POST /api/v1/chat
                 Auth required - JWT verified
                 Routes to LLM router
                 Logs to provider_logs
                 Updates user_analytics

  commands.py    POST /api/v1/commands
                 Auth required
                 Routes: @ $ # * /slash commands

  memory.py      GET  /api/v1/memory
                 POST /api/v1/memory
                 DELETE /api/v1/memory/{id}
                 Auth required - user-scoped

  analytics.py   GET /api/v1/analytics/dashboard
                 Auth required - user-scoped

  auth.py        POST /api/v1/auth/verify
                 No auth required
                 Verifies Supabase JWT

  SERVICE LAYER  (app/services/)
  ==============================

  llm/router.py          Multi-provider LLM router
  llm/base.py            Abstract provider base class
  llm/providers/         13 provider implementations

  commands/at_command.py      @ PhD-level explanation
  commands/dollar_command.py  $ code analysis
  commands/hash_command.py    # memory save
  commands/star_command.py    * regenerate

  memory/manager.py           Memory CRUD
  memory/id_generator.py      USR / ASH / MEM ID generation
  memory/conversation.py      Conversation management

  auth/supabase_auth.py       JWT decode and user extraction
  analytics/tracker.py        Event logging

  CORE LAYER  (app/core/)
  =======================

  config.py      pydantic-settings - all env vars with validation
  security.py    python-jose JWT verification
  middleware.py  Request logging + security headers injection
  limiter.py     slowapi rate limiter - 60/min 500/hour
  supabase.py    Supabase client singleton
  identity.py    ASHU AI identity context for system prompts

  UTILS LAYER  (app/utils/)
  =========================

  circuit_breaker.py     Per-provider failure tracking
  retry.py               Exponential backoff retry logic
  sanitizer.py           Input XSS and injection cleaning
  command_types.py       Command type enum definitions
```

**Blueprint:** The backend follows a strict layered architecture. Routers handle HTTP
concerns only. Services contain all business logic. Core handles cross-cutting concerns
like config, security, and middleware. Utils provide stateless helper functions. Every
layer is independently testable. The FastAPI application is created via factory pattern
in create_app() which allows clean lifespan management for provider initialization.

---

## 4. AI Provider Router Architecture

```
+===========================================================================+
|                   AI PROVIDER ROUTER ARCHITECTURE                         |
|                  13-Provider Intelligent Fallback Chain                   |
+===========================================================================+

  Incoming Request
       |
       v
  +------------------+
  | LLM Router       |
  | router.py        |
  +------------------+
       |
       | 1. Get ordered provider list from config
       | 2. Filter: available=True AND backed_off=False
       | 3. Select first eligible provider
       |
       v
  +------------------+
  | Provider Call    |
  +------------------+
       |
       +-- SUCCESS
       |     |
       |     | Return response
       |     | Log to provider_logs (success=True)
       |     | Update circuit breaker (reset failure count)
       |
       +-- FAILURE (429 / timeout / connection error)
             |
             | Log to provider_logs (success=False)
             | Increment circuit breaker failure count
             | If failures >= threshold: open circuit
             |
             | Select NEXT eligible provider
             | Retry request
             |
             | If ALL providers exhausted:
             | Return error: All providers currently unavailable

  PROVIDER PRIORITY ORDER
  =======================

   1. Google Gemini       gemini-1.5-flash         Free tier
   2. Groq                qwen/qwen3.8-27b          Free tier
   3. Mistral AI          mistral-small-latest      Free tier
   4. OpenAI              gpt-4o-mini               Paid
   5. Grok xAI            grok-beta                 Limited free
   6. Anthropic Claude    claude-3-haiku-20240307   Paid
   7. Cerebras            llama3.1-8b               Free tier
   8. OpenRouter          auto routing              Free tier
   9. Cohere              command-r                 Free tier
  10. HuggingFace         zephyr-7b-beta            Free tier
  11. Cloudflare          llama-3-8b-instruct       Free tier
  12. Together AI         llama-3-8b-chat           Free tier
  13. DeepSeek            deepseek-chat             Free tier

  PROVIDER BASE CLASS  (llm/base.py)
  ===================================

  AbstractLLMProvider
    +-- name: str
    +-- model: str
    +-- is_configured() -> bool
    +-- generate(prompt, system, history) -> str  [abstract]
    +-- health_check() -> bool

  Each provider implements generate() with:
    - API key validation
    - Request construction
    - Response parsing
    - Error classification (rate limit vs other)
```

**Blueprint:** The LLM router maintains an ordered list of 13 providers. On each request
it iterates the list skipping providers whose circuit is open. The first available provider
receives the request. If it fails with a rate limit or timeout, the router marks it and
immediately tries the next. This continues until a provider succeeds or all are exhausted.
No request is ever dropped silently. The frontend receives a response with a
fallback_triggered flag and the name of the provider that ultimately responded.

---

## 5. Circuit Breaker Architecture

```
+===========================================================================+
|                   CIRCUIT BREAKER ARCHITECTURE                            |
|                  Per-Provider Failure Isolation                           |
+===========================================================================+

  CIRCUIT STATES
  ==============

  CLOSED (normal)
    |
    | Requests pass through
    | Failures counted
    |
    | failure_count >= threshold (default 5)
    |
    v
  OPEN (backed off)
    |
    | All requests rejected immediately
    | No API calls made to this provider
    |
    | recovery_timeout elapsed (default 30s)
    |
    v
  HALF-OPEN (testing)
    |
    | Limited requests allowed (default max 2)
    |
    +-- SUCCESS: Reset to CLOSED
    +-- FAILURE: Return to OPEN

  CIRCUIT BREAKER STATE PER PROVIDER
  ====================================

  CircuitBreaker
    +-- failure_count: int          Current consecutive failures
    +-- last_failure_time: float    Timestamp of last failure
    +-- state: str                  closed / open / half_open
    +-- failure_threshold: int      Default 5
    +-- recovery_timeout: int       Default 30 seconds
    +-- half_open_max_calls: int    Default 2
    +-- half_open_calls: int        Current half-open call count

  CONFIGURATION  (config.py)
  ==========================

  CIRCUIT_BREAKER_FAILURE_THRESHOLD   = 5
  CIRCUIT_BREAKER_RECOVERY_TIMEOUT    = 30
  CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS = 2
  MAX_RETRIES                         = 1
  PROVIDER_TIMEOUT_SECONDS            = 25
```

**Blueprint:** Each of the 13 providers has its own independent circuit breaker instance.
A circuit opening on Gemini does not affect Groq. The router checks each circuit state
in O(1) time before attempting any API call. This means zero latency overhead for
skipping backed-off providers. Circuit state is held in-memory per process - it resets
when the backend restarts, which is acceptable behavior for development and low-traffic
production usage.

---

## 6. Command System Architecture

```
+===========================================================================+
|                   COMMAND SYSTEM ARCHITECTURE                             |
|                  @ $ # * and Slash Command Routing                        |
+===========================================================================+

  User Input
    |
    v
  commandParser.ts (frontend)
    |
    +-- Detects command prefix
    +-- Returns CommandType enum
    +-- Extracts payload
    |
    v
  useTerminal.ts
    |
    +-- AT command (@)
    |     POST /api/v1/commands  {type: "at", payload: topic}
    |     Backend: at_command.py
    |     Prompt: PhD-level system prompt + user topic
    |     Response: Expert explanation from basics to advanced
    |
    +-- DOLLAR command ($)
    |     POST /api/v1/commands  {type: "dollar", payload: code}
    |     Backend: dollar_command.py
    |     Prompt: Line-by-line analysis system prompt
    |     Response: Code breakdown with version and deprecation notes
    |
    +-- HASH command (#)
    |     POST /api/v1/commands  {type: "hash", payload: prompt}
    |     Backend: hash_command.py
    |     Generates: USR-[hash] + ASH-[hash] + MEM-[hash]
    |     Saves: memory_entries table in Supabase
    |     Response: AI answer + memory ID shown to user
    |
    +-- STAR command (* or X)
    |     POST /api/v1/commands  {type: "star", payload: memory_id}
    |     Backend: star_command.py
    |     Fetches: Original memory entry by ID
    |     Regenerates: New AI response for same prompt
    |     Updates: memory_entries with new response
    |
    +-- SLASH commands (/help /clear /status etc)
          Handled entirely client-side in useTerminal.ts
          No backend call for most slash commands
          /status and /providers: GET /api/v1/health/providers
          /export: Generates PDF via iframe print
          /history: Reads from Zustand store

  COMMAND TYPE DETECTION
  ======================

  Input starts with @     -> AT command
  Input starts with $     -> DOLLAR command
  Input starts with #     -> HASH command
  Input starts with *     -> STAR command
  Input starts with X     -> STAR command (alternate)
  Input starts with /     -> SLASH command
  Anything else           -> Plain chat -> POST /api/v1/chat
```

**Blueprint:** Command detection happens entirely on the frontend in commandParser.ts
before any network request is made. This gives instant visual feedback - the terminal
input shows a colored hint label (AT / CODE / MEM / REGEN / CHAT) based on the detected
command type. The parsed command and payload are then sent to the appropriate backend
endpoint. Slash commands are handled client-side for zero-latency execution.

---

## 7. Memory ID System Architecture

```
+===========================================================================+
|                   MEMORY ID SYSTEM ARCHITECTURE                           |
|                  Unique ID Generation and Retrieval                       |
+===========================================================================+

  USER types: # explain recursion
       |
       v
  hash_command.py
       |
       +-- id_generator.py generates:
       |     USR-[8-char-hash]    User prompt identifier
       |     ASH-[8-char-hash]    AI response identifier
       |     MEM-[combined-hash]  Master memory entry ID
       |
       +-- Sends prompt to LLM Router
       +-- Gets AI response
       |
       +-- Saves to Supabase memory_entries:
             memory_id     = MEM-[hash]
             user_prompt   = original user input
             ai_response   = full AI response text
             command_type  = hash
             provider_used = name of responding provider
             user_id       = authenticated user UUID
             created_at    = timestamp
       |
       v
  Response to frontend:
    AI answer + MEM-[hash] displayed in terminal

  MEMORY RETRIEVAL FLOW
  =====================

  User opens MEM panel
       |
       | GET /api/v1/memory?user_id=[uuid]
       |
       v
  List of memory entries shown
  Each entry shows: MEM-[hash] + truncated prompt + timestamp
       |
       | User hovers over ID
       |
       v
  Tooltip shows full user_prompt + ai_response preview
       |
       | User clicks ID
       |
       v
  ID auto-pasted into terminal input
       |
       | User presses Enter
       |
       v
  System detects MEM- prefix -> routes to star_command.py
  Fetches original entry + regenerates or returns content

  ID FORMAT SPECIFICATION
  =======================

  USR-[A-F0-9]{8}    User prompt ID
  ASH-[A-F0-9]{8}    AI response ID
  MEM-[A-F0-9]{16}   Master memory entry ID

  Generation method: hash of (user_id + prompt + timestamp)
  Collision probability: negligible at user scale
  Storage: Supabase memory_entries with UNIQUE constraint on memory_id
```

**Blueprint:** The memory ID system solves the problem of losing valuable AI interactions
in chat scroll. Every # command creates a permanent, retrievable snapshot of the prompt
and response pair. IDs are short enough to be typed manually but unique enough to avoid
collisions. The hover preview in the MEM panel lets users find the right entry without
clicking through each one. The click-to-paste flow reduces friction to near zero.

---

## 8. Authentication Architecture

```
+===========================================================================+
|                   AUTHENTICATION ARCHITECTURE                             |
|                  Two-Layer Security with Supabase JWT                    |
+===========================================================================+

  LAYER 1 - FRONTEND GATE
  =======================

  App loads
       |
       v
  useAuth hook checks Supabase session
       |
       +-- No session
       |     +-- AuthModal shown (blocks terminal)
       |     +-- Terminal input disabled
       |     +-- Side panels hidden
       |     +-- Only /help and /version work
       |
       +-- Session exists
             +-- Terminal enabled
             +-- Side panels visible
             +-- User profile shown (square avatar)

  AUTH MODAL FLOWS
  ================

  Email/Password
    +-- signup: supabase.auth.signUp()
    +-- signin: supabase.auth.signInWithPassword()

  Google OAuth
    +-- supabase.auth.signInWithOAuth({provider: google})
    +-- Redirect to Google consent
    +-- Return to /auth/callback
    +-- page.tsx exchanges code for session
    +-- Redirect to /

  GitHub OAuth
    +-- supabase.auth.signInWithOAuth({provider: github})
    +-- Same callback flow as Google

  LAYER 2 - BACKEND JWT VERIFICATION
  ====================================

  Every protected request:
       |
       | Authorization: Bearer [supabase_jwt]
       |
       v
  security.py
       |
       +-- Extract Bearer token from header
       +-- python-jose: jwt.decode(token, SUPABASE_JWT_SECRET)
       +-- Validate: exp, iss, sub claims
       +-- Extract user UUID from sub claim
       |
       +-- VALID: Continue to route handler with user context
       +-- INVALID: HTTP 401 Unauthorized

  AUTH DEVICE ADAPTATIONS
  =======================

  Mobile below 768px
    AuthModal = full-width bottom sheet
    translateY slide-up animation (GPU transform only)
    48px minimum tap targets
    OAuth buttons stacked vertically

  Tablet 768px to 1024px
    AuthModal = centered card 70vw width
    Moderate blur backdrop

  Desktop above 1024px
    AuthModal = centered glass card
    Scale-in animation with border glow sweep

  Android TV hover none + min 1280px
    AuthModal = large fonts
    Thick animated focus ring
    D-pad navigable via arrow keys
```

**Blueprint:** Authentication is enforced at two completely independent layers.
The frontend layer provides instant UX feedback - the terminal is simply non-functional
without a session. The backend layer provides real security - even if a user bypasses
the frontend (e.g. direct curl), every protected endpoint verifies the JWT independently.
Supabase handles token refresh automatically. The JWT secret is never exposed to the frontend.

---

## 9. Security Architecture

```
+===========================================================================+
|                     SECURITY ARCHITECTURE                                 |
|                  Defense in Depth - Multiple Layers                       |
+===========================================================================+

  REQUEST SECURITY LAYERS
  =======================

  User Request
       |
       v
  [1] HTTPS Transport
       Vercel + HuggingFace enforce TLS
       No plain HTTP in production
       |
       v
  [2] CORS Check
       CORSMiddleware in main.py
       Development: allow * (all origins)
       Production: strict allowlist from FRONTEND_URL env var
       Dynamic LAN IP detection via socket.getaddrinfo
       |
       v
  [3] Rate Limiting
       slowapi: 60 requests per minute per IP
       slowapi: 500 requests per hour per IP
       Returns HTTP 429 on exceeded
       |
       v
  [4] JWT Verification
       python-jose decodes Supabase JWT
       RS256 algorithm verification
       Token expiry checked
       Returns HTTP 401 if invalid
       |
       v
  [5] Input Sanitization
       sanitizer.py strips:
         <script> tags and content
         javascript: protocol
         inline event handlers (onclick=)
         <iframe> injections
       Max input length enforced
       |
       v
  [6] Business Logic + Response
       |
       v
  [7] Security Headers (all responses)
       X-Content-Type-Options: nosniff
       X-Frame-Options: DENY
       X-XSS-Protection: 1; mode=block
       Referrer-Policy: strict-origin-when-cross-origin
       x-request-id: unique per request
       x-response-time: latency in ms

  CONTAINER SECURITY
  ==================

  Dockerfile runs as non-root user: ashuai (UID 1001)
  Read-only file permissions on /app directory
  No secrets baked into image - all from HuggingFace Secrets
  python:3.14-slim base - minimal attack surface

  FRONTEND SECURITY
  =================

  sanitizer.ts mirrors backend sanitization
  No API keys in frontend code or env vars
  Only NEXT_PUBLIC_ prefixed vars exposed to browser
  Content Security Policy via Next.js headers config
```

**Blueprint:** Security is implemented as defense in depth - 7 independent layers that
each independently protect against different attack vectors. An attacker who bypasses
CORS still hits rate limiting. An attacker who bypasses rate limiting still needs a
valid JWT. An attacker with a valid JWT still has all input sanitized. No single point
of failure exists in the security chain.

---

## 10. Database Architecture

```
+===========================================================================+
|                  DATABASE ARCHITECTURE                                    |
|                 Supabase PostgreSQL - 7 Tables                            |
+===========================================================================+

  TABLE RELATIONSHIPS
  ===================

  auth.users (Supabase managed)
       |
       |-- user_id FK CASCADE DELETE
       |
       +-- conversations
       |     id text PK
       |     session_id text
       |     title text
       |     command_type text
       |     tags text[]
       |     message_count integer
       |     last_provider_used text
       |     total_tokens_used integer
       |     is_archived boolean
       |     user_id uuid FK -> auth.users
       |     created_at timestamptz
       |     updated_at timestamptz
       |
       +-- messages
       |     id text PK
       |     conversation_id text FK -> conversations
       |     session_id text
       |     role text (user/assistant/system)
       |     content text
       |     command_type text
       |     provider_name text
       |     model_name text
       |     prompt_tokens integer
       |     completion_tokens integer
       |     total_tokens integer
       |     latency_ms float
       |     fallback_triggered boolean
       |     fallback_reason text
       |     providers_tried text[]
       |     is_regenerated boolean
       |     memory_id text UNIQUE
       |     created_at timestamptz
       |
       +-- memory_entries
       |     id uuid PK
       |     memory_id text UNIQUE
       |     user_prompt text
       |     ai_response text
       |     command_type text
       |     provider_used text
       |     tags text[]
       |     is_starred boolean
       |     user_id uuid FK -> auth.users
       |     created_at timestamptz
       |
       +-- provider_logs
       |     id text PK
       |     session_id text
       |     conversation_id text
       |     provider_name text
       |     model_name text
       |     command_type text
       |     success boolean
       |     error_code text
       |     error_message text
       |     prompt_tokens integer
       |     completion_tokens integer
       |     latency_ms float
       |     was_fallback boolean
       |     created_at timestamptz
       |
       +-- user_analytics
       |     id uuid PK
       |     user_id uuid FK -> auth.users
       |     session_id text
       |     response_id text
       |     conversation_id text
       |     command_type text
       |     event_type text
       |     action text
       |     provider_used text
       |     tokens_used integer
       |     response_time_ms integer
       |     fallback_triggered boolean
       |     content_length integer
       |     created_at timestamptz
       |
       +-- user_command_stats
       |     user_id uuid PK FK -> auth.users
       |     at_count integer
       |     dollar_count integer
       |     hash_count integer
       |     star_count integer
       |     voice_count integer
       |     chat_count integer
       |     total_tokens integer
       |     total_sessions integer
       |     total_conversations integer
       |     total_requests integer
       |     favorite_provider text
       |     updated_at timestamptz
       |
       +-- user_profiles
             id uuid PK FK -> auth.users
             username text
             avatar_url text
             preferences jsonb
             updated_at timestamptz

  INDEXES
  =======

  conversations: session_id, user_id, created_at DESC, updated_at DESC
  messages: conversation_id, session_id, created_at DESC, memory_id
  memory_entries: user_id, memory_id, created_at DESC, is_starred WHERE true
  provider_logs: session_id, provider_name, created_at DESC
  user_analytics: user_id, event_type, command_type, session_id, created_at DESC
                  user_id+created_at composite, user_id+event_type composite
  user_command_stats: user_id, updated_at DESC, favorite_provider
```

**Blueprint:** The database schema is normalized and optimized for the access patterns
of ASHU AI Assistant. Conversations are the top-level aggregate. Messages belong to
conversations. Memory entries are independent of conversations - they are saved snapshots.
Provider logs are append-only audit records. User analytics support the STATS panel.
User command stats are denormalized aggregates updated on each interaction for fast
dashboard queries. All indexes are designed around the exact queries made by the application.

---

## 11. Row Level Security Architecture

```
+===========================================================================+
|                ROW LEVEL SECURITY ARCHITECTURE                            |
|              Per-User Data Isolation in Supabase PostgreSQL               |
+===========================================================================+

  RLS POLICY PATTERN (applied to all 7 tables)
  =============================================

  Table: conversations
    SELECT policy: user_id = auth.uid()
    INSERT policy: user_id = auth.uid()
    UPDATE policy: user_id = auth.uid()
    DELETE policy: user_id = auth.uid()

  Table: memory_entries
    SELECT policy: user_id = auth.uid()
    INSERT policy: user_id = auth.uid()
    UPDATE policy: user_id = auth.uid()
    DELETE policy: user_id = auth.uid()

  Table: user_command_stats
    SELECT policy: user_id = auth.uid()
    INSERT policy: user_id = auth.uid()
    UPDATE policy: user_id = auth.uid()

  Table: user_analytics
    SELECT policy: user_id = auth.uid()
    INSERT policy: user_id = auth.uid()

  Table: user_profiles
    SELECT policy: id = auth.uid()
    INSERT policy: id = auth.uid()
    UPDATE policy: id = auth.uid()

  EFFECT
  ======

  User A queries memory_entries
       |
       v
  PostgreSQL RLS filter: WHERE user_id = auth.uid()
       |
       v
  Returns ONLY User A records
  User B records are invisible at the database level
  Even with a compromised Supabase anon key
  Even with a direct Supabase client connection

  CASCADE DELETE
  ==============

  auth.users DELETE
       |
       +-- conversations CASCADE DELETE
       |     +-- messages CASCADE DELETE
       |
       +-- memory_entries CASCADE DELETE
       +-- user_analytics CASCADE DELETE
       +-- user_command_stats CASCADE DELETE
       +-- user_profiles CASCADE DELETE

  All user data is permanently removed when account is deleted
  No orphaned records remain in any table
```

**Blueprint:** Row Level Security is the final line of defense for data privacy. Even if
the backend JWT verification were bypassed, RLS would still prevent any user from reading
another user's data. The anon key (which is safe to expose in frontend code) cannot read
other users' data because RLS filters every query at the PostgreSQL engine level before
any data is returned. CASCADE DELETE ensures GDPR compliance - a user deletion triggers
complete data removal across all tables automatically.

---

## 12. Voice Synthesis Architecture

```
+===========================================================================+
|                  VOICE SYNTHESIS ARCHITECTURE                             |
|                Web Speech Synthesis API Integration                       |
+===========================================================================+

  useVoiceAgent hook
    |
    +-- State
    |     isEnabled: boolean
    |     isSpeaking: boolean
    |     isSupported: boolean
    |     lastSpokenText: string
    |
    +-- Voice Selection
    |     window.speechSynthesis.getVoices()
    |     Filter: lang includes en
    |     Filter: name includes female indicators
    |     Fallback: first available English voice
    |
    +-- speak(text)
    |     Cancel any current speech
    |     SpeechSynthesisUtterance(text)
    |     Set voice (female)
    |     Set rate: 0.9 (slightly slower for clarity)
    |     Set pitch: 1.0
    |     window.speechSynthesis.speak(utterance)
    |     Update lastSpokenText
    |
    +-- speakThemeChange(themeName, colorScheme)
          Called after theme state updates (150ms delay)
          Dynamic text from actual runtime values
          No hardcoded strings

  SPEECH TRIGGERS
  ===============

  Theme cycle button click    -> Speaks: new theme name
  Color scheme change         -> Speaks: new color scheme applied
  Login success               -> Speaks: user first name welcome
  Logout                      -> Speaks: goodbye with name
  /login when logged in       -> Speaks: already signed in as [name]
  Panel open (CMD MEM STATS)  -> Speaks: panel name
  Provider status change      -> Speaks: provider name and status
  Command submission          -> Speaks: command type detected

  ROBOT AGENT ICON
  ================

  VoiceController component
    +-- Robot icon button in TerminalInput
    +-- Shows last spoken text as subtitle
    +-- Animated glow when speaking
    +-- Click toggles voice agent on/off

  DEVICE SUPPORT
  ==============

  Chrome desktop          Full support
  Chrome Android          Full support
  Edge desktop            Full support
  Safari macOS/iOS        Full support
  Android TV browser      Full support
  Firefox                 Limited support - graceful degradation
```

**Blueprint:** The voice synthesis system is entirely client-side using the native
Web Speech Synthesis API - no external TTS service, no API keys, no cost. The female
voice is selected dynamically from whatever voices the user's OS has installed.
All speech text is generated from actual runtime values at the moment of speaking.
The 150ms delay before speaking theme changes ensures the React state has committed
before the voice reads the new value.

---

## 13. Animation System Architecture

```
+===========================================================================+
|                  ANIMATION SYSTEM ARCHITECTURE                            |
|            Device-Tier Adaptive Performance Budget                        |
+===========================================================================+

  DEVICE TIER DETECTION (on mount)
  =================================

  window.innerWidth
  navigator.hardwareConcurrency
  window.matchMedia('(hover: none)')
  window.matchMedia('(min-width: 1280px)')
  navigator.userAgent (TV detection)
       |
       v
  Tier assigned:
    low     Mobile + hardwareConcurrency <= 4
    mobile  Mobile + hardwareConcurrency > 4
    tablet  768px to 1024px
    desktop Above 1024px
    tv      hover:none + min-width 1280px

  ANIMATION BUDGET PER TIER
  =========================

  low (mobile low-end)
    Particles:  0
    MatrixRain: disabled
    Grid:       CSS only static
    Scanline:   disabled
    FPS target: 30

  mobile (mobile high-end)
    Particles:  max 20
    MatrixRain: reduced columns
    Grid:       animated
    Scanline:   enabled
    FPS target: 60

  tablet
    Particles:  max 50
    MatrixRain: moderate
    Grid:       full
    Scanline:   enabled
    FPS target: 60

  desktop
    Particles:  max 100
    MatrixRain: full columns
    Grid:       full
    Scanline:   enabled
    Glitch:     enabled
    FPS target: 60

  tv
    Particles:  max 100
    MatrixRain: full
    All effects: enabled
    Font scale: 1.25x larger
    FPS target: 60

  ANIMATION PERFORMANCE RULES
  ===========================

  ALLOWED properties (GPU composited - zero layout cost)
    transform: translateX translateY translateZ scale rotate
    opacity

  FORBIDDEN in animations (CPU painted - causes jank)
    box-shadow
    filter (except on hover events only)
    width / height
    top / left / right / bottom
    background-color (in loops)

  PARTICLE SYSTEM
  ===============

  requestAnimationFrame loop (NOT setInterval)
  Single shared RAF loop across all particle systems
  IntersectionObserver pauses when component not visible
  React.memo on all animation components
  Canvas-based MatrixRain (not DOM elements)

  HOLOGRAPHIC THEMES
  ==================

  matrix    Primary #00ff41  Background #000000
  cyberpunk Primary #f7e733  Background #0a0a0f
  ocean     Primary #00d4ff  Background #000a1a
  sunset    Primary #ff6b35  Background #0a0000
  plasma    Primary #bf00ff  Background #0a000f

  Each theme: dark variant + light variant
  Color scheme: dark / light / system (OS preference)
```

**Blueprint:** The animation system is designed so that the visual richness scales
with device capability. A low-end mobile phone gets CSS-only animations with zero
JavaScript particle overhead. A desktop gets the full Iron Man Jarvis cinematic
experience with 100 particles, matrix rain, holographic grid, and glitch effects.
All animations are GPU-composited using only transform and opacity - the browser
promotes these to their own compositor layer and animates them without touching
the main thread.

---

## 14. API Request Lifecycle

```
+===========================================================================+
|                   API REQUEST LIFECYCLE                                   |
|                  Complete Flow from User Input to Response                |
+===========================================================================+

  USER types message and presses Enter
       |
       v
  [FRONTEND] useTerminal.ts
       |
       +-- commandParser.ts detects command type
       +-- Input sanitized via sanitizer.ts
       +-- Optimistic UI update (user message shown)
       +-- Loading state set (isLoading = true)
       |
       v
  [FRONTEND] lib/api/client.ts
       |
       +-- resolveBaseUrl() selects backend URL
       |     Check NEXT_PUBLIC_BACKEND_URL env var
       |     Fallback to window.location.hostname:8000
       |     Fallback to localhost:8000
       |
       +-- getAuthHeader() fetches JWT from Supabase session
       +-- fetch(url, {method, headers, body, signal})
       +-- AbortController with 120s timeout
       |
       v
  [NETWORK] HTTPS request to HuggingFace Spaces
       |
       v
  [BACKEND] FastAPI middleware chain
       |
       +-- RequestLoggingMiddleware: log request + assign request ID
       +-- CORSMiddleware: validate origin
       +-- Rate limiter: check 60/min 500/hour
       +-- Route matched
       +-- JWT verified by security.py
       +-- Input sanitized by sanitizer.py
       |
       v
  [BACKEND] Route handler
       |
       +-- LLM router selects provider
       +-- Circuit breaker checked
       +-- Provider API called with timeout
       |
       +-- SUCCESS
       |     +-- Response parsed
       |     +-- Logged to provider_logs
       |     +-- Analytics event recorded
       |     +-- Command stats updated
       |     +-- JSON response returned
       |
       +-- FAILURE
             +-- Circuit breaker updated
             +-- Next provider tried
             +-- Logged as fallback
       |
       v
  [BACKEND] SecurityHeadersMiddleware: inject response headers
       |
       v
  [NETWORK] HTTPS response
       |
       v
  [FRONTEND] client.ts receives response
       |
       +-- Parse JSON
       +-- Extract content + provider_name + fallback_triggered
       |
       v
  [FRONTEND] useTerminal.ts
       |
       +-- isLoading = false
       +-- AI message appended to messages[]
       +-- ProviderStatusBar updated
       +-- Voice agent speaks response summary
       +-- Auto-scroll to bottom
```

**Blueprint:** The complete request lifecycle from keypress to rendered response
involves approximately 12 sequential steps. The 120-second timeout on the frontend
handles slow LLM providers gracefully. The AbortController allows cancellation.
The middleware chain on the backend processes each concern in isolation.
The entire flow is observable - every step is logged.

---

## 15. Deployment Architecture

```
+===========================================================================+
|                   DEPLOYMENT ARCHITECTURE                                 |
|              Vercel (Frontend) + HuggingFace (Backend)                   |
+===========================================================================+

  FRONTEND - VERCEL
  =================

  GitHub repository
       |
       | git push to main
       |
       v
  Vercel detects Next.js 15
       |
       +-- npm run build
       +-- Static pages generated (6 pages)
       +-- Chunks optimized
       +-- CDN distribution worldwide
       |
       v
  https://your-app.vercel.app
    All traffic served from Vercel CDN
    HTTPS enforced automatically
    No Dockerfile needed

  Environment Variables on Vercel
    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY
    NEXT_PUBLIC_BACKEND_URL = HuggingFace Space URL

  BACKEND - HUGGINGFACE SPACES
  ============================

  backend/ directory
       |
       | Push to HuggingFace Space git repo
       |
       v
  HuggingFace reads Dockerfile
       |
       +-- FROM python:3.14-slim
       +-- pip install -r requirements.txt
       +-- Copy app code
       +-- USER ashuai (UID 1001)
       +-- EXPOSE 7860
       +-- CMD uvicorn app.main:app --host 0.0.0.0 --port 7860
       |
       v
  https://your-space.hf.space
    HuggingFace proxies port 7860 to HTTPS
    Health check: curl localhost:7860/health every 30s
    CPU Basic free tier: 2 vCPU 16GB RAM

  Space Secrets (equivalent to env vars)
    SUPABASE_URL
    SUPABASE_ANON_KEY
    SUPABASE_SERVICE_KEY
    SUPABASE_JWT_SECRET
    GEMINI_API_KEY
    GROQ_API_KEY
    [all 13 provider API keys]
    ENVIRONMENT = production
    FRONTEND_URL = Vercel URL

  SUPABASE - MANAGED CLOUD
  ========================

  Supabase project (free tier)
    PostgreSQL database
    Auth service (Email + Google + GitHub)
    JWT authority
    Row Level Security enforced
    7 tables with indexes
    Accessible from both Vercel and HuggingFace

  PRODUCTION DATA FLOW
  ====================

  User (any device, any location)
       |
       | HTTPS
       v
  Vercel CDN (frontend)
       |
       | HTTPS + JWT
       v
  HuggingFace Spaces (backend)
       |
       | HTTPS
       v
  AI Provider APIs (13 providers)
       |
       | HTTPS
       v
  Supabase PostgreSQL (data persistence)
```

**Blueprint:** The deployment uses managed cloud services for zero infrastructure
maintenance. Vercel handles frontend CDN, SSL, and build pipeline. HuggingFace
handles backend container orchestration, SSL, and health monitoring. Supabase
handles database, auth, and JWT authority. No servers to manage. No SSL certificates
to renew. No scaling configuration needed for the expected usage scale.

---

## 16. Project Structure Architecture

```
+===========================================================================+
|                  PROJECT STRUCTURE ARCHITECTURE                           |
|                  File Organization and Responsibility                     |
+===========================================================================+

  BACKEND LAYER RESPONSIBILITIES
  ==============================

  app/core/        Cross-cutting concerns
    config.py      Single source of truth for all configuration
                   pydantic-settings reads from .env file
                   Validates all env vars at startup
                   Provides get_settings() cached singleton

    security.py    JWT verification only
                   get_current_user() dependency for protected routes
                   Returns user UUID from JWT sub claim

    middleware.py  Two middleware classes:
                   RequestLoggingMiddleware: assigns x-request-id
                   SecurityHeadersMiddleware: injects 5 security headers

    limiter.py     slowapi Limiter instance
                   Used as FastAPI dependency on rate-limited routes

    supabase.py    Supabase client singleton
                   Service role client for backend operations

    identity.py    Builds ASHU AI system prompt identity context
                   Reads developer name, links from config
                   Injected as system message in every LLM call

  app/models/      Data contracts
    request.py     ChatRequest, CommandRequest, MemoryRequest
    response.py    ChatResponse, MemoryEntry, ProviderStatus
    database.py    Database record models

  app/routers/     HTTP interface only
                   No business logic in routers
                   Call service functions
                   Handle HTTP status codes

  app/services/    All business logic
    llm/           Provider implementations + router
    commands/      Command handlers
    memory/        Memory CRUD + ID generation
    auth/          Auth service
    analytics/     Event tracking

  app/utils/       Stateless helpers
    circuit_breaker.py  State machine per provider
    retry.py            Decorator for automatic retry
    sanitizer.py        Pure function input cleaning
    command_types.py    Enum definitions

  FRONTEND LAYER RESPONSIBILITIES
  ================================

  app/              Next.js App Router pages
                    Minimal code - mostly component mounting

  components/       Pure UI components
                    No direct API calls
                    Receive props, emit events
                    Memoized with React.memo

  hooks/            All state and side effects
                    Components call hooks
                    Hooks call lib/ functions

  lib/              External service integration
    api/client.ts   All HTTP calls to backend
    supabase/       All Supabase operations
    utils/          Pure functions

  store/            Global state (Zustand)
                    Minimal - only truly global state

  types/            TypeScript contracts
                    Shared between components and hooks
```

**Blueprint:** The project follows strict separation of concerns at every layer.
In the backend: routers know HTTP, services know business logic, core knows infrastructure.
In the frontend: components know rendering, hooks know state, lib knows APIs.
This separation makes every file independently understandable and independently testable.

---

## 17. Data Flow Diagrams

```
+===========================================================================+
|                      DATA FLOW DIAGRAMS                                   |
|                  Key User Interaction Flows                               |
+===========================================================================+

  FLOW 1: PLAIN CHAT
  ==================

  User types Hello
  -> commandParser: type=chat
  -> POST /api/v1/chat {message: Hello, session_id}
  -> Backend: JWT check -> LLM router -> Provider API
  -> Response: {content, provider_name, tokens}
  -> Frontend: AI message displayed
  -> Analytics: event logged
  -> Voice: AI speaks summary

  FLOW 2: AT COMMAND
  ==================

  User types @ what is recursion
  -> commandParser: type=at, payload=what is recursion
  -> POST /api/v1/commands {type: at, payload}
  -> at_command.py: builds PhD-level system prompt
  -> LLM router: sends to provider
  -> Response: expert explanation from basics to advanced
  -> Frontend: formatted markdown output

  FLOW 3: HASH MEMORY SAVE
  ========================

  User types # explain closures
  -> commandParser: type=hash
  -> POST /api/v1/commands {type: hash, payload}
  -> hash_command.py: generate IDs
  -> LLM router: get response
  -> Save to memory_entries table
  -> Response: AI answer + MEM-[hash] shown
  -> MEM panel: auto-refreshes with new entry

  FLOW 4: MEMORY RETRIEVAL
  ========================

  User opens MEM panel
  -> GET /api/v1/memory
  -> List shown with IDs
  User hovers ID
  -> Tooltip: full prompt + response preview
  User clicks ID
  -> ID pasted into terminal input
  User presses Enter
  -> commandParser: detects MEM- prefix -> type=star
  -> POST /api/v1/commands {type: star, payload: MEM-hash}
  -> star_command.py: fetch entry + regenerate
  -> Response: regenerated content

  FLOW 5: PROVIDER FALLBACK
  =========================

  Request arrives
  -> Router: try Gemini
  -> Gemini: HTTP 429 rate limit
  -> Circuit breaker: increment Gemini failures
  -> Log: provider_logs {gemini, success=false, error=429}
  -> Router: try Groq (next in chain)
  -> Groq: HTTP 200 success
  -> Log: provider_logs {groq, success=true, was_fallback=true}
  -> Response: content + fallback_triggered=true + provider=groq
  -> Frontend: ProviderStatusBar shows groq as active with glow
```

---

## 18. Error Handling Architecture

```
+===========================================================================+
|                  ERROR HANDLING ARCHITECTURE                              |
|                  Graceful Degradation at Every Layer                      |
+===========================================================================+

  FRONTEND ERROR CLASSES
  ======================

  ApiError extends Error
    status: number      HTTP status code
    message: string     Human-readable description

  Error display in terminal:
    HTTP 401  -> Authentication required - please login
    HTTP 429  -> Rate limit reached - provider switching
    HTTP 500  -> Backend error - shown with details
    timeout   -> Request timed out - resend your message
    network   -> Cannot connect to backend - check connection

  BACKEND ERROR HANDLING
  ======================

  Provider API errors:
    429 Rate Limit     -> Circuit breaker increment -> next provider
    401 Auth Error     -> Provider misconfigured -> next provider
    500 Server Error   -> Provider down -> next provider
    Timeout            -> Provider slow -> next provider
    Connection refused -> Provider unreachable -> next provider

  All provider errors logged to provider_logs table
  Last resort: all 13 providers exhausted -> HTTP 503 to frontend

  HYDRATION ERROR PREVENTION
  ==========================

  Problem: Server renders disabled=true, client renders disabled=false
  Solution: mounted useState defaults to false
            useEffect sets mounted=true after client hydration
            All dynamic props guarded: mounted && actualValue
            Server always sees conservative initial state

  TYPESCRIPT STRICT MODE ERRORS HANDLED
  ======================================

  Array index access   arr[0]           -> arr[0] ?? fallback
  Optional chaining    obj.prop         -> obj?.prop ?? fallback
  Undefined checks     value.method()   -> (value ?? default).method()

  GRACEFUL DEGRADATION
  ====================

  Voice not supported     -> Robot icon hidden gracefully
  All providers down      -> Error message with retry option
  Supabase unreachable    -> Auth error with clear message
  Network offline         -> Friendly disconnect message
  Animation not supported -> Static CSS fallback
  localStorage blocked    -> Terminal draft disabled silently
```

**Blueprint:** Error handling is designed so that no error ever crashes the application.
Every error surface has a defined fallback state. Provider errors cascade to the next
provider. Network errors show clear user messages. JavaScript errors in animations
fall back to CSS. The application degrades gracefully from full featured to basic
functionality depending on what is available in the user's environment.

---


## 19. Holographic Logo Button Architecture

  COMPONENT: HolographicLogoButton
  File: frontend/components/ui/HolographicLogoButton.tsx

  PLACEMENT LOGIC
  ===============

  isAuthenticated = false
    Desktop / Tablet: Left side of navbar next to ASHU_AI title compact=true
    Mobile: Right side of navbar before LOGIN button compact=true

  isAuthenticated = true
    All devices: Inside user profile dropdown menu Label Logo Modulator compact=true

  ANIMATION STATE MACHINE
  =======================

  idle: Hexagonal SVG ring slow rotate 8s infinite, inner ring counter-rotate 12s reverse, logo pulse opacity 2s infinite
  implode 0ms-150ms: Button scale 0.8, ring stroke width 3px, ring opacity 0.4
  spin 150ms-300ms: hexSpin 0.4s linear full 360deg, ring stroke brightens to #00ffff
  burst 300ms-500ms: Particle spawn from device tier, radiate outward from canvas center
  sweep 500ms-700ms: Desktop Tablet TV only, full-screen fixed overlay, sweepPulse keyframe scale 0.8 to 1.5 opacity 1 to 0
  settle 700ms-900ms: Button scale 1.05 slight overshoot, glow normalized
  complete 900ms: Phase idle, isAnimating false, window.open LOGO_URL blank noopener noreferrer

  PARTICLE SYSTEM
  ===============

  Engine: requestAnimationFrame NOT setInterval
  Canvas: absolute positioned pointer-events none
  low=0 mobile=10 tablet=20 desktop=30 tv=30
  PARTICLE_COLORS: #00d4ff #00ff41 #bf00ff #ffffff #00ffff #4fc3f7
  IntersectionObserver pauses RAF when not visible
  React.memo prevents re-render cascades

  VOICE INTEGRATION
  =================

  onSpeak prop receives speak from useVoiceAgent
  Trigger immediately on click before animation
  Female voice only rate 0.9 pitch 1.0
  Zero hardcoded strings

  DEVICE TIER DETECTION
  =====================

  low Mobile cores<=4 CSS only
  mobile Mobile cores>4 10 particles
  tablet 768px-1024px 20 particles
  desktop above 1024px 30 particles cinematic
  tv hover none min 1280px 30 particles cinematic

  ANIMATION PERFORMANCE RULES
  ===========================

  Allowed GPU composited: transform scale rotate translateX translateY opacity
  Forbidden in loops: box-shadow filter width height background-color

  LOGO MODULATOR URL
  ==================

  Target: https://ashu-ai-assistant-logo.ai.studio/
  Open method: window.open noopener noreferrer new tab always
  Timing: 900ms after click after full animation completes

  Blueprint: HolographicLogoButton is fully self-contained. Manages own device tier
  detection, particle system, animation state machine, and voice trigger. Zero external
  dependencies beyond onSpeak prop. Degrades gracefully from full cinematic on desktop
  to CSS-only on low-end mobile. Designed to feel like activating a Jarvis interface element.

---
## Summary

ASHU AI Assistant is built on five core architectural principles:

1. **Zero single points of failure** - 13 provider fallback chain, circuit breakers,
   graceful degradation at every layer

2. **Defense in depth security** - 7 independent security layers from HTTPS to RLS

3. **Device-adaptive performance** - 5 device tiers with appropriate animation budgets

4. **Clear separation of concerns** - routers know HTTP, services know business logic,
   core knows infrastructure, components know rendering, hooks know state

5. **Observability** - every request logged, every provider call recorded, every user
   interaction tracked in analytics

---

*Architecture documented by AWS - Arshad Wasib Shaik*
*ASHU AI Assistant v2.0.0 - 2026*
