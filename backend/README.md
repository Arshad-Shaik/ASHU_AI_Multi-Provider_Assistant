# ASHU AI Assistant - Backend

## AdvancedSystemHolographicUnified Artificial Intelligence Assistant

FastAPI Python 3.14 backend with 13-provider LLM router, circuit breaker fallback chain,
Supabase JWT authentication, rate limiting, input sanitization, and complete analytics tracking.

---

## Project Structure

    backend/
    +-- app/
    |   +-- core/
    |   |   +-- config.py                       pydantic-settings environment configuration
    |   |   +-- identity.py                     ASHU AI system prompt identity context
    |   |   +-- limiter.py                      slowapi rate limiter 60/min 500/hour
    |   |   +-- middleware.py                   Request logging and security headers
    |   |   +-- security.py                     Supabase JWT verification dependency
    |   |   +-- supabase.py                     Supabase service role client singleton
    |   |   +-- __init__.py                     Core module init
    |   +-- models/
    |   |   +-- database.py                     Database record models
    |   |   +-- request.py                      ChatRequest CommandRequest MemoryRequest
    |   |   +-- response.py                     ChatResponse MemoryEntry ProviderStatus
    |   |   +-- __init__.py                     Models module init
    |   +-- routers/
    |   |   +-- analytics.py                    GET /api/v1/analytics/dashboard
    |   |   +-- auth.py                         POST /api/v1/auth/verify
    |   |   +-- chat.py                         POST /api/v1/chat
    |   |   +-- commands.py                     POST /api/v1/commands
    |   |   +-- health.py                       GET /api/v1/health and /health/providers
    |   |   +-- memory.py                       GET POST DELETE /api/v1/memory
    |   |   +-- __init__.py                     Routers module init
    |   +-- services/
    |   |   +-- analytics/
    |   |   |   +-- tracker.py                  Event logging to user_analytics table
    |   |   |   +-- __init__.py                 Analytics service init
    |   |   +-- auth/
    |   |   |   +-- supabase_auth.py            JWT decode and user extraction
    |   |   |   +-- __init__.py                 Auth service init
    |   |   +-- commands/
    |   |   |   +-- at_command.py               @ PhD-level expert explanation handler
    |   |   |   +-- dollar_command.py           $ line-by-line code analysis handler
    |   |   |   +-- hash_command.py             # memory save with ID generation handler
    |   |   |   +-- star_command.py             * regenerate saved memory entry handler
    |   |   |   +-- __init__.py                 Commands service init
    |   |   +-- llm/
    |   |   |   +-- providers/
    |   |   |   |   +-- cerebras_provider.py    Cerebras llama3.1-8b free tier
    |   |   |   |   +-- claude_provider.py      Anthropic claude-3-haiku paid
    |   |   |   |   +-- cloudflare_provider.py  Cloudflare llama-3-8b free tier
    |   |   |   |   +-- cohere_provider.py      Cohere command-r free tier
    |   |   |   |   +-- deepseek_provider.py    DeepSeek deepseek-chat free tier
    |   |   |   |   +-- gemini.py               Google Gemini 1.5 flash free tier
    |   |   |   |   +-- grok_provider.py        xAI Grok beta limited free
    |   |   |   |   +-- groq_provider.py        Groq qwen3 free tier
    |   |   |   |   +-- huggingface_provider.py HuggingFace zephyr-7b free tier
    |   |   |   |   +-- mistral_provider.py     Mistral small latest free tier
    |   |   |   |   +-- openai_provider.py      OpenAI gpt-4o-mini paid
    |   |   |   |   +-- openrouter_provider.py  OpenRouter auto routing free tier
    |   |   |   |   +-- together_provider.py    Together AI llama-3-8b free tier
    |   |   |   |   +-- __init__.py             Providers module init
    |   |   |   +-- base.py                     AbstractLLMProvider base class
    |   |   |   +-- router.py                   13-provider fallback chain router
    |   |   |   +-- __init__.py                 LLM service init
    |   |   +-- memory/
    |   |   |   +-- conversation.py             Conversation management
    |   |   |   +-- conversation_logger.py      Conversation logging to Supabase
    |   |   |   +-- id_generator.py             USR ASH MEM ID generation
    |   |   |   +-- manager.py                  Memory CRUD operations
    |   |   |   +-- __init__.py                 Memory service init
    |   |   +-- ai_router.py                    Top-level AI routing service
    |   |   +-- __init__.py                     Services module init
    |   +-- utils/
    |   |   +-- circuit_breaker.py              Per-provider failure state machine
    |   |   +-- command_types.py                Command type enum definitions
    |   |   +-- retry.py                        Exponential backoff retry decorator
    |   |   +-- sanitizer.py                    XSS and injection input cleaning
    |   |   +-- __init__.py                     Utils module init
    |   +-- main.py                             FastAPI application factory
    |   +-- __init__.py                         App module init
    +-- Dockerfile                              HuggingFace Spaces production container
    +-- requirements.txt                        Python dependencies

