import { Request, Response } from 'express';
import { logger } from './logger';

export function accessLogMiddleware(req: Request, res: Response, next: any) {
    const startTime = Date.now();
    
    // Log after request processing is completed
    res.on('finish', () => {
        const executionTime = Date.now() - startTime;
        logger.logAccess(req, executionTime).catch(err => {
            console.error('Failed to log access:', err);
        });
    });

    next();
}