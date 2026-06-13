FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_USE_API=true
ARG VITE_API_TIMEOUT=30000
ARG VITE_ADMIN_BASE_PATH=/control-panel
ARG VITE_ADMIN_API_BASE_PATH=/core-portal
ARG VITE_VAPID_PUBLIC_KEY=

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_USE_API=${VITE_USE_API} \
    VITE_API_TIMEOUT=${VITE_API_TIMEOUT} \
    VITE_ADMIN_BASE_PATH=${VITE_ADMIN_BASE_PATH} \
    VITE_ADMIN_API_BASE_PATH=${VITE_ADMIN_API_BASE_PATH} \
    VITE_VAPID_PUBLIC_KEY=${VITE_VAPID_PUBLIC_KEY}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
