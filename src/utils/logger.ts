import fs from 'fs';
import path from 'path';
import { BotError } from './errors';

class Logger {
    private logDir: string;
    private errorLogStream: fs.WriteStream;
    private infoLogStream: fs.WriteStream;

    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }

        this.errorLogStream = fs.createWriteStream(
            path.join(this.logDir, 'error.log'),
            { flags: 'a' }
        );
        this.infoLogStream = fs.createWriteStream(
            path.join(this.logDir, 'info.log'),
            { flags: 'a' }
        );
    }

    private formatMessage(level: string, message: string, ...args: any[]): string {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.map(arg => {
            if (arg instanceof BotError) {
                return `${arg.name}(${arg.code}): ${arg.message}${arg.originalError ? ` | Original: ${arg.originalError}` : ''}`;
            }
            if (arg instanceof Error) {
                return arg.stack || arg.message;
            }
            return JSON.stringify(arg);
        }).join(' ');

        return `[${timestamp}] ${level}: ${message} ${formattedArgs}\n`;
    }

    info(message: string, ...args: any[]): void {
        const logMessage = this.formatMessage('INFO', message, ...args);
        console.log(logMessage.trim());
        this.infoLogStream.write(logMessage);
    }

    error(message: string, ...args: any[]): void {
        const logMessage = this.formatMessage('ERROR', message, ...args);
        console.error(logMessage.trim());
        this.errorLogStream.write(logMessage);
    }

    warn(message: string, ...args: any[]): void {
        const logMessage = this.formatMessage('WARN', message, ...args);
        console.warn(logMessage.trim());
        this.infoLogStream.write(logMessage);
    }

    debug(message: string, ...args: any[]): void {
        if (process.env.NODE_ENV === 'development') {
            const logMessage = this.formatMessage('DEBUG', message, ...args);
            console.debug(logMessage.trim());
            this.infoLogStream.write(logMessage);
        }
    }
}

export const logger = new Logger();
