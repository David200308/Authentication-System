import { Body, Controller, Get, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import { UserServices } from '../services/user';
import { Response, Request } from 'express';
import { generateAuthenticationOptions, generateRegistrationOptions, VerifiedAuthenticationResponse, verifyAuthenticationResponse, VerifyAuthenticationResponseOpts, verifyRegistrationResponse } from '@simplewebauthn/server';
import { JwtPayload } from 'jsonwebtoken';
import {
    CreatePasskeyRequestBodySchema,
    PasswordSignInSchema,
    SignUpSchema,
    UpdateNotificationLoginBodySchema
} from '../schemas/user';
import {
    generateToken,
    passwordHash,
    passwordVerify,
    verifyToken,
    validateEmail,
    generateUuid,
    generateRandom6Digits,
    getIPDeviiceNameLocation,
    rpName,
    rpID,
    origin,
    intToUint8Array,
    uint8ArrayToBase64
} from '../utils/auth';
import { AuthenticationResponseJSON } from '@simplewebauthn/server/script/deps';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Controller("user")
export class UserController {
    constructor(private readonly userService: UserServices) { }

    // Get user info
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

        // compare ipaddress, location, device to detect token hijacking
        const { loginIpAddress, device, location } = await getIPDeviiceNameLocation(request);
        if (payload.location !== location || payload.ipaddress !== loginIpAddress || payload.device !== device) {
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

    // Password register
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

    // Password login
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
        const { loginIpAddress, device, location } = await getIPDeviiceNameLocation(request);

        const payload = {
            aud: user.id.toString(),
            email: user.email,
            username: user.username,
            authuuid,
            location,
            ipaddress: loginIpAddress,
            device,
        };

        const needMFAPayload = {
            aud: user.id.toString(),
            email: user.email,
            username: user.username,
            location,
            ipaddress: loginIpAddress,
            device,
            usage: 'mfa verification'
        };

        const token = generateToken(
            user.mfaEnabled ? needMFAPayload : payload,
            user.mfaEnabled ? true : false
        );

        if (!user.mfaEnabled) {
            const createAuthRes = await this.userService.createAuthRecord({
                auth_uuid: authuuid,
                user_id: user.id,
                ipAddress: loginIpAddress,
                loginMethod: 'general',
                loginDeviceName: device,
                loginLocation: location
            });
            if (!createAuthRes) {
                response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Create Auth Record failed'
                });
                return;
            }

            const createLogResult = await this.userService.createLog({
                user_id: user.id,
                content: `Login via password in ${location} use ${device}`
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
        }

        response.cookie('token', token, { secure: true, httpOnly: true, sameSite: 'strict' });
        response.status(HttpStatus.OK).json({
            message: 'Login successful',
        });
    }

    // token verification
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

        // compare ipaddress, location, device to detect token hijacking
        const { loginIpAddress, device, location } = await getIPDeviiceNameLocation(request);
        if (payload.location !== location || payload.ipaddress !== loginIpAddress || payload.device !== device) {
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
                username: user.username,
                mfaEnabled: user.mfaEnabled,
                passkeyEnabled: user.passkeyEnabled,
            }
        });
    }

    // 2FA
    @Post('request/mfa/enable')
    async requestEnableMFA(@Body() data: { rMfa: boolean }, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
        if (!request.cookies.token) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized'
            });
            return;
        }

        if (!data.rMfa && data.rMfa !== false) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Request mfa is required'
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

        if (typeof payload !== 'object' || !(typeof payload.aud === 'string')) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized'
            });
            return;
        }

        const { loginIpAddress, device, location } = await getIPDeviiceNameLocation(request);
        if (payload.location !== location || payload.ipaddress !== loginIpAddress || payload.device !== device) {
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

        const secret = speakeasy.generateSecret({
            name: `COMP4334 Auth System (${user.email})`,
            length: 32
        });

        const res = await this.userService.createMFA(user.id, secret.base32);
        if (!res) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Create MFA failed'
            });
            return;
        }

        const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);

        response.json({
            message: 'MFA enabled',
            status: true,
            qrCode: qrCodeDataURL,
            secret: secret.base32
        });
    }

    @Post('request/mfa/verify')
    async requestVerifyMFA(@Body() data: { code: string }, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
        if (!request.cookies.token) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized'
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

        if (typeof payload !== 'object' || !(typeof payload.aud === 'string')) {
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

        const mfaInfo = await this.userService.getMFAByUserId(user.id);
        if (!mfaInfo) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'MFA not enabled for user'
            });
            return;
        }

        const verified = speakeasy.totp.verify({
            secret: mfaInfo.mfa_key,
            encoding: 'base32',
            token: data.code
        });

        if (!verified) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Invalid MFA code',
                status: false
            });
            return;
        }

        const res = await this.userService.enableMFA(user.id);
        if (!res) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Enable MFA failed',
                status: false
            });
            return;
        }

        response.json({
            message: 'MFA enabled successfully',
            status: true
        });
    };

    @Post('mfa/verify')
    async verifyMFA(@Body() data: { code: string }, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
        if (!request.cookies.token) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized'
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

        if (typeof payload !== 'object' || !(typeof payload.aud === 'string')) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Unauthorized'
            });
            return;
        }

        if (payload.usage !== 'mfa verification') {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Invalid token usage'
            });
            return;
        }

        const mfaInfo = await this.userService.getMFAByUserId(parseInt(payload.aud));
        if (!mfaInfo) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'MFA not enabled for user'
            });
            return;
        }

        const userSecret = mfaInfo.mfa_key;
        const verified = speakeasy.totp.verify({
            secret: userSecret,
            encoding: 'base32',
            token: data.code
        });

        if (!verified) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Invalid MFA code',
                status: false
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

        const authuuid = generateUuid();
        const { loginIpAddress, device, location } = await getIPDeviiceNameLocation(request);

        const loginPayload = {
            aud: user.id.toString(),
            email: user.email,
            username: user.username,
            authuuid,
            location,
            ipaddress: loginIpAddress,
            device,
        };

        const token = generateToken(loginPayload, false);

        const createAuthRes = await this.userService.createAuthRecord({
            auth_uuid: authuuid,
            user_id: user.id,
            ipAddress: loginIpAddress,
            loginMethod: 'general',
            loginDeviceName: device,
            loginLocation: location
        });
        if (!createAuthRes) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Create Auth Record failed'
            });
            return;
        }

        const createLogResult = await this.userService.createLog({
            user_id: user.id,
            content: `Login via password in ${location} use ${device}`
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

        response.cookie('token', token, { secure: true, httpOnly: true, sameSite: 'strict' });
        response.json({
            message: 'MFA verified successfully',
            status: true
        });
    }

    // Logs
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

        // compare ipaddress, location, device to detect token hijacking
        const { loginIpAddress, device, location } = await getIPDeviiceNameLocation(request);
        if (payload.location !== location || payload.ipaddress !== loginIpAddress || payload.device !== device) {
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

    // Notification login
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
        const { loginIpAddress, device, location } = await getIPDeviiceNameLocation(request);
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
        response.cookie('token', token, { secure: true, httpOnly: true, sameSite: 'strict' });

        response.status(HttpStatus.OK).json({
            message: 'Notification sent',
            notification_uuid,
            authCode
        });
    }

    @Get('login/notification')
    async getLoginNotification(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
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

        // compare ipaddress, location, device to detect token hijacking
        const { loginIpAddress, device, location } = await getIPDeviiceNameLocation(request);
        if (payload.location !== location || payload.ipaddress !== loginIpAddress || payload.device !== device) {
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

        // compare ipaddress, location, device to detect token hijacking
        const { loginIpAddress, device, location } = await getIPDeviiceNameLocation(request);
        if (payload.location !== location || payload.ipaddress !== loginIpAddress || payload.device !== device) {
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
        const { loginIpAddress, device, location } = await getIPDeviiceNameLocation(request);
        if (data.receiverAction === 'approved') {
            const authuuid = generateUuid();

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

            const createAuthRes = await this.userService.createAuthRecord({
                auth_uuid: authuuid,
                user_id: user.id,
                ipAddress: loginIpAddress,
                loginMethod: 'notification',
                loginDeviceName: device,
                loginLocation: location,
                notificationId: data.notification_id.toString()
            });
            if (!createAuthRes) {
                response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Create Auth Record failed'
                });
                return;
            }

            const createLogResult = await this.userService.createLog({
                user_id: user.id,
                content: `Login via sent notification in ${location} use ${device}`
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

            response.cookie('token', token, { secure: true, httpOnly: true, sameSite: 'strict' });
            response.status(HttpStatus.OK).json({
                message: 'Login successful',
                status: 'approved'
            });
            return;
        } else if (data.receiverAction === 'rejected') {
            const createLogResult = await this.userService.createLog({
                user_id: user.id,
                content: `Rejected Login via sent notification in ${location} use ${device}`
            });
            if (!createLogResult) {
                response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Create log failed'
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

            response.status(HttpStatus.OK).json({
                status: data.receiverAction
            });
            return;
        }
        response.status(HttpStatus.OK).json({
            status: data.receiverAction
        });
    }

    // Passkey login
    @Post('request/passkey/enable')
    async requestPasskeyEnable(@Body() data: { rPasskey: boolean }, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
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

        if (!data.rPasskey && data.rPasskey !== false) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Request passkey is required'
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

        const passkeyOptions = await generateRegistrationOptions({
            rpName: rpName(),
            rpID: rpID(),
            userID: intToUint8Array(user.id),
            userName: user.username,
            timeout: 60000,
            attestationType: 'direct',
            excludeCredentials: [],
            authenticatorSelection: {
                residentKey: 'preferred',
            },
            supportedAlgorithmIDs: [-7, -257],
        });
        if (!passkeyOptions) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Request passkey failed',
                status: false
            });
            return;
        }

        response.status(HttpStatus.OK).json({
            message: "Request passkey successful",
            status: true,
            passkeyOptions,
            challenge: passkeyOptions.challenge,
        });
    }

    @Post('request/passkey/enroll')
    async requestPasskeyEnroll(@Body() data: CreatePasskeyRequestBodySchema, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
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

        if (!data) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'missing body data'
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

        const verification = await verifyRegistrationResponse({
            response: data.passkeyOptions,
            expectedChallenge: data.challenge,
            expectedOrigin: origin(),
            expectedRPID: rpID(),
            requireUserVerification: true,
        });

        if (verification.verified && verification.registrationInfo) {
            const credentialPublicKey = verification.registrationInfo.credential.publicKey;
            const credentialID = verification.registrationInfo.credential.id;
            const counter = verification.registrationInfo.credential.counter;
            const transports = verification.registrationInfo.credential.transports;

            const createPasskeyData = {
                user_id: user.id,
                passkey_uid: credentialID,
                public_key: uint8ArrayToBase64(credentialPublicKey),
                counter,
                transports: transports.join(','),
            };

            const result = await this.userService.createPasskey(createPasskeyData);
            if (!result) {
                response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Create passkey failed'
                });
                return;
            }

            const res = await this.userService.enablePasskey(user.id);
            if (!res) {
                response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Enable passkey failed'
                });
                return;
            }

            const createLogResult = await this.userService.createLog({
                user_id: user.id,
                content: `Passkey was enabled & created`
            });

            if (!createLogResult) {
                response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Create log failed'
                });
                return;
            }

            response.status(HttpStatus.OK).json({
                message: 'Create passkey successful',
                verified: true
            });
            return;
        }

        response.status(HttpStatus.BAD_REQUEST).json({
            message: 'Verification failed',
            verified: false
        });
    }

    @Post('login/passkey/request')
    async loginByPasskeyRequest(@Body() data: { email: string }, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
        if (!data.email) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Email is required'
            });
            return;
        }
        const email = data.email;

        const passkeyOptions = await generateAuthenticationOptions({
            timeout: 60000,
            allowCredentials: [],
            userVerification: 'required',
            rpID: rpID(),
        });
        if (!passkeyOptions) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Request passkey failed',
                status: false
            });
            return;
        }

        const payload = {
            email,
            passkeyOptionsChallenge: passkeyOptions.challenge,
            usage: 'passkey login verification'
        };

        const token = generateToken(payload, true);
        response.cookie('token', token, { secure: true, httpOnly: true, sameSite: 'strict' });

        response.status(HttpStatus.OK).json({
            message: "Request passkey successful",
            status: true,
            passkeyOptions,
        });
    }

    @Post('login/passkey/verify')
    async loginByPasskeyVerify(@Body() data: AuthenticationResponseJSON, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
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

        if (payload.usage !== 'passkey login verification') {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Invalid token usage'
            });
            return;
        }

        if (!data) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'missing body data'
            });
            return;
        }

        const user = await this.userService.getUserByEmail(payload.email);
        if (!user) {
            response.status(HttpStatus.NOT_FOUND).json({
                message: 'User not found'
            });
            return;
        }

        const passkeyUid = data.id;
        const passkeyInfo = await this.userService.getPasskeyByPasskeyUid(passkeyUid);

        if (!passkeyInfo) {
            response.status(HttpStatus.NOT_FOUND).json({
                message: 'Passkey not found'
            });
            return;
        }

        const passkeyInfoOpts = {
            id: passkeyInfo.credentialID,
            publicKey: passkeyInfo.credentialPublicKey,
            counter: passkeyInfo.counter,
            transports: passkeyInfo.transports,
        }

        const opts: VerifyAuthenticationResponseOpts = {
            response: data,
            expectedChallenge: payload.passkeyOptionsChallenge,
            expectedOrigin: origin(),
            expectedRPID: rpID(),
            credential: passkeyInfoOpts,
        };

        const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse(opts);
        const { verified, authenticationInfo } = verification;

        if (!verified) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Verification failed',
                verified: false
            });
            return;
        }

        await this.userService.updatePasskeyCounter(passkeyUid, authenticationInfo.newCounter);
        const authuuid = generateUuid();
        const { loginIpAddress, device, location } = await getIPDeviiceNameLocation(request);

        const payloadAuth = {
            aud: user.id.toString(),
            email: user.email,
            username: user.username,
            authuuid,
            location,
            ipaddress: loginIpAddress,
            device,
        };

        const tokenAuth = generateToken(payloadAuth, false);

        const createAuthRes = await this.userService.createAuthRecord({
            auth_uuid: authuuid,
            user_id: user.id,
            ipAddress: loginIpAddress,
            loginMethod: 'passkey',
            loginDeviceName: device,
            loginLocation: location
        });

        if (!createAuthRes) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Create Auth Record failed'
            });
            return;
        }

        const createLogResult = await this.userService.createLog({
            user_id: user.id,
            content: `Login via passkey in ${location} use ${device}`
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

        response.cookie('token', tokenAuth, { secure: true, httpOnly: true, sameSite: 'strict' });
        response.status(HttpStatus.OK).json({
            message: 'Login successful',
            verified: true
        });
    }

}
