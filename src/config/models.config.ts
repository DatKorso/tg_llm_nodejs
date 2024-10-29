export const AI_MODELS = {
    GPT: {
        'gpt-4o-mini': 'GPT-4o-mini',
        'o1-mini': 'O1-mini'
    },
    MISTRAL: {
        'mistral-small-latest': 'Mistral Small',
        'mistral-medium-latest': 'Mistral Medium',
        'mistral-large-latest': 'Mistral Large'
    }
} as const;

export type GPTModelType = keyof typeof AI_MODELS.GPT;
export type MistralModelType = keyof typeof AI_MODELS.MISTRAL;
export type ModelType = GPTModelType | MistralModelType;

export function getModelName(modelType: ModelType): string {
    if (modelType in AI_MODELS.GPT) {
        return AI_MODELS.GPT[modelType as GPTModelType];
    }
    if (modelType in AI_MODELS.MISTRAL) {
        return AI_MODELS.MISTRAL[modelType as MistralModelType];
    }
    return 'Unknown Model';
}
