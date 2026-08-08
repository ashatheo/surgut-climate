# klimat86-leads — приём заявок из формы сайта

Cloudflare Worker, который принимает POST-запрос от формы на сайте
(`name`, `phone`, `source`, `details`) и пересылает его в Telegram
через Bot API. Токен бота и chat_id хранятся как секреты Worker'а —
не в коде и не в репозитории.

## Деплой

1. Установить Wrangler (если не установлен):
   ```
   npm install -g wrangler
   ```
2. Войти в аккаунт Cloudflare:
   ```
   wrangler login
   ```
3. Из папки `worker/` задеплоить:
   ```
   wrangler deploy
   ```
4. Задать секреты (значения не попадут в код или git):
   ```
   wrangler secret put TELEGRAM_BOT_TOKEN
   wrangler secret put TELEGRAM_CHAT_ID
   ```
5. После деплоя Wrangler выведет URL вида
   `https://klimat86-leads.<account>.workers.dev` — его нужно
   подставить в константу `LEAD_WORKER_URL` в `index.html`,
   `cleaning.html` и `breezers.html`.

## Как получить токен бота и chat_id

1. В Telegram написать [@BotFather](https://t.me/BotFather),
   отправить `/newbot`, задать имя — в ответ придёт токен вида
   `123456789:AA...`.
2. Написать новому боту любое сообщение (например «привет»).
3. Открыть в браузере
   `https://api.telegram.org/bot<ТОКЕН>/getUpdates` и найти в ответе
   `"chat":{"id": ...}` — это `TELEGRAM_CHAT_ID`.

## Локальная проверка

```
wrangler dev
```

Затем отправить тестовый запрос:
```
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"name":"Тест","phone":"+79998887766","source":"Установка"}'
```
