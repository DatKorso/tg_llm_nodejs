import 'reflect-metadata';
import { Telegraf } from 'telegraf';
import { session } from 'telegraf/session';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { initDatabase } from './database/connection';
import { MyContext } from './types';
import { UserService } from './services/user.service';
import { MessageService } from './services/message.service';
import { AIMessageHandler } from './services/ai.message.handler';
import { setupAdminCommands } from './commands/admin.commands';
import { setupUserCommands } from './commands/user.commands';
import { KeyboardService } from './services/keyboard.service';
import { errorHandler } from './middlewares/error.handler';
import { AccessError } from './utils/errors';
import { ModelType, getModelName } from './config/models.config';

dotenv.config();

const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN!);
const userService = new UserService();
const messageService = new MessageService();
const aiHandler = new AIMessageHandler();

// Добавим вспомогательную функцию для отправки привет��твенного сообщения с клавиатурой
async function sendWelcomeMessage(ctx: MyContext, message: string) {
    await ctx.reply(
        message,
        KeyboardService.getMainKeyboard()
    );
}

// Инициализация сессии
bot.use(session());

// Добавим обработчик ошибок
bot.catch(errorHandler);

// Middleware для проверки доступа
bot.use(async (ctx, next) => {
    if (!ctx.from) return;

    try {
        let user = await userService.getUserById(ctx.from.id);
        
        if (!user) {
            user = await userService.createUser(ctx.from.id, ctx.from.username);
            logger.info(`New user registered: ${ctx.from.id}`);
            await sendWelcomeMessage(ctx, 'Добро пожаловать! Для использования бота необходим доступ от администратора.');
        }

        if (user.access === 0 && ctx.message && 'text' in ctx.message && !ctx.message.text.startsWith('/start')) {
            throw new AccessError('User does not have access');
        }

        return next();
    } catch (error) {
        return errorHandler(error, ctx);
    }
});

// Настройка команд
setupAdminCommands(bot);
setupUserCommands(bot);

// Обработка команды /start
bot.command('start', async (ctx) => {
    try {
        logger.info(`User ${ctx.from.id} started the bot`);
        await sendWelcomeMessage(ctx, 'Добро пожаловать! Для использования бота необходим доступ от администратора.');
    } catch (error) {
        logger.error('Error in start command:', error);
        await ctx.reply('Произошла ошибка при запуске бота.');
    }
});

// Обработка текстовых сообщений (должна быть последней)
bot.on('text', async (ctx) => {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    try {
        const user = await userService.getUserById(ctx.from.id);
        if (!user || user.access === 0) return;

        const text = ctx.message.text;

        // Проверяем сначала, является ли это системной командой или кнопкой меню
        if (text.startsWith('/') || [
            '🔄 Новый диалог',
            '🔧 Выбрать модель',
            'ℹ️ Текущая модель',
            '❓ Помощь'
        ].includes(text)) {
            // Если это кнопка "Новый диалог", обрабатываем её отдельно
            if (text === '🔄 Новый диалог') {
                await messageService.clearUserHistory(ctx.from.id);
                ctx.session = {
                    modelType: ctx.session?.modelType || 'gpt-4o-mini',
                    messageHistory: []
                };
                await sendWelcomeMessage(ctx, 'Сессия создана. История сообщений очищена.');
                logger.info(`New session started for user ${ctx.from.id}`);
            }
            // Для всех системных команд прерываем обработку здесь
            return;
        }

        // Если дошли до этой точки, значит это обычное сообщение
        // Отправляем индикатор набора текста
        await ctx.sendChatAction('typing');

        // Обрабатываем обычное сообщение
        const response = await aiHandler.handleMessage(
            ctx.from.id,
            text,
            user.preferredModel
        );

        if (response) {
            await ctx.reply(response, KeyboardService.getMainKeyboard());
        }
    } catch (error) {
        logger.error('Error processing message:', error);
        await ctx.reply('Произошла ошибка при обработке сообщения.', KeyboardService.getMainKeyboard());
    }
});

// Добавляем обработчик для кнопки "Выбрать модель"
bot.hears('🔧 Выбрать модель', async (ctx) => {
    try {
        await ctx.reply('Выберите модель:', KeyboardService.getModelSelectionKeyboard());
    } catch (error) {
        logger.error('Error showing model selection:', error);
        await ctx.reply('Произошла ошибка при выборе модели.');
    }
});

// Добавляем обработчик callback-запросов для выбора модели
bot.action(/^model:(.+)$/, async (ctx) => {
    try {
        const modelType = ctx.match[1] as ModelType;
        if (!ctx.from) return;

        await userService.updatePreferredModel(ctx.from.id, modelType);
        const modelName = getModelName(modelType);
        
        await ctx.answerCbQuery(`Выбрана модель: ${modelName}`);
        await ctx.reply(`Модель успешно изменена на ${modelName}`, KeyboardService.getMainKeyboard());
        
        // Обновляем сессию с новой моделью
        ctx.session.modelType = modelType;
        
        logger.info(`User ${ctx.from.id} changed model to ${modelType}`);
    } catch (error) {
        logger.error('Error changing model:', error);
        await ctx.answerCbQuery('Произошла ошибка при выборе модели');
    }
});

// Добавляем обработчик для кнопки "Текущая модель"
bot.hears('ℹ️ Текущая модель', async (ctx) => {
    try {
        if (!ctx.from) return;
        
        const user = await userService.getUserById(ctx.from.id);
        if (!user) return;
        
        const modelName = getModelName(user.preferredModel);
        await ctx.reply(`Текущая модель: ${modelName}`, KeyboardService.getMainKeyboard());
    } catch (error) {
        logger.error('Error showing current model:', error);
        await ctx.reply('Произошла ошибка при получении информации о текущей модели.');
    }
});

// Запуск бота
async function startBot() {
    try {
        await initDatabase();
        await bot.launch();
        logger.info('Bot started successfully');
    } catch (error) {
        logger.error('Error starting bot:', error);
        process.exit(1);
    }
}

startBot();

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
