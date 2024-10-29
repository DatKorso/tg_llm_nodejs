export class BotError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly originalError?: any
    ) {
        super(message);
        this.name = 'BotError';
    }
}

export class AccessError extends BotError {
    constructor(message: string, originalError?: any) {
        super(message, 'ACCESS_ERROR', originalError);
        this.name = 'AccessError';
    }
}

export class AIModelError extends BotError {
    constructor(message: string, originalError?: any) {
        super(message, 'AI_MODEL_ERROR', originalError);
        this.name = 'AIModelError';
    }
}

export class DatabaseError extends BotError {
    constructor(message: string, originalError?: any) {
        super(message, 'DATABASE_ERROR', originalError);
        this.name = 'DatabaseError';
    }
}
