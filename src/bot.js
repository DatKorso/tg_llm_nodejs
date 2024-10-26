const { Telegraf, session } = require('telegraf');
const config = require('./config/config');
const db = require('./database/db');
const AIService = require('./services/aiService');
const SessionService = require('./services/sessionService');
const Keyboards = require('./keyboards/keyboards');
const { runMigrations } = require('./database/migrations');

const bot = new Telegraf(config.BOT_TOKEN);

// Глобальный обработчик всех обновлений (переместили в начало)
bot.use((ctx, next) => {
    console.log('=== Новое обновление ===');
    console.log('Тип обновления:', ctx.updateType);
    console.log('Контекст:', {
        from: ctx.from,
        message: ctx.message,
        updateType: ctx.updateType
    });
    return next();
});

// Middleware для сессии
bot.use(session());

// Инициализация сессии пользователя
bot.use((ctx, next) => {
    if (!ctx.session) {
        ctx.session = {};
    }
    if (!ctx.session.sessionId) {
        ctx.session.sessionId = null;
    }
    return next();
});

// Находим и перемещаем команду message перед middleware проверки доступа
// Должно быть после adminMiddleware, но до общего middleware проверки доступа

// Middleware для проверки прав администратора (оставляем как есть)
const adminMiddleware = async (ctx, next) => {
    console.log('adminMiddleware: Проверка прав администратора');
    console.log('adminMiddleware: ID пользователя:', ctx.from.id);
    
    const isAdmin = await db.isAdmin(ctx.from.id);
    console.log('adminMiddleware: Результат проверки:', isAdmin);
    
    if (!isAdmin) {
        console.log('adminMiddleware: Отказано в доступе');
        return ctx.reply('У вас нет прав администратора для выполнения этой команды.');
    }
    console.log('adminMiddleware: Доступ разрешен');
    return next();
};

// Команда message (обновляем для поддержки изображений)
bot.command('message', adminMiddleware, async (ctx) => {
    try {
        const userId = ctx.from.id;
        console.log('=== Обработка команды /message ===');
        console.log('ID пользователя:', userId);
        
        // Проверяем права администратора
        const isAdmin = await db.isAdmin(userId);
        console.log('Проверка прав администратора:', isAdmin);
        
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
        console.log('Пользователи для рассылки:', users);
        
        if (users.length === 0) {
            return ctx.reply('Нет пользователей с доступом для рассылки.');
        }
        
        await ctx.reply('Начинаю рассылку...');
        
        let successCount = 0;
        let failCount = 0;

        // Отправляем сообщение каждому пользователю
        for (const user of users) {
            try {
                console.log(`Отправка сообщения пользователю ${user.username || user.user_id}`);
                
                if (photo) {
                    // Получаем файл с наилучшим качеством (последний в массиве)
                    const bestPhoto = photo[photo.length - 1];
                    // Отправляем фото с подписью
                    await ctx.telegram.sendPhoto(user.user_id, bestPhoto.file_id, {
                        caption: messageText
                    });
                } else {
                    // Отправляем только текст
                    await ctx.telegram.sendMessage(user.user_id, messageText);
                }
                
                console.log(`✅ Успешно отправлено пользователю ${user.username || user.user_id}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Ошибка отправки сообщения пользователю ${user.username || user.user_id}:`, error);
                failCount++;
            }
            // Задержка между отправками
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Отправляем статистику администратору
        const statsMessage = `Рассылка завершена:\n✅ Успешно: ${successCount}\n❌ Ошибок: ${failCount}`;
        console.log(statsMessage);
        await ctx.reply(statsMessage);

    } catch (error) {
        console.error('Ошибка при обработке команды /message:', error);
        ctx.reply('Произошла ошибка при выполнении рассылки.');
    }
});

// Middleware для проверки доступа (после команды message)
bot.use(async (ctx, next) => {
    console.log('=== Проверка доступа ===');
    console.log('Тип обновления:', ctx.updateType);
    console.log('Текст сообщения:', ctx.message?.text);
    
    if (ctx.message?.text === '/start') {
        console.log('Пропускаем проверку для команды /start');
        return next();
    }
    
    const userId = ctx.from.id;
    console.log('Проверка доступа для пользователя:', userId);
    
    const access = await db.getUserAccess(userId);
    console.log('Результат проверки доступа:', access);
    
    if (!access) {
        console.log('Отказано в доступе');
        return ctx.reply('У вас нет доступа к боту. Обратитесь к администратору.');
    }
    
    console.log('Доступ разрешен');
    return next();
});

// Команда users для просмотра списка пользоватей
bot.command('users', adminMiddleware, async (ctx) => {
    try {
        console.log('Получена команда /users');
        
        // Проверяем права администратора еще раз с логированием
        const isAdmin = await db.isAdmin(ctx.from.id);
        console.log('Проверка прав администратора:', isAdmin);
        
        const users = await db.db.all(
            'SELECT user_id, username, access, is_admin FROM users ORDER BY created_at DESC'
        );
        console.log('Получен список пользователей:', users);
        
        if (users.length === 0) {
            console.log('Список пользователей пуст');
            return ctx.reply('Пользователей не найдено.');
        }

        const userList = users.map(user => {
            
            const username = user.username || `ID: ${user.user_id}`;
            const status = `${username} - ${user.access ? '✅' : '❌'}${user.is_admin ? ' (админ)' : ''}`;
            console.log('Форматирование пользователя:', status);
            return status;
        }).join('\n');

        console.log('Отправка списка пользователей...');
        await ctx.reply(
            'Список пользователей:\n' +
            '(✅ - есть доступ, ❌ - нет доступа)\n\n' +
            userList
        );
        console.log('Список пользователей отправлен');
    } catch (error) {
        console.error('Ошибка при выполнении команды users:', error);
        await ctx.reply('Произошла ошибка при получении списка пользователей.');
    }
});

// Команда grant для предоставления доступа
bot.command('grant', adminMiddleware, async (ctx) => {
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
        
        // Отправляем уведомление пользователю о предоставлении доступа
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
            console.error('Ошибка при отправке уведомления:', notifyError);
            ctx.reply(
                `✅ Доступ предоставлен пользователю @${username}\n` +
                `⚠️ Не удалось отправить уведомление пользователю.`
            );
        }
    } catch (error) {
        console.error('Ошибка при выполнении команды grant:', error);
        ctx.reply('Произошла ошибка при предоставлении доступа.');
    }
});

