# ===== build stage =====
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係（lockfile前提）
COPY package*.json ./
RUN npm ci

# TypeScript 設定とソース
COPY tsconfig.json ./
COPY main.ts ./

# tsconfig.json を使ってビルド
RUN npx tsc

# ===== runtime stage =====
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# ビルド成果物のみコピー
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# 本番依存のみ
RUN npm ci --omit=dev

EXPOSE 3000

CMD ["node", "dist/main.js"]
