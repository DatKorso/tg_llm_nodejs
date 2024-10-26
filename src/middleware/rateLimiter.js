const rateLimit = require('telegraf-ratelimit');

const limitConfig = {
    window: 60000, // 1 минута
    limit: 20,     // максимум 20 сообщений
    onLimitExceeded: (ctx) => {
        ctx.reply('Пожалуйста, подождите минуту перед отправкой новых сообщений.');
    }
};

module.exports = rateLimit(limitConfig);
