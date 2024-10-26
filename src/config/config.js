require('dotenv').config();

module.exports = {
    // Telegram конфигурация
    BOT_TOKEN: process.env.BOT_TOKEN,
    
    // Конфигурация API провайдеров
    PROVIDERS: {
        GPTUNNEL: {
            API_KEY: process.env.GPTUNNEL_API_KEY,
            API_URL: process.env.GPTUNNEL_API_URL,
            MODELS: {
                O1_MINI: 'o1-mini',
                GPT4O_MINI: 'gpt-4o-mini'
            }
        },
        MISTRAL: {
            API_KEY: process.env.MISTRAL_API_KEY,
            API_URL: 'https://api.mistral.ai/v1/chat/completions',
            MODELS: {
                SMALL: 'mistral-small-latest',
                MEDIUM: 'mistral-medium-latest',
                LARGE: 'mistral-large-latest'
            }
        }
    },
    
    // Настройки базы данных
    DB_PATH: './src/database/database.sqlite',
    
    // Максимальное количество сообщений в истории
    MAX_HISTORY_MESSAGES: 20,

    // Модель по умолчанию
    DEFAULT_MODEL: 'gpt-4o-mini'
};
