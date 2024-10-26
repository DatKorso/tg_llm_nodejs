# AI Telegram Bot

Многофункциональный Telegram бот для взаимодействия с различными AI моделями (GPTunnel и Mistral).

## 🚀 Возможности

- 🤖 Поддержка нескольких AI моделей:
  - GPTunnel: gpt-4o-mini, o1-mini
  - Mistral: mistral-tiny, mistral-small, mistral-medium
- 👥 Система управления доступом:
  - Администрирование пользователей
  - Предоставление/отзыв доступа
- 📨 Система рассылки:
  - Отправка текстовых сообщений
  - Отправка изображений с текстом
- 💾 Сохранение контекста диалога
- 🔄 Возможность создания новых сессий
- 📊 Логирование всех действий

## 🛠 Технологии

- Node.js
- Telegraf.js
- SQLite
- Winston (логирование)
- Axios

## ⚙️ Установка

1. Клонируйте репозиторий:
```
git clone https://github.com/yourusername/ai-telegram-bot.git
cd ai-telegram-bot
```
2. Установите зависимости:
```
bash
npm install
```
3. Создайте файл `.env` в корневой директории:
```
BOT_TOKEN=your_telegram_bot_token
ADMIN_ID=your_telegram_id
GPTunnel Configuration
GPTUNNEL_API_KEY=your_gptunnel_api_key
GPTUNNEL_API_URL=https://api.gptunnel.com
Mistral Configuration
MISTRAL_API_KEY=your_mistral_api_key
MISTRAL_API_URL=https://api.mistral.ai
```
4. Запустите бота:
```
bash
npm start
```
5. Для разработки используйте:
```
bash
npm run dev
```

## 📝 Команды бота

### Пользовательские команды
- `/start` - Начать работу с ботом
- `/new` - Создать новую сессию

### Административные команды
- `/users` - Показать список пользователей
- `/grant username` - Предоставить доступ пользователю
- `/revoke username` - Отозвать доступ у пользователя
- `/message` - Отправить сообщение всем пользователям
  - Текст: `/message Ваше сообщение`
  - Фото с текстом: отправьте фото с подписью `/message Ваше сообщение`
  - Только фото: отправьте фото с подписью `/message`

## 🎯 Особенности реализации

- Модульная архитектура
- Middleware для проверки прав доступа
- Система логирования действий
- Обработка ошибок
- SQLite для хранения данных
- Поддержка сессий для сохранения контекста

## 📄 Структура проекта
```
src/
├── bot.js # Основной файл бота
├── index.js # Точка входа
├── config/ # Конфигурация
├── database/ # База данных и миграции
├── handlers/ # Обработчики команд
├── keyboards/ # Клавиатуры
├── middleware/ # Middleware
├── services/ # Сервисы (AI, сессии)
└── utils/ # Утилиты
```

## 🔧 Конфигурация

Основные настройки находятся в `src/config/config.js`:
- Настройки бота (префикс, язык, таймауты)
- Конфигурация провайдеров AI
- Параметры логирования
- Настройки безопасности
- Параметры уведомлений

## 📦 База данных

Проект использует SQLite для хранения:
- Информации о пользователях
- Сессий диалогов
- Настроек пользователей
- Статистики использования

## 📞 Контакты

Если у вас есть вопросы или предложения, создайте Issue в репозитории.

## 📄 Лицензия

MIT License. См. файл [LICENSE](LICENSE) для деталей.