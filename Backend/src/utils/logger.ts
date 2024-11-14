import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import { Request } from 'express';
import { getIPDeviiceNameLocation } from './auth';

class Logger {
    private logDir: string;
    private currentLogFile: string;

    constructor() {
        // create the access_logs file
        this.logDir = path.join(process.cwd(), 'access_logs');
        this.ensureLogDirectory();
        this.currentLogFile = this.getLogFileName();
    }

    private ensureLogDirectory(): void {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private getLogFileName(): string {
        // use the current data as the file name
        const date = format(new Date(), 'yyyy-MM-dd');
        return path.join(this.logDir, `access-${date}.log`);
    }

    async logAccess(req: Request, executionTime: number): Promise<void> {
        const { loginIpAddress, device, location } = await getIPDeviiceNameLocation(req);
        
        const logEntry = {
            timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            method: req.method,
            path: req.originalUrl,
            ip: loginIpAddress,
            device: device,
            location: location,
            executionTime: `${executionTime}ms`
        };

        const logLine = JSON.stringify(logEntry) + '\n';

        try {
            //check whether need to create a new file
            const newLogFile = this.getLogFileName();
            if (newLogFile !== this.currentLogFile) {
                this.currentLogFile = newLogFile;
            }

            // writing to the file
            await fs.promises.appendFile(this.currentLogFile, logLine, 'utf8');
        } catch (error) {
            console.error('Error writing to access log file:', error);
        }
    }

    async readLogs(date?: Date): Promise<string[]> {
        try {
            const fileName = date ? 
                path.join(this.logDir, `access-${format(date, 'yyyy-MM-dd')}.log`) :
                this.currentLogFile;

            if (!fs.existsSync(fileName)) {
                return [];
            }

            const content = await fs.promises.readFile(fileName, 'utf8');
            return content.split('\n').filter(line => line.trim());
        } catch (error) {
            console.error('Error reading log file:', error);
            return [];
        }
    }
}

export const logger = new Logger();