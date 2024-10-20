import { Body, Controller, Get, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import { UserServices } from '../services/user';
import { PasswordSignInSchema, SignUpSchema, UpdateNotificationLoginBodySchema } from '../schemas/user';
import { generateToken, passwordHash, passwordVerify, verifyToken, validateEmail, generateUuid, getIpLocation, generateRandom6Digits } from '../utils/auth';
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
    async login(@Body() data: PasswordSignInSchema, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
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

        const authuuid = generateUuid();
        const loginIpAddress = request.socket.remoteAddress;
        const device = request.headers['user-agent'];
        const location = await getIpLocation(loginIpAddress);

        const payload = {
            aud: user.id.toString(),
            email: user.email,
            username: user.username,
            authuuid,
            location,
            ipaddress: loginIpAddress,
            device,
        };

        const token = generateToken(payload, false);

        const createLogResult = await this.userService.createLog({
            user_id: user.id, 
            content:`Login via password in ${location} use ${device}`
        });
        if (!createLogResult) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Create log failed'
            });
            return;
        }

        const updateDeviceCount = await this.userService.updateDeviceCount(user.id, "add");
        if (!updateDeviceCount) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Update device count failed'
            });
            return;
        }

        response.cookie('token', token, { secure: true });
        response.status(HttpStatus.OK).json({
            message: 'Login successful', 
        });
    }

    @Post('token')
    async verifyToken(@Body() data: { type: string }, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
        if (!request.cookies.token) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized'
            });
            return;
        }

        if (!data.type && data.type !== 'token') {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Request type is required'
            });
            return;
        }

        const payload: JwtPayload | void = await verifyToken(request.cookies.token).catch((err) => {
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

        const user = await this.userService.getUserById(parseInt(payload.aud));
        if (!user) {
            response.status(HttpStatus.NOT_FOUND).json({
                message: 'User not found'
            });
            return;
        }

        response.status(HttpStatus.OK).json({
            message: 'Token valid',
            isValid: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });
    }

    @Get('logs')
    async getLogs(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
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

        const data = await this.userService.getLogsByUserId(parseInt(payload.aud)).catch((err) => {
            console.log(err);
            response.status(HttpStatus.NOT_FOUND).json({
                message: 'User not found'
            });
            return;
        });

        response.status(HttpStatus.OK).json(data);
    }

    @Post('login/notification')
    async loginWithNotification(@Body() data: { email: string }, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
        if (!data.email) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Email is required'
            });
            return;
        }
        const email = data.email;
        const user = await this.userService.getUserByEmail(email);
        if (!user) {
            response.status(HttpStatus.NOT_FOUND).json({
                message: 'User not found'
            });
            return;
        }
        if (user.loginDeviceCount === 0) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'No device registered'
            });
            return;
        }
        
        const notification_uuid = generateUuid();
        let loginIpAddress = request.ip || request.headers['x-forwarded-for'];
        if (Array.isArray(loginIpAddress)) {
            console.log(loginIpAddress);
            loginIpAddress = loginIpAddress[0];
        }
        const device = request.headers['user-agent'];
        const location = await getIpLocation(loginIpAddress);
        const authCode = generateRandom6Digits();
        const authCodeHash = await passwordHash(authCode.toString());
        
        const result = await this.userService.createLoginNotification(user.id, notification_uuid, device, location, loginIpAddress, authCodeHash);
        if (!result) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Notification create failed'
            });
            return;
        }

        const payload = {
            email: user.email,
            notification_uuid,
            location,
            ipaddress: loginIpAddress,
            device,
            usage: 'notification login verification'
        };

        const token = generateToken(payload, true);
        response.cookie('token', token, { secure: true });
        
        response.status(HttpStatus.OK).json({
            message: 'Notification sent',
            notification_uuid,
            authCode
        });
    }

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

        response.status(HttpStatus.OK).json(data ?? {});
    }

    @Patch('login/notification/action')
    async allowLoginNotification(@Body() data: UpdateNotificationLoginBodySchema, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
        if (!request.cookies.token || !data.action || (data.action !== 'approved' && data.action !== 'rejected')) {
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

        // approved, rejected, pending
        switch (data.action) {
            case 'approved':
                if (!data.authCode) {
                    response.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Auth code is required'
                    });
                    return;
                }
                // compare auth code
                const notificationData = await this.userService.getUserLoginNotificationByUserId(parseInt(payload.aud));

                if (notificationData.notification_uuid !== data.notification_uuid || !(await passwordVerify(data.authCode, notificationData.authCode))) {
                    response.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Invalid auth code or notification uuid'
                    });
                    return;
                }
                // update notification in database
                const result = await this.userService.updateLoginNotification('approved', data.notification_uuid, parseInt(payload.aud));
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
            case 'rejected':
                // update notification in database
                const resultReject = await this.userService.updateLoginNotification('rejected', data.notification_uuid, parseInt(payload.aud));
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

    @Get('login/notification/status')
    async getLoginNotificationStatus(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
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

        if (typeof payload !== "object") {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized'
            });
            return;
        }
        if (payload.usage !== 'notification login verification') {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Invalid token usage'
            });
            return; 
        }

        const notification_uuid = payload.notification_uuid;
        const data = await this.userService.getUserNotificationByNotificationUUId(notification_uuid);
        if (!data) {
            response.status(HttpStatus.NOT_FOUND).json({
                message: 'record not found'
            });
            return;
        };
        if (data.alreadyUsed) {
            response.status(HttpStatus.NOT_FOUND).json({
                message: 'Already Used this Login, if auth another device, please send notification login again'
            });
            return;
        }

        const userId = data.user_id;
        const user = await this.userService.getUserById(userId);
        if (!user) {
            response.status(HttpStatus.NOT_FOUND).json({
                message: 'User not found'
            });
            return;
        }
        if (data.receiverAction === 'approved') {
            const authuuid = generateUuid();
            const loginIpAddress = request.socket.remoteAddress;
            const device = request.headers['user-agent'];
            const location = await getIpLocation(loginIpAddress);

            const payload = {
                aud: user.id.toString(),
                email: user.email,
                username: user.username,
                authuuid,
                location,
                ipaddress: loginIpAddress,
                device,
            };

            const token = generateToken(payload, false);

            const createLogResult = await this.userService.createLog({
                user_id: user.id, 
                content:`Login via sent notification in ${location} use ${device}`
            });
            if (!createLogResult) {
                response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Create log failed'
                });
                return;
            }

            const updateDeviceCount = await this.userService.updateDeviceCount(user.id, "add");
            if (!updateDeviceCount) {
                response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Update device count failed'
                });
                return;
            }

            const updateAlreadyUsed = await this.userService.updateAlreadyUsedNotification(notification_uuid);
            if (!updateAlreadyUsed) {
                response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Update already used failed'
                });
                return;
            }

            response.cookie('token', token, { secure: true });
            response.status(HttpStatus.OK).json({
                message: 'Login successful',
                status: 'approved'
            });
            return;
        }
        response.status(HttpStatus.OK).json({
            status: data.receiverAction
        });
    }

}
