require('dotenv').config();

module.exports = {
    // Telegram конфигурация
    BOT_TOKEN: process.env.BOT_TOKEN,
    ADMIN_ID: process.env.ADMIN_ID,
    
    // Конфигурация API провайдеров
    PROVIDERS: {
        GPTUNNEL: {
            NAME: 'GPTunnel',
            MODELS: {
                'GPT4o-MINI': 'gpt-4o-mini',
                'O1-MINI': 'o1-mini'
            }
        },
        MISTRAL: {
            NAME: 'Mistral',
            MODELS: {
                'MISTRAL-TINY': 'mistral-tiny',
                'MISTRAL-SMALL': 'mistral-small',
                'MISTRAL-MEDIUM': 'mistral-medium'
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
