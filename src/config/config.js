require('dotenv').config();

module.exports = {
    // Telegram конфигурация
    BOT_TOKEN: process.env.BOT_TOKEN,
    ADMIN_ID: process.env.ADMIN_ID,
    
    // Конфигурация API провайдеров
    PROVIDERS: {
        GPTUNNEL: {
            NAME: 'GPTunnel',
            API_KEY: process.env.GPTUNNEL_API_KEY,
            API_URL: process.env.GPTUNNEL_API_URL || 'https://api.gptunnel.com',
            MODELS: {
                'GPT4o-MINI': 'gpt-4o-mini',
                'O1-MINI': 'o1-mini'
            }
        },
        MISTRAL: {
            NAME: 'Mistral',
            API_KEY: process.env.MISTRAL_API_KEY,
            API_URL: process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions',
            MODELS: {
                'MISTRAL-SMALL': 'mistral-small-latest',
                'MISTRAL-MEDIUM': 'mistral-medium-latest',
                'MISTRAL-LARGE': 'mistral-large-latest'
            }
        }
    },
    
    // Настройки базы данных
    DB_PATH: './src/database/database.sqlite',
    
    // Максимальное количество сообщений в истории
    MAX_HISTORY_MESSAGES: 20,

    // Модель по умолчанию
    DEFAULT_MODEL: 'mistral-small-latest'
};
