import { AIServiceFactory } from './ai/ai.factory';
import { MessageService } from './message.service';
import { AIMessage } from '../types/ai.types';
import { logger } from '../utils/logger';
import { SYSTEM_PROMPTS } from '../config/prompts.config';

export class AIMessageHandler {
    private messageService: MessageService;

    constructor() {
        this.messageService = new MessageService();
    }

    async handleMessage(userId: number, text: string, modelType: string): Promise<string> {
        try {
            // Получаем историю сообщений
            const previousMessages = await this.messageService.getLastMessages(userId);
            
            // Сохраняем новое сообщение пользователя
            await this.messageService.saveMessage(userId, 'user', text);

            // Формируем контекст для модели
            const systemPrompt = this.getSystemPrompt(modelType);
            const messages: AIMessage[] = [
                { role: 'system', content: systemPrompt },
                ...previousMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                { role: 'user', content: text }
            ];

            // Получаем ответ от AI
            const aiService = AIServiceFactory.getService(modelType);
            const response = await aiService.generateResponse(messages);

            if (response.error) {
                throw new Error(response.error);
            }

            // Сохраняем ответ AI
            await this.messageService.saveMessage(userId, 'assistant', response.content);

            return response.content;
        } catch (error) {
            logger.error('Error handling AI message:', error);
            throw error;
        }
    }

    private getSystemPrompt(modelType: string): string {
        if (modelType in SYSTEM_PROMPTS.GPT) {
            return SYSTEM_PROMPTS.GPT[modelType as keyof typeof SYSTEM_PROMPTS.GPT];
        }
        if (modelType in SYSTEM_PROMPTS.MISTRAL) {
            return SYSTEM_PROMPTS.MISTRAL[modelType as keyof typeof SYSTEM_PROMPTS.MISTRAL];
        }
        return SYSTEM_PROMPTS.GPT['gpt-4o-mini'];
    }
}
