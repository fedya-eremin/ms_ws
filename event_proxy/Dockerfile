# Используем официальный образ Node.js с Alpine
FROM node:22-alpine as base

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json .npmrc* ./

# Устанавливаем зависимости
RUN npm install


# Финальный образ
FROM base AS runner

WORKDIR /app

# Копируем исходные файлы
COPY . .
