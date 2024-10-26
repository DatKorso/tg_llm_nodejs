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

## 🚀 Деплой

### 1. Подготовка сервера

1. Подключитесь к вашему серверу:
```bash
ssh username@your_server_ip
```

2. Установите необходимые зависимости:
```bash
sudo apt update
sudo apt install nodejs npm git
```

3. Установите PM2 для управления процессом:
```bash
sudo npm install -g pm2
```

### 2. Настройка проекта

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/ai-telegram-bot.git
cd ai-telegram-bot
```

2. Установите зависимости:
```bash
npm install --production
```

3. Создайте и настройте файл окружения:
```bash
nano .env
```

Добавьте необходимые переменные:
```
BOT_TOKEN=your_telegram_bot_token
ADMIN_ID=your_telegram_id

# GPTunnel Configuration
GPTUNNEL_API_KEY=your_gptunnel_api_key
GPTUNNEL_API_URL=https://api.gptunnel.com

# Mistral Configuration
MISTRAL_API_KEY=your_mistral_api_key
MISTRAL_API_URL=https://api.mistral.ai
```

### 3. Запуск бота

1. Запустите бота через PM2:
```bash
pm2 start src/index.js --name ai-bot
```

2. Настройте автозапуск:
```bash
pm2 startup
pm2 save
```

### 4. Мониторинг

- Просмотр логов:
```bash
pm2 logs ai-bot
```

- Статус бота:
```bash
pm2 status
```

- Перезапуск бота:
```bash
pm2 restart ai-bot
```

### 5. Обновление бота

1. Остановите бота:
```bash
pm2 stop ai-bot
```

2. Получите обновления:
```bash
git pull origin main
```

3. Обновите зависимости:
```bash
npm install --production
```

4. Запустите бота:
```bash
pm2 start ai-bot
```

### 6. Рекомендации по безопасности

1. Настройте файрвол:
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
```

2. Настройте регулярное резервное копирование базы данных:
```bash
# Создайте скрипт для бэкапа
mkdir -p ~/backups
cp src/database/database.sqlite ~/backups/database-$(date +%Y%m%d).sqlite
```

3. Добавьте задачу в crontab:
```bash
crontab -e
# Добавьте строку для ежедневного бэкапа в 00:00
0 0 * * * cp /path/to/bot/src/database/database.sqlite ~/backups/database-$(date +%Y%m%d).sqlite
```

### 7. Мониторинг и оповещения

Настройте оповещения о статусе бота через PM2:
```bash
pm2 install pm2-telegram
```

Конфигурация в `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'ai-bot',
    script: 'src/index.js',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
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

