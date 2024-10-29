import { GPTunnelService } from './gptunnel.service';
import { MistralService } from './mistral.service';
import { BaseAIService } from './base.ai.service';
import { AIModelConfig } from '../../types/ai.types';
import { logger } from '../../utils/logger';

export class AIServiceFactory {
    private static services: Map<string, BaseAIService> = new Map();

    static getService(modelType: string): BaseAIService {
        if (this.services.has(modelType)) {
            return this.services.get(modelType)!;
        }

        let service: BaseAIService;

        switch (modelType) {
            case 'gpt-4o-mini':
            case 'o1-mini':
                service = new GPTunnelService({
                    apiKey: process.env.GPTUNNEL_API_KEY!,
                    modelName: modelType
                });
                break;

            case 'mistral-small-latest':
            case 'mistral-medium-latest':
            case 'mistral-large-latest':
                service = new MistralService({
                    apiKey: process.env.MISTRAL_API_KEY!,
                    apiUrl: process.env.MISTRAL_API_URL,
                    modelName: modelType
                });
                break;

            default:
                logger.warn(`Unknown model type: ${modelType}, falling back to gpt-4o-mini`);
                service = new GPTunnelService({
                    apiKey: process.env.GPTUNNEL_API_KEY!,
                    modelName: 'gpt-4o-mini'
                });
        }

        this.services.set(modelType, service);
        return service;
    }
}
