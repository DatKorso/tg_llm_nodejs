import { Context } from 'telegraf';
import { MyContext } from '../types';
import { logger } from '../utils/logger';
import { BotError, AccessError, AIModelError, DatabaseError } from '../utils/errors';

export async function errorHandler(error: any, ctx: MyContext): Promise<void> {
    let userMessage = 'Произошла внутренняя ошибка.';
    
    if (error instanceof BotError) {
        switch (error.code) {
            case 'ACCESS_ERROR':
                userMessage = 'У вас нет доступа к этой функции.';
                break;
            case 'AI_MODEL_ERROR':
                userMessage = 'Произошла ошибка при обработке запроса к AI модели.';
                break;
            case 'DATABASE_ERROR':
                userMessage = 'Произошла ошибка при работе с базой данных.';
                break;
        }

        logger.error(`${error.name}: ${error.message}`, {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            errorCode: error.code,
            originalError: error.originalError
        });
    } else {
        logger.error('Unexpected error:', error, {
            userId: ctx.from?.id,
            username: ctx.from?.username
        });
    }

    try {
        await ctx.reply(userMessage);
    } catch (replyError) {
        logger.error('Error sending error message to user:', replyError);
    }
}
