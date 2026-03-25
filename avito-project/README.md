# Avito Project (Frontend)

Клиентская часть тестового задания Avito Tech Internship.

Стек:

- React
- TypeScript
- Vite

## Быстрый запуск

### 1. Frontend

```bash
cd avito-project
npm install
npm run dev
```

### 2. Backend (из папки задания)

```bash
cd "../Tech Internships/Frontend/Frontend-trainee-assignment-spring-2026"
npm install --package-lock=false --registry=https://registry.npmjs.org --no-audit --no-fund
npm start
```

Сервер запускается на порту 8080.

## Запуск через Docker Compose

Запуск из корня репозитория (папка выше `avito-project`):

```bash
docker compose up --build
```

После запуска:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Ollama API: `http://localhost:11435`

Если порт `11435` занят, можно выбрать любой свободный:

```bash
OLLAMA_PORT=11500 docker compose up --build
```

По умолчанию подтягивается модель `gemma3:1b` (один раз, потом используется из volume).

Если хотите другую модель:

```bash
OLLAMA_MODEL=llama3 docker compose up --build
```

Остановка:

```bash
docker compose down
```

Полная очистка (включая скачанные модели Ollama):

```bash
docker compose down -v
```

## Проблема с установкой зависимостей и ее решение

При запуске npm install в backend-папке возникала ошибка установки:

- ENOTFOUND для хоста npm.msk.avito.ru
- затем npm мог завершаться сообщением Exit handler never called

Причина:

- В package-lock.json backend-папки были зафиксированы resolved-ссылки на приватный registry npm.msk.avito.ru.
- Этот registry недоступен вне внутренней сети, поэтому npm не мог скачать tarball-пакеты.

Что сделано:

- Установка зависимостей выполнена без использования lockfile и с явным публичным registry:
  npm install --package-lock=false --registry=https://registry.npmjs.org --no-audit --no-fund

Рекомендуемая фиксация:

- Удалить старый package-lock.json в backend-папке и сгенерировать новый через npm install.

## Локальные правки backend для стабильной разработки

В файле Tech Internships/Frontend/Frontend-trainee-assignment-spring-2026/server.ts внесены минимальные технические правки:

- Исправлены импорты на локальные относительные пути:
  - ./items.json
  - ./types.ts
  - ./validation.ts
  - ./utils.ts
- Исправлено чтение порта:
  - используется process.env.PORT
  - fallback на 8080, если порт не задан или некорректен
- В ответ GET /items добавлен id, чтобы из списка можно было надежно переходить на /ads/:id.

Эти правки не меняют бизнес-логику задания и нужны только для корректной локальной работы стенда.
