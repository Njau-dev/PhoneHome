# 1. Build
FROM node:20-alpine AS builder

WORKDIR /phk

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build


# 2. Run
FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /phk/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
