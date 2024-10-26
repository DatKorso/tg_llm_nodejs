const bot = require('./bot');
const db = require('./database/db');
const { runMigrations } = require('./database/migrations');
const logger = require('./utils/logger');

async function startBot() {
    try {
        await db.connect();
        await runMigrations();
        await bot.launch();
        logger.info('Бот успешно запущен');
    } catch (error) {
        logger.error('Ошибка при запуске бота:', error);
        process.exit(1);
    }
}

startBot();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
