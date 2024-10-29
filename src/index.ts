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

dotenv.config();

const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN!);
const userService = new UserService();
const messageService = new MessageService();
const aiHandler = new AIMessageHandler();

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
        await ctx.reply(
            'Добро пожаловать! Для использования бота необходим доступ от администратора.',
            KeyboardService.getMainKeyboard()
        );
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
                await ctx.reply('Сессия создана. История сообщений очищена.');
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
            await ctx.reply(response);
        }
    } catch (error) {
        logger.error('Error processing message:', error);
        await ctx.reply('Произошла ошибка при обработке сообщения.');
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
