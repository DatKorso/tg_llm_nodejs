const db = require('../database/db');
const logger = require('../utils/logger');

async function handleMessage(ctx) {
    try {
        const userId = ctx.from.id;
        logger.info('Обработка команды /message', { userId });
        
        // Получаем текст сообщения
        const messageText = ctx.message.text.replace(/^\/message\s+/, '');
        
        // Проверяем, есть ли reply на сообщение с фото
        const replyToMessage = ctx.message.reply_to_message;
        const photo = replyToMessage?.photo;
        
        if (!messageText && !photo) {
            return ctx.reply(
                'Для отправки сообщения:\n' +
                '1. Просто текст: /message Ваше сообщение\n' +
                '2. Текст с картинкой: ответьте на сообщение с картинкой командой /message Ваше сообщение'
            );
        }

        // Получаем всех пользователей с доступом
        const users = await db.db.all('SELECT user_id, username FROM users WHERE access = 1');
        logger.info('Пользователи для рассылки:', { count: users.length });
        
        if (users.length === 0) {
            return ctx.reply('Нет пользователей с доступом для рассылки.');
        }
        
        await ctx.reply('Начинаю рассылку...');
        
        let successCount = 0;
        let failCount = 0;

        // Отправляем сообщение каждому пользователю
        for (const user of users) {
            try {
                if (photo) {
                    const bestPhoto = photo[photo.length - 1];
                    await ctx.telegram.sendPhoto(user.user_id, bestPhoto.file_id, {
                        caption: messageText
                    });
                } else {
                    await ctx.telegram.sendMessage(user.user_id, messageText);
                }
                successCount++;
            } catch (error) {
                logger.error('Ошибка отправки сообщения:', {
                    userId: user.user_id,
                    error: error.message
                });
                failCount++;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const statsMessage = `Рассылка завершена:\n✅ Успешно: ${successCount}\n❌ Ошибок: ${failCount}`;
        await ctx.reply(statsMessage);

    } catch (error) {
        logger.error('Ошибка при выполнении команды message:', error);
        ctx.reply('Произошла ошибка при отправке сообщения.');
    }
}

async function handleUsers(ctx) {
    try {
        logger.info('Получена команда /users');
        
        const users = await db.db.all(
            'SELECT user_id, username, access, is_admin FROM users ORDER BY created_at DESC'
        );
        
        if (users.length === 0) {
            return ctx.reply('Пользователей не найдено.');
        }

        const userList = users.map(user => {
            const username = user.username || `ID: ${user.user_id}`;
            return `${username} - ${user.access ? '✅' : '❌'}${user.is_admin ? ' (админ)' : ''}`;
        }).join('\n');

        await ctx.reply(
            'Список пользователей:\n' +
            '(✅ - есть доступ, ❌ - нет доступа)\n\n' +
            userList
        );
    } catch (error) {
        logger.error('Ошибка при выполнении команды users:', error);
        await ctx.reply('Произошла ошибка при получении списка пользователей.');
    }
}

async function handleGrant(ctx) {
    try {
        const username = ctx.message.text.split(' ')[1];
        if (!username) {
            return ctx.reply('Укажите имя пользователя: /grant username');
        }

        const user = await db.getUserByUsername(username);
        if (!user) {
            return ctx.reply(`Пользователь @${username} не найден.`);
        }

        if (user.access === 1) {
            return ctx.reply(`Пользователь @${username} уже имеет доступ.`);
        }

        await db.updateUserAccess(user.user_id, 1);
        
        try {
            await ctx.telegram.sendMessage(
                user.user_id,
                '<b>🎉 Поздравляем!</b>\n\n' +
                '<i>Администратор предоставил вам доступ к боту.</i>\n' +
                'Теперь вы можете начать общение.',
                { parse_mode: 'HTML' }
            );
            ctx.reply(`✅ Доступ предоставлен пользователю @${username}\nУведомление успешно отправлено.`);
        } catch (notifyError) {
            logger.error('Ошибка при отправке уведомления:', notifyError);
            ctx.reply(
                `✅ Доступ предоставлен пользователю @${username}\n` +
                `⚠️ Не удалось отправить уведомление пользователю.`
            );
        }
    } catch (error) {
        logger.error('Ошибка при выполнении команды grant:', error);
        ctx.reply('Произошла ошибка при предоставлении доступа.');
    }
}

async function handleRevoke(ctx) {
    try {
        const username = ctx.message.text.split(' ')[1];
        if (!username) {
            return ctx.reply('Укажите имя пользователя: /revoke username');
        }

        const user = await db.getUserByUsername(username);
        if (!user) {
            return ctx.reply(`Пользователь @${username} не найден.`);
        }

        if (user.access === 0) {
            return ctx.reply(`Пользователь @${username} уже не имеет доступа.`);
        }

        await db.updateUserAccess(user.user_id, 0);
        ctx.reply(`✅ Доступ отозван у пользователя @${username}`);
    } catch (error) {
        logger.error('Ошибка при выполнении команды revoke:', error);
        ctx.reply('Произошла ошибка при отзыве доступа.');
    }
}

module.exports = {
    handleMessage,
    handleUsers,
    handleGrant,
    handleRevoke
};
