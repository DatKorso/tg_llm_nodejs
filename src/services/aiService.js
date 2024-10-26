const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class AIService {
    constructor() {
        this.providers = {
            gptunnel: this.createGPTunnelRequest.bind(this),
            mistral: this.createMistralRequest.bind(this)
        };
    }

    parseModelString(modelString) {
        logger.info('Парсинг модели:', { modelString });
        
        for (const [providerName, provider] of Object.entries(config.PROVIDERS)) {
            for (const [modelKey, model] of Object.entries(provider.MODELS)) {
                if (model === modelString) {
                    logger.info('Найдена модель:', { provider: providerName, model });
                    return {
                        provider: providerName.toLowerCase(),
                        model: modelString,
                        apiKey: provider.API_KEY,
                        apiUrl: provider.API_URL
                    };
                }
            }
        }
        throw new Error(`Неподдерживаемая модель: ${modelString}`);
    }

    async sendMessage(modelString, messages) {
        try {
            logger.info('Отправка сообщения:', { model: modelString, messagesCount: messages.length });
            
            const { provider, model, apiKey, apiUrl } = this.parseModelString(modelString);
            const requestHandler = this.providers[provider];
            
            if (!requestHandler) {
                throw new Error(`Провайдер не поддерживается: ${provider}`);
            }

            return await requestHandler(model, messages, apiKey, apiUrl);
        } catch (error) {
            logger.error('Ошибка при отправке сообщения:', error);
            throw error;
        }
    }

    async createGPTunnelRequest(model, messages, apiKey, apiUrl) {
        try {
            logger.info('Отправка запроса к GPTunnel:', { model, apiUrl });
            
            const systemPrompt = {
                role: "system",
                content: "You are a helpful assistant."
            };

            const hasSystemMessage = messages.some(msg => msg.role === 'system');
            const finalMessages = hasSystemMessage ? messages : [systemPrompt, ...messages];

            const response = await axios.post(
                apiUrl,
                {
                    model,
                    messages: finalMessages,
                    temperature: 0.3,
                    max_tokens: 2048
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            logger.info('Получен ответ от GPTunnel');
            
            if (response.data?.choices?.[0]?.message) {
                return response.data.choices[0].message;
            } else {
                throw new Error('Неверный формат ответа от GPTunnel API');
            }
        } catch (error) {
            logger.error('GPTunnel API error:', {
                error: error.response?.data || error.message,
                status: error.response?.status
            });
            throw new Error(`Ошибка GPTunnel API: ${error.message}`);
        }
    }

    async createMistralRequest(model, messages, apiKey, apiUrl) {
        try {
            logger.info('Отправка запроса к Mistral:', { 
                model, 
                apiUrl,
                messagesCount: messages.length 
            });
            
            // Проверяем URL
            if (!apiUrl) {
                throw new Error('Не указан URL для Mistral API');
            }

            const systemPrompt = {
                role: "system",
                content: "You are a helpful assistant."
            };

            const hasSystemMessage = messages.some(msg => msg.role === 'system');
            const finalMessages = hasSystemMessage ? messages : [systemPrompt, ...messages];

            // Добавляем логирование запроса
            logger.info('Отправляем запрос к Mistral:', {
                url: apiUrl,
                model,
                messagesCount: finalMessages.length
            });

            const response = await axios.post(
                apiUrl,
                {
                    model,
                    messages: finalMessages,
                    temperature: 0.3,
                    max_tokens: 2048
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );
            
            logger.info('Получен ответ от Mistral:', {
                status: response.status,
                hasData: !!response.data
            });
            
            if (response.data?.choices?.[0]?.message) {
                return response.data.choices[0].message;
            } else {
                throw new Error('Неверный формат ответа от Mistral API');
            }
        } catch (error) {
            logger.error('Mistral API error:', {
                error: error.response?.data || error.message,
                status: error.response?.status,
                url: apiUrl
            });
            throw new Error(`Ошибка Mistral API: ${error.message}`);
        }
    }
}

module.exports = new AIService();
