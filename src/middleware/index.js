const logger = require('../utils/logger');
const db = require('../database/db');

// Логирование всех обновлений
const loggingMiddleware = (ctx, next) => {
    logger.info('=== Новое обновление ===', {
        updateType: ctx.updateType,
        from: {
            id: ctx.from?.id,
            username: ctx.from?.username,
            first_name: ctx.from?.first_name
        },
        message: {
            text: ctx.message?.text,
            type: ctx.message?.type
        }
    });
    return next();
};

// Инициализация сессии
const sessionMiddleware = (ctx, next) => {
    if (!ctx.session) {
        ctx.session = {};
    }
    if (!ctx.session.sessionId) {
        ctx.session.sessionId = null;
    }
    return next();
};

// Проверка прав администратора
const adminMiddleware = async (ctx, next) => {
    const isAdmin = await db.isAdmin(ctx.from.id);
    if (!isAdmin) {
        return ctx.reply('У вас нет прав администратора для выполнения этой команды.');
    }
    return next();
};

// Проверка доступа к боту
const accessMiddleware = async (ctx, next) => {
    // Пропускаем команду start
    if (ctx.message?.text === '/start') {
        return next();
    }

    const userId = ctx.from.id;
    const access = await db.getUserAccess(userId);
    
    if (!access) {
        return ctx.reply('У вас нет доступа к боту. Обратитесь к администратору.');
    }
    
    return next();
};

module.exports = {
    loggingMiddleware,
    sessionMiddleware,
    adminMiddleware,
    accessMiddleware
};