---

## Tech Stack

    Technology         Version    Purpose
    +------------------+-----------+-------------------------------+
    | Python           | 3.14.0    | Runtime                       |
    | FastAPI          | Latest    | ASGI web framework            |
    | Uvicorn          | Latest    | ASGI server                   |
    | pydantic-settings| Latest    | Environment configuration     |
    | python-jose      | Latest    | JWT verification              |
    | slowapi          | Latest    | Rate limiting                 |
    | supabase-py      | Latest    | Database and auth client      |
    | httpx            | Latest    | Async HTTP client             |
    +------------------+-----------+-------------------------------+

---

## API Endpoints

    Method   Endpoint                        Auth      Description
    +--------+--------------------------------+----------+---------------------------+
    | GET    | /api/v1/health                 | None     | Health check and uptime   |
    | GET    | /api/v1/health/providers       | None     | Provider availability     |
    | POST   | /api/v1/chat                   | Required | Plain chat message        |
    | POST   | /api/v1/commands               | Required | Command routing @ $ # *   |
    | GET    | /api/v1/memory                 | Required | List memory entries       |
    | POST   | /api/v1/memory                 | Required | Save memory entry         |
    | DELETE | /api/v1/memory/{id}            | Required | Delete memory entry       |
    | GET    | /api/v1/analytics/dashboard    | Required | User analytics data       |
    | POST   | /api/v1/auth/verify            | None     | Verify Supabase JWT       |
    +--------+--------------------------------+----------+---------------------------+

---

## AI Provider Chain

    Priority   Provider           Model                    Tier
    +----------+------------------+-------------------------+-----------+
    | 1        | Google Gemini    | gemini-1.5-flash        | Free      |
    | 2        | Groq             | qwen/qwen3-8b-27b       | Free      |
    | 3        | Mistral AI       | mistral-small-latest    | Free      |
    | 4        | OpenAI           | gpt-4o-mini             | Paid      |
    | 5        | xAI Grok         | grok-beta               | Limited   |
    | 6        | Anthropic Claude | claude-3-haiku          | Paid      |
    | 7        | Cerebras         | llama3.1-8b             | Free      |
    | 8        | OpenRouter       | auto                    | Free      |
    | 9        | Cohere           | command-r               | Free      |
    | 10       | HuggingFace      | zephyr-7b-beta          | Free      |
    | 11       | Cloudflare       | llama-3-8b-instruct     | Free      |
    | 12       | Together AI      | llama-3-8b-chat         | Free      |
    | 13       | DeepSeek         | deepseek-chat           | Free      |
    +----------+------------------+-------------------------+-----------+

Router selects first available provider whose circuit is closed.
On failure automatically tries next provider in chain.
All 13 exhausted returns HTTP 503 with clear error message.

---

## Circuit Breaker

    State       Behavior
    +-----------+--------------------------------------------------+
    | CLOSED    | Requests pass through normally                   |
    | OPEN      | All requests rejected instantly no API call made |
    | HALF-OPEN | Limited test requests allowed max 2              |
    +-----------+--------------------------------------------------+

    Configuration:
    failure_threshold       = 5 consecutive failures to open circuit
    recovery_timeout        = 30 seconds before half-open test
    half_open_max_calls     = 2 test calls allowed
    provider_timeout        = 25 seconds per API call

Each of the 13 providers has an independent circuit breaker instance.
A circuit opening on one provider does not affect any other provider.

---

## Security Layers

    Layer   Protection
    +-------+---------------------------------------------------+
    | 1     | HTTPS transport enforced by Render and Cloudflare |
    | 2     | CORS allowlist from FRONTEND_URL environment var  |
    | 3     | Rate limiting 60 per minute 500 per hour per IP   |
    | 4     | Supabase JWT verification on every protected route|
    | 5     | Input sanitization XSS and injection cleaning     |
    | 6     | Business logic and response generation            |
    | 7     | Security headers injected on every response       |
    +-------+---------------------------------------------------+

Security headers on every response:
    X-Content-Type-Options: nosniff
    X-Frame-Options: DENY
    X-XSS-Protection: 1; mode=block
    Referrer-Policy: strict-origin-when-cross-origin
    x-request-id: unique UUID per request
    x-response-time: latency in milliseconds

---

