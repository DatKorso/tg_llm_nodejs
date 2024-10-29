import axios from 'axios';
import { BaseAIService } from './base.ai.service';
import { AIModelResponse, AIMessage } from '../../types/ai.types';
import { logger } from '../../utils/logger';

export class MistralService extends BaseAIService {
    async generateResponse(messages: AIMessage[]): Promise<AIModelResponse> {
        try {
            // Обрезаем сообщения по лимиту токенов
            const truncatedMessages = this.truncateMessages(messages, this.config.modelName);

            const response = await axios.post(
                this.config.apiUrl || 'https://api.mistral.ai/v1/chat/completions',
                {
                    messages: truncatedMessages,
                    model: this.config.modelName,
                    temperature: 0.3,
                    max_tokens: 2048
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                content: response.data.choices[0].message.content
            };
        } catch (error) {
            return this.handleError(error);
        }
    }
}
