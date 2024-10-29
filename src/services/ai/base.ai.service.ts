import { AIModelResponse, AIMessage, AIModelConfig } from '../../types/ai.types';
import { logger } from '../../utils/logger';
import { countTokens, TOKEN_LIMITS } from '../../utils/token.counter';

export abstract class BaseAIService {
    protected config: AIModelConfig;

    constructor(config: AIModelConfig) {
        this.config = config;
    }

    abstract generateResponse(messages: AIMessage[]): Promise<AIModelResponse>;

    protected truncateMessages(messages: AIMessage[], modelType: string): AIMessage[] {
        const tokenLimit = this.getTokenLimit(modelType);
        let totalTokens = 0;
        const result: AIMessage[] = [];

        // Всегда сохраняем системный промпт
        const systemMessage = messages.find(m => m.role === 'system');
        if (systemMessage) {
            totalTokens += countTokens(systemMessage.content);
            result.push(systemMessage);
        }

        // Обрабатываем остальные сообщения от новых к старым
        const conversationMessages = messages
            .filter(m => m.role !== 'system')
            .reverse();

        for (const message of conversationMessages) {
            const messageTokens = countTokens(message.content);
            if (totalTokens + messageTokens <= tokenLimit) {
                totalTokens += messageTokens;
                result.push(message);
            } else {
                logger.warn(`Message truncated due to token limit for model ${modelType}`);
                break;
            }
        }

        // Возвращаем сообщения в правильном порядке
        return result.reverse();
    }

    private getTokenLimit(modelType: string): number {
        if (modelType in TOKEN_LIMITS.GPT) {
            return TOKEN_LIMITS.GPT[modelType as keyof typeof TOKEN_LIMITS.GPT];
        }
        if (modelType in TOKEN_LIMITS.MISTRAL) {
            return TOKEN_LIMITS.MISTRAL[modelType as keyof typeof TOKEN_LIMITS.MISTRAL];
        }
        return 2048; // Дефолтный лимит
    }

    protected async handleError(error: any): Promise<AIModelResponse> {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
        logger.error('AI model error:', errorMessage);
        return {
            content: 'Произошла ошибка при обработке запроса.',
            error: errorMessage
        };
    }
}
