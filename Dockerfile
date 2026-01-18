# ===== build stage =====
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係
COPY package*.json ./
RUN npm ci

# TypeScriptビルド
COPY tsconfig.json ./
COPY main.ts ./

RUN npx tsc main.ts --outDir dist

# ===== runtime stage =====
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# 本番に必要なものだけ
COPY --from=builder /app/dist ./dist
COPY package*.json ./

RUN npm ci --omit=dev

EXPOSE 3000

CMD ["node", "dist/main.js"]
