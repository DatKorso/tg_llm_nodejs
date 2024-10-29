import { Markup } from 'telegraf';
import { AI_MODELS } from '../config/models.config';

export class KeyboardService {
    static getModelSelectionKeyboard() {
        const gptButtons = Object.entries(AI_MODELS.GPT).map(([key, name]) => 
            Markup.button.callback(name, `model:${key}`)
        );
        
        const mistralButtons = Object.entries(AI_MODELS.MISTRAL).map(([key, name]) => 
            Markup.button.callback(name, `model:${key}`)
        );

        const rows = Math.max(gptButtons.length, mistralButtons.length);
        const keyboard = [];

        for (let i = 0; i < rows; i++) {
            const row = [];
            if (gptButtons[i]) {
                row.push(gptButtons[i]);
            }
            if (mistralButtons[i]) {
                row.push(mistralButtons[i]);
            }
            keyboard.push(row);
        }

        return Markup.inlineKeyboard(keyboard);
    }

    static getMainKeyboard() {
        return Markup.keyboard([
            ['🔄 Новый диалог', '🔧 Выбрать модель'],
            ['ℹ️ Текущая модель', '❓ Помощь']
        ]).resize();
    }
}
