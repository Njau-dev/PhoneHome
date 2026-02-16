# 1) Build
FROM node:20-alpine AS builder

WORKDIR /phk

COPY package.json package-lock.json ./
RUN npm ci

# Build args from GitHub Actions
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY . .
RUN npm run build

# 2) Runtime
FROM node:20-alpine

WORKDIR /phk

ENV NODE_ENV=production

RUN addgroup -S phkgroup && adduser -S phkuser -G phkgroup

# Copy standalone build output
COPY --from=builder /phk/.next/standalone ./
COPY --from=builder /phk/.next/static ./.next/static
COPY --from=builder /phk/public ./public

RUN chown -R phkuser:phkgroup /phk

USER phkuser

EXPOSE 3000

CMD ["node", "server.js"]
