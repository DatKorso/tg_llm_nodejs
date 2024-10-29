export function countTokens(text: string): number {
    // Простой подсчет: 1 токен ≈ 4 символа для английского и 2-3 для других языков
    return Math.ceil(text.length / 3);
}

export const TOKEN_LIMITS = {
    GPT: {
        'gpt-4o-mini': 2048,
        'o1-mini': 2048
    },
    MISTRAL: {
        'mistral-small-latest': 2048,
        'mistral-medium-latest': 2048,
        'mistral-large-latest': 2048
    }
} as const; 