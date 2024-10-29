export const AI_MODELS = {
    GPT: {
        'gpt-4o-mini': 'GPT-4 Optimized Mini',
        'gpt-4o': 'GPT-4 Optimized',
        'o1-mini': 'O1 Mini'
    },
    MISTRAL: {
        'mistral-small-latest': 'Mistral Small',
        'mistral-medium-latest': 'Mistral Medium',
        'mistral-large-latest': 'Mistral Large'
    }
} as const;

// Создаем объединение всех допустимых моделей
const GPT_MODELS = ['gpt-4o-mini', 'gpt-4o', 'o1-mini'] as const;
const MISTRAL_MODELS = ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'] as const;

// Определяем тип для ключей моделей
export type ModelType = typeof GPT_MODELS[number] | typeof MISTRAL_MODELS[number];

export function getModelName(modelType: ModelType): string {
    if (modelType in AI_MODELS.GPT) {
        return AI_MODELS.GPT[modelType as keyof typeof AI_MODELS.GPT];
    }
    if (modelType in AI_MODELS.MISTRAL) {
        return AI_MODELS.MISTRAL[modelType as keyof typeof AI_MODELS.MISTRAL];
    }
    return 'Unknown Model';
}

// Функция для проверки валидности модели
export function isValidModel(model: string): model is ModelType {
    return [...GPT_MODELS, ...MISTRAL_MODELS].includes(model as ModelType);
}
