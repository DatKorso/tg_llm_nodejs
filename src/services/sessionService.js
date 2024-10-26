const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const config = require('../config/config');

class SessionService {
    async createNewSession(userId) {
        const sessionId = uuidv4();
        console.log(`Создана новая сессия ${sessionId} для пользователя ${userId}`);
        // Очищаем старые сообщения при создании новой сессии
        await this.clearUserMessages(userId);
        return sessionId;
    }

    async addMessage(userId, sessionId, role, content) {
        try {
            console.log(`Добавление сообщения для пользователя ${userId} в сессии ${sessionId}`);
            await db.db.run(
                'INSERT INTO messages (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
                [userId, sessionId, role, content]
            );

            // Удаляем старые сообщения, если их больше MAX_HISTORY_MESSAGES
            await this.trimMessages(userId, sessionId);
            console.log('Сообщение успешно добавлено');
        } catch (error) {
            console.error('Ошибка при добавлении сообщения:', error);
            throw error;
        }
    }

    async getSessionMessages(userId, sessionId) {
        try {
            console.log(`Получение сообщений для пользователя ${userId} в сессии ${sessionId}`);
            const messages = await db.db.all(
                `SELECT role, content FROM messages 
                WHERE user_id = ? AND session_id = ? 
                ORDER BY created_at ASC`,
                [userId, sessionId]
            );
            console.log(`Найдено ${messages.length} сообщений`);
            return messages;
        } catch (error) {
            console.error('Ошибка при получении сообщений сессии:', error);
            throw error;
        }
    }

    async trimMessages(userId, sessionId) {
        try {
            const count = await db.db.get(
                'SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND session_id = ?',
                [userId, sessionId]
            );

            if (count.count > config.MAX_HISTORY_MESSAGES) {
                console.log(`Удаление старых сообщений (всего: ${count.count})`);
                await db.db.run(
                    `DELETE FROM messages 
                    WHERE message_id IN (
                        SELECT message_id FROM messages 
                        WHERE user_id = ? AND session_id = ?
                        ORDER BY created_at ASC 
                        LIMIT ?
                    )`,
                    [userId, sessionId, count.count - config.MAX_HISTORY_MESSAGES]
                );
            }
        } catch (error) {
            console.error('Ошибка при очистке старых сообщений:', error);
            throw error;
        }
    }

    async clearUserMessages(userId) {
        try {
            console.log(`Очистка всех сообщений пользователя ${userId}`);
            await db.db.run('DELETE FROM messages WHERE user_id = ?', [userId]);
        } catch (error) {
            console.error('Ошибка при очистке сообщений пользователя:', error);
            throw error;
        }
    }
}

module.exports = new SessionService();
