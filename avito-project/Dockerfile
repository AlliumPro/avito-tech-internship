FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_OLLAMA_BASE_URL=http://localhost:11434
ARG VITE_OLLAMA_MODEL=gemma3:1b
ARG VITE_OLLAMA_TIMEOUT_MS=30000

ENV VITE_OLLAMA_BASE_URL=${VITE_OLLAMA_BASE_URL}
ENV VITE_OLLAMA_MODEL=${VITE_OLLAMA_MODEL}
ENV VITE_OLLAMA_TIMEOUT_MS=${VITE_OLLAMA_TIMEOUT_MS}

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
