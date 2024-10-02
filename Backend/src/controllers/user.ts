import { Body, Controller, Get, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import { UserServices } from '../services/user';
import { PasswordSignInSchema, SignUpSchema, UpdateNotificationLoginBodySchema } from '../schemas/user';
import { generateToken, passwordHash, passwordVerify, verifyToken, validateEmail } from '../utils/auth';
import { Response, Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

@Controller("user")
export class UserController {
    constructor(private readonly userService: UserServices) { }

    @Get()
    async getUser(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
        if (!request.cookies.token) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized',
            });
            return;
        }

        const token = request.cookies.token;
        const payload: JwtPayload | void = await verifyToken(token).catch((err) => {
            console.log(err);
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized',
                error: err
            });
            return;
        });

        if (typeof payload !== "object" || !(typeof payload.aud === 'string')) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized'
            });
            return;
        }

        const data = await this.userService.getUserById(parseInt(payload.aud)).catch((err) => {
            console.log(err);
            response.status(HttpStatus.NOT_FOUND).json({
                message: 'User not found'
            });
            return;
        });
        if (data && typeof data === 'object' && "password" in data) {
            delete data.password;
            response.status(HttpStatus.OK).json(data);
            return;
        };

        response.status(HttpStatus.NOT_FOUND).json({
            message: 'User not found'
        });
    }

    @Post('register')
    async createUser(@Body() data: SignUpSchema, @Res({ passthrough: true }) response: Response) {
        if (!data.email || !data.password || !data.username) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Email, password, and username is required'
            });
            return;
        }
        if (!validateEmail(data.email)) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Invalid email'
            });
            return;
        }
        const password = await passwordHash(data.password);
        data.password = password;
        try {
            const result = await this.userService.createUser(data);
            if (!result) {
                response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Register failed'
                });
                return;
            }
        } catch (error) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Register failed'
            });
            return;
        }

        response.status(HttpStatus.OK).json({
            message: 'Register successful'
        });
    }

    @Post('login/password')
    async login(@Body() data: PasswordSignInSchema, @Res({ passthrough: true }) response: Response) {
        const user = await this.userService.getUserByEmail(data.email);
        if (!user) {
            response.status(HttpStatus.NOT_FOUND).json({
                message: 'User not found'
            });
            return;
        }
        if (!(await passwordVerify(data.password, user.password))) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Password incorrect'
            });
            return;
        }

        const payload = {
            aud: user.id.toString(),
            email: user.email,
            username: user.username,
        };

        const token = generateToken(payload);

        response.cookie('token', token, { secure: true });
        response.status(HttpStatus.OK).json({
            message: 'Login successful', 
            token: token
        });
    }

    @Post('token')
    async verifyToken(@Body() data: { type: string }, @Req() request: Request , @Res({ passthrough: true }) response: Response) {
        if (!request.cookies.token && !data.type && data.type !== 'token') {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Unauthorized'
            });
            return;
        }

        const payload: JwtPayload = await verifyToken(request.cookies.token).catch((err) => {
            console.log(err);
            return response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized',
                error: err
            });
        });

        if (!(typeof payload.aud === 'string')) {
            return response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized'
            });
        }

        const user = await this.userService.getUserById(parseInt(payload.aud));
        if (!user) {
            response.status(HttpStatus.NOT_FOUND).json({
                message: 'User not found'
            });
            return;
        }

        const newPayload = {
            aud: user.id.toString(),
            email: user.email,
            username: user.username,
        };

        const token = generateToken(newPayload);

        response.cookie('token', token, { secure: true });
        response.status(HttpStatus.OK).json({
            message: 'Token verified',
            status: true
        });
    }

    @Post('login/notification')
    async loginWithNotification() {}

    @Get('login/notification')
    async getLoginNotification(@Req() request: Request , @Res({ passthrough: true }) response: Response) {
        if (!request.cookies.token) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized',
            });
            return;
        }

        const token = request.cookies.token;
        const payload: JwtPayload | void = await verifyToken(token).catch((err) => {
            console.log(err);
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized',
                error: err
            });
            return;
        });

        if (typeof payload !== "object" || !(typeof payload.aud === 'string')) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized'
            });
            return;
        }

        const data = await this.userService.getUserLoginNotificationByUserId(parseInt(payload.aud)).catch((err) => {
            console.log(err);
            response.status(HttpStatus.NOT_FOUND).json({
                message: 'User not found'
            });
            return;
        });

        return response.status(HttpStatus.OK).json(data);
    }

    @Patch('login/notification/action')
    async allowLoginNotification(@Body() data: UpdateNotificationLoginBodySchema, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
        if (!request.cookies.token || !data.action || (data.action !== 'allow' && data.action !== 'reject')) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized or invalid action',
            });
            return;
        }

        const token = request.cookies.token;
        const payload: JwtPayload | void = await verifyToken(token).catch((err) => {
            console.log(err);
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized',
                error: err
            });
            return;
        });

        if (typeof payload !== "object" || !(typeof payload.aud === 'string')) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized'
            });
            return;
        }

        switch (data.action) {
            case 'allow':
                if (!data.authCode) {
                    response.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Auth code is required'
                    });
                    return;
                }
                // compare auth code
                const notificationData = await this.userService.getUserLoginNotificationByUserId(parseInt(payload.aud));

                if (notificationData.notificationUuid !== data.notification_uuid || notificationData.authCode !== data.authCode) {
                    response.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Invalid auth code or notification uuid'
                    });
                    return;
                }
                // update notification in database
                const result = await this.userService.updateLoginNotification('allow', data.notification_uuid, parseInt(payload.aud));
                if (!result) {
                    response.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Update failed'
                    });
                    return;
                }
                response.status(HttpStatus.OK).json({
                    message: 'Login allowed'
                });
                
                break;
            case 'reject':
                // update notification in database
                const resultReject = await this.userService.updateLoginNotification('reject', data.notification_uuid, parseInt(payload.aud));
                if (!resultReject) {
                    response.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Update failed'
                    });
                    return;
                }
                response.status(HttpStatus.OK).json({
                    message: 'Login rejected'
                });

                break;
            default:
                response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Invalid action'
                });
                return;
        }
    }

}
