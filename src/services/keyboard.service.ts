import { Markup } from 'telegraf';
import { AI_MODELS } from '../config/models.config';

export class KeyboardService {
    static getModelSelectionKeyboard() {
        const buttons = [
            ...Object.entries(AI_MODELS.GPT).map(([key, name]) => 
                Markup.button.callback(name, `model:${key}`)
            ),
            ...Object.entries(AI_MODELS.MISTRAL).map(([key, name]) => 
                Markup.button.callback(name, `model:${key}`)
            )
        ];

        return Markup.inlineKeyboard(buttons, { columns: 2 });
    }

    static getMainKeyboard() {
        return Markup.keyboard([
            ['🔄 Новый диалог', '🔧 Выбрать модель'],
            ['ℹ️ Текущая модель', '❓ Помощь']
        ]).resize();
    }
}
