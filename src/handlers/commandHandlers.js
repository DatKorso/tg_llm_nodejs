const db = require('../database/db');
const SessionService = require('../services/sessionService');
const Keyboards = require('../keyboards/keyboards');
const logger = require('../utils/logger');
const config = require('../config/config');

async function handleStart(ctx) {
    try {
        const userId = ctx.from.id;
        const username = ctx.from.username;

        await db.createUser(userId, username);
        ctx.session.sessionId = await SessionService.createNewSession(userId);

        await ctx.reply(
            '<b>👋 Добро пожаловать!</b>\n\n<i>Ваша заявка на доступ зарегистрирована. Ожидайте подтверждения от администратора.</i>',
            { 
                parse_mode: 'HTML',
                ...Keyboards.getMainKeyboard()
            }
        );
    } catch (error) {
        logger.error('Ошибка при обработке команды start:', error);
        await ctx.reply('<b>❌ Произошла ошибка при инициализации.</b>', { parse_mode: 'HTML' });
    }
}

async function handleNew(ctx) {
    try {
        ctx.session.sessionId = await SessionService.createNewSession(ctx.from.id);
        await ctx.reply(
            '<b>✨ Создана новая сессия</b>\n<i>Контекст предыдущего разговора очищен.</i>',
            { 
                parse_mode: 'HTML',
                ...Keyboards.getMainKeyboard()
            }
        );
    } catch (error) {
        logger.error('Ошибка при создании новой сессии:', error);
        await ctx.reply('Произошла ошибка при создании новой сессии.');
    }
}

async function handleCurrentModel(ctx) {
    try {
        const user = await db.db.get(
            'SELECT selected_model FROM users WHERE user_id = ?',
            [ctx.from.id]
        );
        
        await ctx.reply(
            `<b>🤖 Текущая модель:</b>\n<code>${user.selected_model || 'Не выбрана'}</code>`,
            { parse_mode: 'HTML' }
        );
    } catch (error) {
        logger.error('Ошибка при получении текущей модели:', error);
        await ctx.reply('Произошла ошибка при получении информации о текущей модели.');
    }
}

async function handleModelSelection(ctx) {
    try {
        await ctx.reply(
            '<b>🔧 Выберите модель:</b>',
            { 
                parse_mode: 'HTML',
                ...Keyboards.getModelSelectionKeyboard()
            }
        );
    } catch (error) {
        logger.error('Ошибка при показе меню выбора модели:', error);
        await ctx.reply('Произошла ошибка при открытии меню выбора модели.');
    }
}

async function handleModelChange(ctx) {
    try {
        const messageText = ctx.message.text;
        const [provider, modelKey] = messageText.split(' - ');
        
        // Получаем значение модели из конфига
        const model = config.PROVIDERS[provider].MODELS[modelKey];
        
        // Обновляем модель в БД
        await db.updateUserModel(ctx.from.id, model);
        
        await ctx.reply(
            `<b>✅ Модель успешно изменена</b>\n<code>${model}</code>`,
            { 
                parse_mode: 'HTML',
                ...Keyboards.getMainKeyboard()
            }
        );
    } catch (error) {
        logger.error('Ошибка при смене модели:', error);
        await ctx.reply('Произошла ошибка при смене модели.');
    }
}

async function handleBack(ctx) {
    await ctx.reply(
        '<b>📋 Главное меню</b>',
        { 
            parse_mode: 'HTML',
            ...Keyboards.getMainKeyboard()
        }
    );
}

// Другие обработчики команд...

module.exports = {
    handleStart,
    handleNew,
    handleCurrentModel,
    handleModelSelection,
    handleModelChange,
    handleBack
};
