# ─────────────────────────────────────────────────────────────
#  Consultorio Legal — Web (Next.js 14)
#  Contexto de build: apps/web/
#  Modo desarrollo con hot-reload
# ─────────────────────────────────────────────────────────────

FROM node:20-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Instalar dependencias (contexto = apps/web/)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else npm install; \
  fi

# Copiar código fuente
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "dev"]
