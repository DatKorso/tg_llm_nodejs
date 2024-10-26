const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

class Database {
    constructor() {
        this.db = null;
    }

    async connect() {
        try {
            // Убедимся, что директория существует
            const dbDir = path.dirname(config.DB_PATH);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = await open({
                filename: config.DB_PATH,
                driver: sqlite3.Database
            });

            // Инициализация схемы базы данных
            const schema = fs.readFileSync(
                path.join(__dirname, 'schema.sql'),
                'utf8'
            );
            
            await this.db.exec(schema);
            console.log('База данных успешно инициализирована');
        } catch (error) {
            console.error('Ошибка при инициализации базы данных:', error);
            throw error;
        }
    }

    async getUserAccess(userId) {
        try {
            const user = await this.db.get(
                'SELECT access FROM users WHERE user_id = ?',
                userId
            );
            return user ? user.access : 0;
        } catch (error) {
            console.error('Ошибка при получении доступа пользователя:', error);
            return 0;
        }
    }

    async createUser(userId, username) {
        try {
            // Проверяем, существует ли пользователь
            const existingUser = await this.db.get(
                'SELECT user_id FROM users WHERE user_id = ?',
                userId
            );

            if (!existingUser) {
                // Если пользователя нет, создаем нового
                await this.db.run(
                    `INSERT INTO users (user_id, username, access, selected_model) 
                     VALUES (?, ?, ?, ?)`,
                    [userId, username, 0, config.DEFAULT_MODEL]
                );
                console.log(`Создан новый пользователь: ${userId} (${username})`);
            }
            return true;
        } catch (error) {
            console.error('Ошибка при создании пользователя:', error);
            throw error;
        }
    }

    async updateUserModel(userId, model) {
        try {
            const result = await this.db.run(
                'UPDATE users SET selected_model = ? WHERE user_id = ?',
                [model, userId]
            );
            console.log(`Модель обновлена для пользователя ${userId}: ${model}`);
            return result.changes > 0;
        } catch (error) {
            console.error('Ошибка при обновлении модели пользователя:', error);
            throw error;
        }
    }

    async isAdmin(userId) {
        try {
            console.log('Проверка прав администратора для пользователя:', userId);
            const user = await this.db.get(
                'SELECT is_admin FROM users WHERE user_id = ?',
                userId
            );
            console.log('Результат запроса:', user);
            const isAdmin = user ? user.is_admin === 1 : false;
            console.log('Пользователь является администратором:', isAdmin);
            return isAdmin;
        } catch (error) {
            console.error('Ошибк при проверке прав админист��атора:', error);
            return false;
        }
    }

    async getUserByUsername(username) {
        try {
            return await this.db.get(
                'SELECT user_id, access FROM users WHERE username = ?',
                username
            );
        } catch (error) {
            console.error('Ошибка при поиске пользователя:', error);
            return null;
        }
    }

    async updateUserAccess(userId, access) {
        try {
            const result = await this.db.run(
                'UPDATE users SET access = ? WHERE user_id = ?',
                [access, userId]
            );
            return result.changes > 0;
        } catch (error) {
            console.error('Ошибка при обновлении доступа пользователя:', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            return await this.db.all('SELECT user_id FROM users');
        } catch (error) {
            console.error('Ошибка при получении списка пользователей:', error);
            throw error;
        }
    }

    async getUserModel(userId) {
        return await this.db.get(
            'SELECT selected_model FROM users WHERE user_id = ?',
            [userId]
        );
    }
}

module.exports = new Database();
