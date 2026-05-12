# RelayPost backend scaffold

Минимальная заготовка API без внешних зависимостей. Ее можно запустить отдельно и
позже заменить in-memory хранилище на базу данных, OAuth-интеграции и очереди публикаций.

## Запуск

```bash
node server.js
```

Сервер стартует на `http://localhost:4000`.

## Маршруты

- `POST /api/auth/login` - вход по email и паролю.
- `POST /api/auth/register` - регистрация пользователя.
- `POST /api/auth/forgot-password` - запрос на восстановление пароля.
- `GET /api/integrations` - список доступных интеграций.
- `PATCH /api/integrations/:id` - подключить или отключить интеграцию.
- `POST /api/drafts` - сохранить черновик со всеми версиями текста.
- `POST /api/publish` - поставить публикацию в очередь.

Все данные пока живут в памяти процесса.