## Command System

    Command   Prefix   Handler             Description
    +---------+--------+--------------------+----------------------------------+
    | AT      | @      | at_command.py      | PhD-level expert explanation     |
    | DOLLAR  | $      | dollar_command.py  | Line-by-line code analysis       |
    | HASH    | #      | hash_command.py    | Save to memory with MEM ID       |
    | STAR    | *      | star_command.py    | Regenerate saved memory entry    |
    | CHAT    | none   | chat router        | Plain conversational message     |
    +---------+--------+--------------------+----------------------------------+

---

## Memory ID System

    ID Format     Pattern            Description
    +-------------+------------------+----------------------------------+
    | USR-XXXXXXXX | USR-[A-F0-9]{8} | User prompt identifier           |
    | ASH-XXXXXXXX | ASH-[A-F0-9]{8} | AI response identifier           |
    | MEM-XXXXXXXX | MEM-[A-F0-9]{16}| Master memory entry identifier   |
    +-------------+------------------+----------------------------------+

Generation: hash of user_id + prompt + timestamp.
Storage: Supabase memory_entries table with UNIQUE constraint on memory_id.
Retrieval: GET /api/v1/memory returns list with hover preview support.
Regeneration: POST /api/v1/commands with type star and memory_id payload.

---

## Database Tables

    Table                Description
    +---------------------+------------------------------------------+
    | conversations       | Top-level conversation aggregates        |
    | messages            | Individual messages per conversation     |
    | memory_entries      | Saved memory snapshots with MEM IDs      |
    | provider_logs       | Append-only audit log per provider call  |
    | user_analytics      | Per-event analytics tracking             |
    | user_command_stats  | Denormalized aggregate command counters  |
    | user_profiles       | User profile data and preferences        |
    +---------------------+------------------------------------------+

Row Level Security enforced on all tables.
Every user can only read and write their own data.
CASCADE DELETE removes all user data on account deletion.

---

## Environment Variables

Create backend/.env with these values:

    SUPABASE_URL=your_supabase_project_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_KEY=your_supabase_service_role_key
    SUPABASE_JWT_SECRET=your_supabase_jwt_secret
    GEMINI_API_KEY=your_gemini_api_key
    GROQ_API_KEY=your_groq_api_key
    MISTRAL_API_KEY=your_mistral_api_key
    OPENAI_API_KEY=your_openai_api_key
    GROK_API_KEY=your_grok_api_key
    CLAUDE_API_KEY=your_claude_api_key
    CEREBRAS_API_KEY=your_cerebras_api_key
    OPENROUTER_API_KEY=your_openrouter_api_key
    COHERE_API_KEY=your_cohere_api_key
    HUGGINGFACE_API_KEY=your_huggingface_api_key
    CLOUDFLARE_API_KEY=your_cloudflare_api_key
    CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
    TOGETHER_API_KEY=your_together_api_key
    DEEPSEEK_API_KEY=your_deepseek_api_key
    ENVIRONMENT=development
    FRONTEND_URL=http://localhost:3000

---

## Local Development

Step 1 - Create virtual environment:
    python -m venv .venv
    .venv\Scripts\activate

Step 2 - Install dependencies:
    pip install -r requirements.txt

Step 3 - Create environment file:
    Copy the environment variables above into backend/.env

Step 4 - Start development server:
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Step 5 - Verify health check:
    http://localhost:8000/api/v1/health

Step 6 - Check provider status:
    http://localhost:8000/api/v1/health/providers

Production health check:
    https://aws-ashu-ai-assistant-backend.onrender.com/api/v1/health
    https://aws-ashu-ai-assistant-backend.onrender.com/api/v1/health/providers

---

## Docker Build

    docker build -t ashu-ai-backend .
    docker run -p 8000:8000 --env-file .env ashu-ai-backend

Container runs as non-root user ashuai with UID 1001.
Base image: python:3.12-slim for minimal attack surface.
Exposes port 8000 for Render deployment compatibility.

---

## Production Deployment

Deploy to Render:

Step 1 - Go to render.com and create a new Web Service.
Step 2 - Connect GitHub repository ASHU-AI-Assistant.
Step 3 - Set Root Directory to backend and Runtime to Docker.
Step 4 - Add all environment variables in Render dashboard.
Step 5 - Render builds and deploys automatically.
Step 6 - Production URL: https://aws-ashu-ai-assistant-backend.onrender.com

---

## Rate Limits

    Limit Type    Value
    +-------------+---------------------------+
    | Per minute  | 60 requests per IP        |
    | Per hour    | 500 requests per IP       |
    | Exceeded    | HTTP 429 Too Many Requests|
    +-------------+---------------------------+

Rate limiting is per IP address using slowapi.
Provider-level rate limits are handled by circuit breaker and fallback chain.

---

## Developer

AWS - Arshad Wasib Shaik
LinkedIn: https://www.linkedin.com/in/arshadwasibshaik
GitHub: https://github.com/Arshad-Shaik

---

## License

MIT License - 2026 ASHU AI Assistant