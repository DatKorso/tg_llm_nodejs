const db = require('./db');

async function runMigrations() {
    try {
        console.log('Запуск миграций...');

        // Проверяем существование колонки is_admin
        const tableInfo = await db.db.all("PRAGMA table_info(users)");
        const hasIsAdmin = tableInfo.some(column => column.name === 'is_admin');

        if (!hasIsAdmin) {
            console.log('Добавление колонки is_admin...');
            await db.db.run(`
                ALTER TABLE users 
                ADD COLUMN is_admin INTEGER DEFAULT 0
            `);
            console.log('Колонка is_admin успешно добавлена');
        }

        // Создаем индекс для username, если его нет
        await db.db.run(`
            CREATE INDEX IF NOT EXISTS idx_users_username 
            ON users(username)
        `);

        console.log('Миграции успешно выполнены');
    } catch (error) {
        console.error('Ошибка при выполнении миграций:', error);
        throw error;
    }
}

module.exports = { runMigrations };
