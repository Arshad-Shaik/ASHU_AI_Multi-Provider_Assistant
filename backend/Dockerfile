FROM python:3.12-slim

ARG ENVIRONMENT=production

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV PORT=8000
ENV ENVIRONMENT=${ENVIRONMENT}

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1001 ashuai \
    && useradd --uid 1001 --gid ashuai --shell /bin/bash --create-home ashuai

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip==26.1.2 \
    && pip install --no-cache-dir -r requirements.txt

COPY --chown=ashuai:ashuai . .

RUN find /app -type d -exec chmod 755 {} + \
    && find /app -type f -name '*.py' -exec chmod 644 {} +

USER ashuai

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--loop", "asyncio", "--log-level", "info"]