import { Telegraf } from 'telegraf';
import { MyContext } from '../types';
import { UserService } from '../services/user.service';
import { KeyboardService } from '../services/keyboard.service';
import { logger } from '../utils/logger';
import { ModelType, getModelName } from '../config/models.config';
import { MessageService } from '../services/message.service';

export function setupUserCommands(bot: Telegraf<MyContext>) {
    const userService = new UserService();
    const messageService = new MessageService();

    // Команда создания новой сессии
    async function handleNewSession(ctx: MyContext) {
        try {
            if (!ctx.from) return;
            
            // Очищаем историю сообщений в базе данных
            await messageService.clearUserHistory(ctx.from.id);
            
            // Очищаем сессию
            ctx.session = {
                modelType: ctx.session?.modelType || 'gpt-4o-mini',
                messageHistory: []
            };
            
            await ctx.reply('Сессия создана. История сообщений очищена.');
            logger.info(`New session started for user ${ctx.from.id}`);
        } catch (error) {
            logger.error('Error creating new session:', error);
            await ctx.reply('Произошла ошибка при создании новой сессии.');
        }
    }

    // Регистрируем команду /new
    bot.command('new', handleNewSession);

    // Обработка кнопки "Новый диалог"
    bot.action('new_dialog', handleNewSession);
    bot.hears('🔄 Новый диалог', handleNewSession);

    bot.command('model', async (ctx) => {
        try {
            await ctx.reply(
                'Выберите модель для общения:',
                KeyboardService.getModelSelectionKeyboard()
            );
        } catch (error) {
            logger.error('Error in model command:', error);
            await ctx.reply('Произошла ошибка при выборе модели.');
        }
    });

    // Обработка выбора модели
    bot.action(/model:(.+)/, async (ctx) => {
        try {
            if (!ctx.from) return;

            const modelType = ctx.match[1] as ModelType;
            const user = await userService.getUserById(ctx.from.id);
            
            if (!user) {
                await ctx.answerCbQuery('Пользователь не найден');
                return;
            }

            user.preferredModel = modelType;
            await userService.updateUser(user);

            const modelName = getModelName(modelType);
            await ctx.answerCbQuery(`Выбрана модель: ${modelName}`);
            await ctx.editMessageText(`Текущая модель: ${modelName}`);
        } catch (error) {
            logger.error('Error in model selection:', error);
            await ctx.answerCbQuery('Произошла ошибка при выборе модели');
        }
    });

    bot.hears('🔧 Выбрать модель', async (ctx) => {
        await ctx.reply(
            'Выберите модель для общения:',
            KeyboardService.getModelSelectionKeyboard()
        );
    });

    bot.hears('ℹ️ Текущая модель', async (ctx) => {
        try {
            if (!ctx.from) return;

            const user = await userService.getUserById(ctx.from.id);
            if (!user) {
                await ctx.reply('Пользователь не найден');
                return;
            }

            const modelName = getModelName(user.preferredModel as ModelType);
            await ctx.reply(`Текущая модель: ${modelName}`);
        } catch (error) {
            logger.error('Error getting current model:', error);
            await ctx.reply('Произошла ошибка при получении информации о модели.');
        }
    });

    bot.hears('❓ Помощь', async (ctx) => {
        const helpText = `
Доступные команды:
/start - Начать работу с ботом
/new - Начать новый диалог
/model - Выбрать модель для общения

Используйте кнопки меню для быстрого доступа к функциям.
        `;
        await ctx.reply(helpText);
    });
}
