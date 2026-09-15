---
title: AWS ASHU AI Assistant Backend
emoji: 🤖
colorFrom: blue
colorTo: cyan
sdk: docker
pinned: false
suggested_hardware: cpu-basic
---

# ASHU AI Assistant Backend

FastAPI backend powering ASHU AI Assistant with 13-provider LLM fallback routing.

## Live Endpoints

- `GET /api/v1/health` - Health check
- `GET /api/v1/health/providers` - All 13 provider status
- `POST /api/v1/chat` - Main chat endpoint
- `POST /api/v1/commands` - Command routing
- `GET /api/v1/memory` - Memory entries
- `GET /api/v1/analytics/dashboard` - Analytics

## Tech Stack

- FastAPI + Python 3.14
- Supabase PostgreSQL + JWT Auth
- 13-provider LLM router with circuit breaker
- Docker container on HuggingFace Spaces CPU Basic

## Developer

AWS - Arshad Wasib Shaik
