import { DataSource } from 'typeorm';
import { logger } from '../utils/logger';
import { databaseConfig } from '../config/database.config';

export const AppDataSource = new DataSource(databaseConfig);

export async function initDatabase(): Promise<void> {
    try {
        await AppDataSource.initialize();
        logger.info('Database connection initialized');
    } catch (error) {
        logger.error('Error during database initialization:', error);
        throw error;
    }
}

export const getUserRepository = () => AppDataSource.getRepository('User');
export const getMessageRepository = () => AppDataSource.getRepository('Message');
