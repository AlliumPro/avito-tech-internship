# Avito Tech Internship - AI Assistant for Ads

Тестовое приложение личного кабинета продавца: список объявлений, просмотр карточки, редактирование и AI-помощник для описания/оценки цены.

## Быстрый старт

### Option A: Docker Compose (рекомендуется)

Из корня репозитория:

```bash
docker compose up --build -d
```

Доступно после старта:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Ollama API (host): `http://localhost:11435`

Остановка:

```bash
docker compose down
```

### Option B: Local run

1. Ollama:

```bash
ollama pull gemma3:1b
ollama serve
```

2. Backend:

```bash
cd server
npm install
npm start
```

Если `8080` занят:

```bash
cd server
npm run start:8081
```

3. Frontend:

```bash
cd avito-project
npm install
npm run dev
```

Перед запуском frontend создайте `.env` из `.env.example`:

PowerShell (Windows):

```powershell
Copy-Item .env.example .env
```

bash/zsh:

```bash
cp .env.example .env
```

Если backend на `8081`, укажите в `avito-project/.env`:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8081
```

## Stack

- Frontend: React 19, TypeScript, Vite, react-router-dom
- Backend: Fastify, Zod
- AI: Ollama (`POST /api/generate`), вызов напрямую из frontend
- Infra: Docker Compose (frontend + backend + ollama + ollama-init)

## Repository Structure

- `avito-project` - frontend
- `server` - backend
- `docker-compose.yml` - инфраструктурный запуск
- `Frontend-trainee-assignment-spring-2026.md` - исходные требования

## Environment Variables

Frontend (`avito-project/.env`):

- `VITE_API_BASE_URL` (default `http://127.0.0.1:8080`)
- `VITE_OLLAMA_BASE_URL` (default `http://127.0.0.1:11434`)
- `VITE_OLLAMA_MODEL` (default `gemma3:1b`)
- `VITE_OLLAMA_TIMEOUT_MS` (default `30000`)

Backend:

- `PORT` (default `8080`)
- `HOST` (default `0.0.0.0`)
- `CORS_ORIGINS` (default `http://localhost:5173,http://127.0.0.1:5173`)

## Requirement Status

Источник: `Frontend-trainee-assignment-spring-2026.md`.

### Technical

- Node.js v20+, React, TypeScript, react-router-dom: **Выполнено**
- Работа с предоставленным backend API: **Выполнено**
- Самостоятельная LLM-интеграция: **Выполнено** (Ollama)
- README с инструкцией запуска: **Выполнено**

### Functional

- `/ads`: поиск, сортировка, фильтры, reset, пагинация по 10, переход в карточку, grid/list: **Выполнено**
- `/ads/:id`: полная карточка, блок доработок, переходы: **Выполнено**
- `/ads/:id/edit`: форма, динамические параметры, AI-функции, apply, save/cancel, draft в localStorage: **Выполнено**
- Состояния загрузки и ошибок: **Выполнено**

### Extra (starred)

- Docker Compose: **Выполнено**
- Abort запросов при переходах: **Выполнено**
- Unit tests: **небольшая часть** (серверная логика и схемы)

## Validation

Проверено командами:

- Frontend: `npm run lint`, `npm run build`
- Server: `npm test`
