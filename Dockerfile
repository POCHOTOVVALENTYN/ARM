# Етап 1: Збірка (Build)
FROM node:20-alpine AS build
WORKDIR /app

# Копіюємо файли залежностей
COPY package.json package-lock.json* bun.lock* ./

# Встановлюємо залежності
RUN npm install

# Копіюємо весь вихідний код фронтенду
COPY . .

# Збираємо продакшен-білд (Vite)
RUN npm run build

# Етап 2: Веб-сервер (Nginx)
FROM nginx:alpine

# Видаляємо стандартну сторінку Nginx
RUN rm -rf /usr/share/nginx/html/*

# Копіюємо зібраний React-додаток з першого етапу
COPY --from=build /app/dist /usr/share/nginx/html

# Копіюємо нашу кастомну конфігурацію Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
