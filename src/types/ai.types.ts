export interface AIModelResponse {
    content: string;
    error?: string;
}

export interface AIModelConfig {
    apiKey: string;
    apiUrl?: string;
    modelName: string;
}

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
