const { Markup } = require('telegraf');
const config = require('../config/config');

class Keyboards {
    static getMainKeyboard() {
        return Markup.keyboard([
            ['🔄 Новая сессия', '🔧 Выбрать модель'],
            ['ℹ️ Текущая модель', '❓ Помощь']
        ]).resize();
    }

    static getModelSelectionKeyboard() {
        const buttons = [];
        
        // Создаем кнопки для каждого провайдера и его моделей
        Object.entries(config.PROVIDERS).forEach(([provider, providerConfig]) => {
            const providerButtons = Object.entries(providerConfig.MODELS).map(([key, model]) => {
                return `${provider} - ${key}`;
            });
            buttons.push(...providerButtons.map(button => [button]));
        });
        
        // Добавляем кнопку возврата
        buttons.push(['◀️ Назад']);

        return Markup.keyboard(buttons).resize();
    }

    static getBackKeyboard() {
        return Markup.keyboard([['◀️ Назад']]).resize();
    }
}

module.exports = Keyboards;
