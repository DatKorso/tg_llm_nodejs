module.exports = {
    // Настройки бота
    botSettings: {
        prefix: '!',
        defaultLanguage: 'ru',
        timeout: 5000
    },
    
    // Настройки логирования
    logging: {
        enabled: true,
        level: 'info',
        file: 'bot.log'
    },
    
    // Добавляем новые настройки
    security: {
        rateLimit: {
            window: 60000,
            limit: 20
        },
        maxMessageLength: 4096,
        allowedFileTypes: ['photo', 'document']
    },
    
    notifications: {
        adminErrors: true,
        userAccessChange: true
    },
    
    ai: {
        maxContextLength: 4000,
        temperatureDefault: 0.3,
        retryAttempts: 3
    }
};
