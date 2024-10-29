import { Context } from 'telegraf';

export interface SessionData {
    modelType: string;
    messageHistory: Message[];
}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface DatabaseUser {
    id: number;
    username: string;
    access: number;
    preferred_model: string;
}

export interface MyContext extends Context {
    session: SessionData;
}
