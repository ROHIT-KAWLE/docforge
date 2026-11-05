# ==========================================
# DocForge Universal Production Dockerfile
# Compatible with: Hugging Face Spaces, Render, VPS, Local Docker
# ==========================================

# Stage 1: Build Frontend Single-Page App & PWA
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Production Server
FROM python:3.11-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies (build-essential, tesseract-ocr, libreoffice, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    tesseract-ocr \
    libreoffice \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend/ ./backend/

# Copy Built Frontend Assets into the expected dist location
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Setup user and storage directories (compatible with Hugging Face Spaces & Render)
RUN useradd -m -u 1000 user && \
    mkdir -p /app/storage/uploads /app/storage/processed /app/storage/temp && \
    chown -R user:user /app

USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

EXPOSE 7860
EXPOSE 8000

# Uses PORT if provided by cloud host (Render, etc.), otherwise defaults to 7860 (Hugging Face)
CMD ["sh", "-c", "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
