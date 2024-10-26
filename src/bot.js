const { Telegraf, session } = require('telegraf');
const config = require('./config/config');
const commandHandlers = require('./handlers/commandHandlers');
const adminHandlers = require('./handlers/adminHandlers');
const middleware = require('./middleware');
const logger = require('./utils/logger');

const bot = new Telegraf(config.BOT_TOKEN);

// Middleware (в правильном порядке)
bot.use(session());
bot.use(middleware.loggingMiddleware);
bot.use(middleware.sessionMiddleware);

// Команда start (должна быть доступна всем)
bot.command('start', commandHandlers.handleStart);

// Административные команды
bot.command('message', middleware.adminMiddleware, adminHandlers.handleMessage);
bot.command('grant', middleware.adminMiddleware, adminHandlers.handleGrant);
bot.command('users', middleware.adminMiddleware, adminHandlers.handleUsers);
bot.command('revoke', middleware.adminMiddleware, adminHandlers.handleRevoke);

// Middleware проверки доступа (после админских команд)
bot.use(middleware.accessMiddleware);

// Обычные к��манды (доступны пользователям с доступом)
bot.command('new', commandHandlers.handleNew);
bot.hears('🔄 Новая сессия', commandHandlers.handleNew);
bot.hears('ℹ️ Текущая модель', commandHandlers.handleCurrentModel);
bot.hears('🔧 Выбрать модель', commandHandlers.handleModelSelection);
bot.hears('◀️ Назад', commandHandlers.handleBack);

// Обработка выбора модели
bot.hears(/^(GPTUNNEL|MISTRAL) - .+$/, commandHandlers.handleModelChange);

// Обработка ошибок
bot.catch((err, ctx) => {
    logger.error('Ошибка в боте:', {
        error: err.message,
        stack: err.stack,
        update: ctx.update,
        user: ctx.from
    });
    
    ctx.reply('Произошла ошибка при обработке запроса. Попробуйте позже.');
});

module.exports = bot;
