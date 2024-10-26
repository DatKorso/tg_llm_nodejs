const logger = require('./logger');

class BotMonitoring {
    constructor() {
        this.stats = {
            messagesProcessed: 0,
            errorsCount: 0,
            activeUsers: new Set(),
            startTime: Date.now()
        };
    }

    trackMessage(userId) {
        this.stats.messagesProcessed++;
        this.stats.activeUsers.add(userId);
    }

    trackError() {
        this.stats.errorsCount++;
    }

    getStats() {
        return {
            uptime: Math.floor((Date.now() - this.stats.startTime) / 1000),
            messagesProcessed: this.stats.messagesProcessed,
            errorsCount: this.stats.errorsCount,
            activeUsers: this.stats.activeUsers.size
        };
    }
}

module.exports = new BotMonitoring();
