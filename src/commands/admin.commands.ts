import { Telegraf } from 'telegraf';
import { MyContext } from '../types';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';

export function setupAdminCommands(bot: Telegraf<MyContext>) {
    const userService = new UserService();

    bot.command('grant', async (ctx) => {
        try {
            if (!ctx.from || !ctx.message) return;

            const adminUser = await userService.getUserById(ctx.from.id);
            if (!adminUser || adminUser.access !== 2) {
                await ctx.reply('У вас нет прав администратора.');
                return;
            }

            const args = ctx.message.text.split(' ');
            if (args.length !== 2) {
                await ctx.reply('Использование: /grant user_id');
                return;
            }

            const targetUserId = parseInt(args[1]);
            await userService.updateAccess(targetUserId, 1);
            await ctx.reply(`Доступ выдан пользователю ${targetUserId}`);
            logger.info(`Access granted to user ${targetUserId} by admin ${ctx.from.id}`);
        } catch (error) {
            logger.error('Error in grant command:', error);
            await ctx.reply('Произошла ошибка при выдаче доступа.');
        }
    });

    bot.command('revoke', async (ctx) => {
        try {
            if (!ctx.from || !ctx.message) return;

            const adminUser = await userService.getUserById(ctx.from.id);
            if (!adminUser || adminUser.access !== 2) {
                await ctx.reply('У вас нет прав администратора.');
                return;
            }

            const args = ctx.message.text.split(' ');
            if (args.length !== 2) {
                await ctx.reply('Использование: /revoke user_id');
                return;
            }

            const targetUserId = parseInt(args[1]);
            await userService.updateAccess(targetUserId, 0);
            await ctx.reply(`Доступ отозван у пользователя ${targetUserId}`);
            logger.info(`Access revoked from user ${targetUserId} by admin ${ctx.from.id}`);
        } catch (error) {
            logger.error('Error in revoke command:', error);
            await ctx.reply('Произошла ошибка при отзыве доступа.');
        }
    });
}
