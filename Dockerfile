# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# package.json + package-lock.json をコピー
COPY package*.json ./

# devDependencies も含めてインストール
RUN npm ci

# ソースコピー & TypeScript コンパイル
COPY tsconfig.json ./
COPY main.ts ./
RUN npx tsc

# Production stage
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# コンパイル済みファイルだけコピー
COPY --from=builder /app/dist ./dist

# 依存関係のみコピーして production モードでインストール
COPY package*.json ./
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["node", "dist/main.js"]