// Команда revoke для отзыва доступа
bot.command('revoke', adminMiddleware, async (ctx) => {
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
        ctx.reply(`Достп отозван у пользователя @${username}`);
    } catch (error) {
        console.error('Ошибка при выполнении команды revoke:', error);
        ctx.reply('Произошла ошибка при отзыве доступа.');
    }
});

// Команда start (без проверки доступа)
bot.command('start', async (ctx) => {
    try {
        const userId = ctx.from.id;
        const username = ctx.from.username;

        console.log(`Получена команда /start от пользователя ${userId} (${username})`);

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
        console.error('Ошибка при обработке команды start:', error);
        await ctx.reply(
            '<b>❌ Произошла ошибка при инициализации.</b>\n<i>Попрбуйте позже.</i>',
            { parse_mode: 'HTML' }
        );
    }
});

// Обработка команды new
const newSessionMessage = async (ctx) => {
    ctx.session.sessionId = await SessionService.createNewSession(ctx.from.id);
    await ctx.reply(
        '<b>✨ Создана новая сессия</b>\n<i>Контекст предыдущего разговора очищен.</i>',
        { 
            parse_mode: 'HTML',
            ...Keyboards.getMainKeyboard()
        }
    );
};

bot.command('new', newSessionMessage);
bot.hears('🔄 Новая сессия', newSessionMessage);

// Обработка кнопки "Выбрать модель"
bot.hears('🔧 Выбрать модель', async (ctx) => {
    await ctx.reply(
        'Выберите модель:',
        Keyboards.getModelSelectionKeyboard()
    );
});

// Обработа выбора модели
bot.hears(/^(OPENAI|GPTUNNEL|MISTRAL) - .+$/, async (ctx) => {
    const [provider, modelKey] = ctx.message.text.split(' - ');
    const model = config.PROVIDERS[provider].MODELS[modelKey.replace(provider + ' - ', '')];
    
    await db.updateUserModel(ctx.from.id, model);
    await ctx.reply(
        `Модель успешно изменена на ${model}`,
        Keyboards.getMainKeyboard()
    );
});

// Обработка кнопки "Текущая модель"
bot.hears('ℹ️ Текущая модель', async (ctx) => {
    const user = await db.db.get(
        'SELECT selected_model FROM users WHERE user_id = ?',
        [ctx.from.id]
    );
    await ctx.reply(`Текущая модель: ${user.selected_model}`);
});

