import { AppDataSource } from '../database/connection';
import { User } from '../entities/User';
import { logger } from '../utils/logger';
import { DatabaseError, AccessError, BotError } from '../utils/errors';
import { ModelType } from '../config/models.config';

export class UserService {
    private userRepository = AppDataSource.getRepository(User);

    async createUser(id: number, username?: string): Promise<User> {
        try {
            const user = this.userRepository.create({
                id,
                username,
                access: 0,
                preferredModel: 'gpt-4o-mini'
            });
            return await this.userRepository.save(user);
        } catch (error) {
            throw new DatabaseError('Error creating user', error);
        }
    }

    async getUserById(id: number): Promise<User | null> {
        try {
            return await this.userRepository.findOne({ where: { id } });
        } catch (error) {
            throw new DatabaseError('Error getting user', error);
        }
    }

    async updateUser(user: User): Promise<User> {
        try {
            return await this.userRepository.save(user);
        } catch (error) {
            throw new DatabaseError('Error updating user', error);
        }
    }

    async updateAccess(id: number, access: number): Promise<User> {
        try {
            const user = await this.getUserById(id);
            if (!user) {
                throw new AccessError('User not found');
            }
            user.access = access;
            return await this.userRepository.save(user);
        } catch (error) {
            if (error instanceof BotError) throw error;
            throw new DatabaseError('Error updating user access', error);
        }
    }

    async updatePreferredModel(userId: number, modelType: ModelType): Promise<void> {
        try {
            await this.userRepository.update(userId, { preferredModel: modelType });
            logger.info(`Updated preferred model for user ${userId} to ${modelType}`);
        } catch (error) {
            logger.error(`Error updating preferred model for user ${userId}:`, error);
            throw error;
        }
    }
}
