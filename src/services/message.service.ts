import { AppDataSource } from '../database/connection';
import { Message } from '../entities/Message';
import { User } from '../entities/User';
import { logger } from '../utils/logger';

export class MessageService {
    private messageRepository = AppDataSource.getRepository(Message);

    async saveMessage(userId: number, role: 'user' | 'assistant', content: string): Promise<Message> {
        try {
            const message = new Message({
                userId,
                role,
                content,
                timestamp: new Date()
            });
            return await this.messageRepository.save(message);
        } catch (error) {
            logger.error('Error saving message:', error);
            throw error;
        }
    }

    async getLastMessages(userId: number, limit: number = 20): Promise<Message[]> {
        try {
            return await this.messageRepository.find({
                where: { userId },
                order: { timestamp: 'ASC' },
                take: limit
            });
        } catch (error) {
            logger.error('Error getting last messages:', error);
            throw error;
        }
    }

    async clearUserHistory(userId: number): Promise<void> {
        try {
            await this.messageRepository
                .createQueryBuilder()
                .delete()
                .from(Message)
                .where("userId = :userId", { userId })
                .execute();

            logger.info(`Cleared message history for user ${userId}`);
        } catch (error) {
            logger.error('Error clearing user history:', error);
            throw error;
        }
    }
}
