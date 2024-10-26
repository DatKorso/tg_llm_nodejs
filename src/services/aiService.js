const axios = require('axios');
const config = require('../config/config');

class AIService {
    constructor() {
        this.providers = {
            gptunnel: this.createGPTunnelRequest.bind(this),
            mistral: this.createMistralRequest.bind(this)
        };
    }

    // Определяем провайдера и модель из строки модели
    parseModelString(modelString) {
        for (const [providerName, provider] of Object.entries(config.PROVIDERS)) {
            for (const [_, model] of Object.entries(provider.MODELS)) {
                if (model === modelString) {
                    return {
                        provider: providerName.toLowerCase(),
                        model: modelString
                    };
                }
            }
        }
        throw new Error('Неподдерживаемая модель');
    }

    async sendMessage(modelString, messages) {
        const { provider, model } = this.parseModelString(modelString);
        const requestHandler = this.providers[provider];
        
        if (!requestHandler) {
            throw new Error('Провайдер не поддерживается');
        }

        return await requestHandler(model, messages);
    }

    async createGPTunnelRequest(model, messages) {
        try {
            // Добавляем системный промпт, если его нет в начале сообщений
            const systemPrompt = {
                role: "system",
                content: "assistant"
            };

            // Проверяем, есть ли уже системное сообщение
            const hasSystemMessage = messages.some(msg => msg.role === 'system');
            const finalMessages = hasSystemMessage ? messages : [systemPrompt, ...messages];

            const response = await axios.post(
                config.PROVIDERS.GPTUNNEL.API_URL,
                {
                    model,
                    messages: finalMessages,
                    temperature: 0.3,
                    max_tokens: 2048
                },
                {
                    headers: {
                        'Authorization': config.PROVIDERS.GPTUNNEL.API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data && response.data.choices && response.data.choices[0]) {
                return response.data.choices[0].message;
            } else {
                throw new Error('Неверный формат ответа от GPTunnel API');
            }
        } catch (error) {
            console.error('GPTunnel API error:', error.response?.data || error.message);
            throw new Error('Ошибка при запросе к GPTunnel API');
        }
    }

    async createMistralRequest(model, messages) {
        try {
            // Добавляем системный промпт, если его нет в начале сообщений
            const systemPrompt = {
                role: "system",
                content: "assistant"
            };

            // Проверяем, есть ли уже системное сообщение
            const hasSystemMessage = messages.some(msg => msg.role === 'system');
            const finalMessages = hasSystemMessage ? messages : [systemPrompt, ...messages];

            const response = await axios.post(
                `${config.PROVIDERS.MISTRAL.API_URL}`,
                {
                    model,
                    messages: finalMessages,
                    temperature: 0.3,
                    top_p: 1,
                    max_tokens: 2048,
                    stream: false,
                    safe_prompt: false,
                    response_format: {
                        type: "text"
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.PROVIDERS.MISTRAL.API_KEY}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (response.data && response.data.choices && response.data.choices[0]) {
                return response.data.choices[0].message;
            } else {
                throw new Error('Неверный формат ответа от Mistral API');
            }
        } catch (error) {
            console.error('Mistral API error:', error.response?.data || error);
            throw new Error('Ошибка при запросе к Mistral API');
        }
    }
}

module.exports = new AIService();