// Обработка кнопки "Назад"
bot.hears('◀️ Назад', async (ctx) => {
    await ctx.reply('Главное меню:', Keyboards.getMainKeyboard());
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;

    try {
        console.log('Получено сообщение:', ctx.message.text);

        if (!ctx.session.sessionId) {
            console.log('Создаем новую сессию...');
            ctx.session.sessionId = await SessionService.createNewSession(ctx.from.id);
        }

        const userId = ctx.from.id;
        console.log('ID пользователя:', userId);

        const user = await db.db.get(
            'SELECT selected_model FROM users WHERE user_id = ?',
            [userId]
        );
        console.log('Выбранная модель:', user?.selected_model);

        // Отправлям временное сообщение с HTML-форматированием
        const tempMessage = await ctx.reply(
            '<i>🤔 Генерирую ответ...</i>',
            { parse_mode: 'HTML' }
        );

        // Сохраняем сообщение пользователя
        console.log('Сохраняем сообщение пользователя...');
        await SessionService.addMessage(
            userId,
            ctx.session.sessionId,
            'user',
            ctx.message.text
        );

        // Получаем историю сообщений
        console.log('Получаем историю сообщений...');
        const messages = await SessionService.getSessionMessages(
            userId,
            ctx.session.sessionId
        );
        console.log('История сообщений:', messages);

        // Отправляем запрос к AI
        console.log('Отправляем запрос к AI...');
        const response = await AIService.sendMessage(
            user.selected_model,
            messages
        );
        console.log('Получен ответ от AI:', response);

        // Форматируем ответ в HTML
        const formattedResponse = response.content
            .replace(/`{3}([\s\S]*?)`{3}/g, '<pre>$1</pre>') // код в блоках
            .replace(/`([^`]+)`/g, '<code>$1</code>') // инлайн код
            .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>') // жирный текст
            .replace(/\*([^*]+)\*/g, '<i>$1</i>'); // курсив
            // Убрали замену \n на <br>

        // Сохраняем ответ AI
        console.log('Сохраняем ответ AI...');
        await SessionService.addMessage(
            userId,
            ctx.session.sessionId,
            'assistant',
            response.content
        );

        // Редактируем временное сообщение с HTML-форматированием
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            tempMessage.message_id,
            null,
            formattedResponse,
            { 
                parse_mode: 'HTML',
                disable_web_page_preview: true // Добавляем это для предотвращения предпросмотра ссылок
            }
        );
        
        console.log('Обработка сообщения завершена');
    } catch (error) {
        console.error('Ошибка при обработке сообщения:', error);
        await ctx.reply(
            '<b>❌ Произошла ошибка при обработке вашего сообщения.</b>\n<i>Попробуйте позж.</i>',
            { parse_mode: 'HTML' }
        );
    }
});

// Обработка ошибок
bot.catch((err, ctx) => {
    console.error(`Ошибка для ${ctx.updateType}:`, err);
    ctx.reply('Произошла ошибка при обработке запроса. Попробуйте позже.');
});

// Запуск бота
async function startBot() {
    try {
        await db.connect();
        await runMigrations();
        
        // Выводим содержимое таблицы users для отладки
        const users = await db.db.all('SELECT * FROM users');
        console.log('Содержимое таблицы users:', users);
        
        // Явно регистрируем команды
        await bot.telegram.setMyCommands([
            { command: 'start', description: 'Начать работу с ботом' },
            { command: 'new', description: 'Создать новую сессию' },
            { command: 'message', description: 'Отправить сообщение всем пользователям (только для админов)' },
            { command: 'users', description: 'Показать список пользователей (только для админов)' },
            { command: 'grant', description: 'Предоставить доступ пользователю (только для админов)' },
            { command: 'revoke', description: 'Отозвать доступ у пользователя (только для админв)' }
        ]);
        
        await bot.launch();
        console.log('Бот успешно запущен');
    } catch (error) {
        console.error('Ошибка при запуске бота:', error);
        process.exit(1);
    }
}

startBot();

// Включаем graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Добавьте в начало файла, после создания экземпляра бота
bot.use((ctx, next) => {
    if (ctx.message?.text?.startsWith('/')) {
        console.log('Получена команда:', ctx.message.text);
        console.log('От пользователя:', ctx.from);
    }
    return next();
});

// Добавьте отладочный middleware
bot.use((ctx, next) => {
    console.log('Middleware triggered:', ctx.message?.text);
    return next();
});

