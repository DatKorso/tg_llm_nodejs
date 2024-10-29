import { DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../entities/User';
import { Message } from '../entities/Message';

dotenv.config();

export const databaseConfig: DataSourceOptions = {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: true, // В продакшене лучше установить false
    logging: true,
    entities: [User, Message],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: ['src/subscribers/**/*.ts'],
};
