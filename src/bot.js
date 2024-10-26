const { Telegraf, session } = require('telegraf');
const config = require('./config/config');
const commandHandlers = require('./handlers/commandHandlers');
const adminHandlers = require('./handlers/adminHandlers');
const middleware = require('./middleware');
const logger = require('./utils/logger');
const AIService = require('./services/aiService');
const SessionService = require('./services/sessionService');
const db = require('./database/db'); // Добавляем импорт базы данных

const bot = new Telegraf(config.BOT_TOKEN);

// Middleware (в правильном порядке)
bot.use(session());
bot.use(middleware.loggingMiddleware);
bot.use(middleware.sessionMiddleware);

// Команда start (должна быть доступна всем)
bot.command('start', commandHandlers.handleStart);

// Административные команды
bot.command('message', middleware.adminMiddleware, adminHandlers.handleMessage);
// Добавляем обработчик фото с командой message
bot.on('photo', async (ctx) => {
    const caption = ctx.message?.caption;
    if (caption?.startsWith('/message')) {
        return adminHandlers.handleMessage(ctx);
    }
});

bot.command('grant', middleware.adminMiddleware, adminHandlers.handleGrant);
bot.command('users', middleware.adminMiddleware, adminHandlers.handleUsers);
bot.command('revoke', middleware.adminMiddleware, adminHandlers.handleRevoke);

// Middleware проверки доступа (после админских команд)
bot.use(middleware.accessMiddleware);

// Обычные кманды (доступны пользователям с доступом)
bot.command('new', commandHandlers.handleNew);
bot.hears('🔄 Новая сессия', commandHandlers.handleNew);
bot.hears('ℹ️ Текущая модель', commandHandlers.handleCurrentModel);
bot.hears('🔧 Выбрать модель', commandHandlers.handleModelSelection);
bot.hears('◀️ Назад', commandHandlers.handleBack);

// Обработка выбора модели
bot.hears(/^(GPTUNNEL|MISTRAL) - .+$/, commandHandlers.handleModelChange);

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
    // Пропускаем команды
    if (ctx.message.text.startsWith('/')) return;

    try {
        logger.info('Получено сообщение:', {
            text: ctx.message.text,
            from: ctx.from.id
        });

        // Проверяем наличие сессии
        if (!ctx.session.sessionId) {
            logger.info('Создаем новую сессию...');
            ctx.session.sessionId = await SessionService.createNewSession(ctx.from.id);
        }

        // Получаем модель пользователя из базы данных
        const user = await db.getUserModel(ctx.from.id); // Изменяем метод получения модели
        logger.info('Выбранная модель:', user?.selected_model);

        // Отправляем временное сообщение
        const tempMessage = await ctx.reply(
            '<i>🤔 Генерирую ответ...</i>',
            { parse_mode: 'HTML' }
        );

        // Сохраняем сообщение пользователя
        await SessionService.addMessage(
            ctx.from.id,
            ctx.session.sessionId,
            'user',
            ctx.message.text
        );

        // Получаем историю сообщений
        const messages = await SessionService.getSessionMessages(
            ctx.from.id,
            ctx.session.sessionId
        );

        // Отправляем запрос к AI
        const response = await AIService.sendMessage(
            user?.selected_model || config.DEFAULT_MODEL,
            messages
        );

        // Форматируем ответ
        const formattedResponse = response.content
            .replace(/`{3}([\s\S]*?)`{3}/g, '<pre>$1</pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
            .replace(/\*([^*]+)\*/g, '<i>$1</i>');

        // Сохраняем ответ AI
        await SessionService.addMessage(
            ctx.from.id,
            ctx.session.sessionId,
            'assistant',
            response.content
        );

        // Редактируем временное сообщение
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            tempMessage.message_id,
            null,
            formattedResponse,
            { 
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }
        );
    } catch (error) {
        logger.error('Ошибка при обработке сообщения:', error);
        await ctx.reply(
            '<b>❌ Произошла ошибка при обработке вашего сообщения.</b>\n' +
            '<i>Попробуйте позже или создайте новую сессию.</i>',
            { parse_mode: 'HTML' }
        );
    }
});

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
