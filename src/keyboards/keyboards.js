const { Markup } = require('telegraf');
const config = require('../config/config');

class Keyboards {
    static getMainKeyboard() {
        return Markup.keyboard([
            ['🔄 Новая сессия'],
            ['🔧 Выбрать модель', 'ℹ️ Текущая модель']
        ]).resize();
    }

    static getModelSelectionKeyboard() {
        const buttons = [];
        
        // Добавляем кнопки для GPTunnel
        Object.entries(config.PROVIDERS.GPTUNNEL.MODELS).forEach(([key]) => {
            buttons.push(`GPTUNNEL - ${key}`);
        });
        
        // Добавляем кнопки для Mistral
        Object.entries(config.PROVIDERS.MISTRAL.MODELS).forEach(([key]) => {
            buttons.push(`MISTRAL - ${key}`);
        });
        
        // Добавляем кнопку "Назад"
        buttons.push('◀️ Назад');
        
        return Markup.keyboard(buttons, { columns: 2 }).resize();
    }

    static getBackKeyboard() {
        return Markup.keyboard([['◀️ Назад']]).resize();
    }
}

module.exports = Keyboards;
