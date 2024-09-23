import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { UserServices } from '../services/user';
import { SignInSchema, SignUpSchema } from '../schemas/user';
import { generateToken, passwordHash, passwordVerify, verifyToken, validateEmail } from '../utils/auth';
import { Response, Request } from 'express';
import { 
    DELETE_REQUIRE_USERID, 
    DELETE_SUCCESSFUL, 
    INVALID_EMAIL, 
    LOGIN_SUCCESSFUL, 
    PASSWORD_INCORRECT, 
    REGISTER_FAILED, 
    REGISTER_REQUIRE, 
    REGISTER_SUCCESSFUL_WAIT_FOR_VERIFICATION, 
    UNAUTHORIZED, 
    USER_NOT_FOUND 
} from '../const/user';
import { JwtPayload } from 'jsonwebtoken';

@Controller("user")
export class UserController {
    constructor(private readonly userService: UserServices) { }

    @Get()
    async getUser(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
        if (!request.cookies.token) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: UNAUTHORIZED,
            });
            return;
        }

        const token = request.cookies.token;
        const payload: JwtPayload | void = await verifyToken(token).catch((err) => {
            console.log(err);
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: UNAUTHORIZED,
                error: err
            });
            return;
        });

        if (typeof payload !== "object" || !(typeof payload.aud === 'string')) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: UNAUTHORIZED
            });
            return;
        }

        const data = await this.userService.getUserById(parseInt(payload.aud)).catch((err) => {
            console.log(err);
            response.status(HttpStatus.NOT_FOUND).json({
                message: USER_NOT_FOUND
            });
            return;
        });
        if (data && typeof data === 'object' && "password" in data) {
            delete data.password;
            response.status(HttpStatus.OK).json(data);
            return;
        };

        response.status(HttpStatus.NOT_FOUND).json({
            message: USER_NOT_FOUND
        });
    }

    @Post('register')
    async createUser(@Body() data: SignUpSchema, @Res({ passthrough: true }) response: Response) {
        if (!data.email || !data.password || !data.username) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: REGISTER_REQUIRE
            });
            return;
        }
        if (!validateEmail(data.email)) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: INVALID_EMAIL
            });
            return;
        }
        const password = await passwordHash(data.password);
        data.password = password;
        try {
            const result = await this.userService.createUser(data);
            if (!result) {
                response.status(HttpStatus.BAD_REQUEST).json({
                    message: REGISTER_FAILED
                });
                return;
            }
        } catch (error) {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: REGISTER_FAILED
            });
            return;
        }

        response.status(HttpStatus.OK).json({
            message: REGISTER_SUCCESSFUL_WAIT_FOR_VERIFICATION
        });
    }

    @Post('login')
    async login(@Body() data: SignInSchema, @Res({ passthrough: true }) response: Response) {
        const user = await this.userService.getUserByEmail(data.email);
        if (!user) {
            response.status(HttpStatus.NOT_FOUND).json({
                message: USER_NOT_FOUND
            });
            return;
        }
        if (!(await passwordVerify(data.password, user.password))) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: PASSWORD_INCORRECT
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
            message: LOGIN_SUCCESSFUL, 
            token: token
        });
    }

    @Post('login/token')
    async loginWithToken(@Body() data: { type: string }, @Req() request: Request , @Res({ passthrough: true }) response: Response) {
        if (!request.cookies.token && !data.type && data.type !== 'token') {
            response.status(HttpStatus.BAD_REQUEST).json({
                message: UNAUTHORIZED
            });
            return;
        }

        const payload: JwtPayload = await verifyToken(request.cookies.token).catch((err) => {
            console.log(err);
            return response.status(HttpStatus.UNAUTHORIZED).json({
                message: UNAUTHORIZED,
                error: err
            });
        });

        if (!(typeof payload.aud === 'string')) {
            return response.status(HttpStatus.UNAUTHORIZED).json({
                message: UNAUTHORIZED
            });
        }

        const user = await this.userService.getUserById(parseInt(payload.aud));
        if (!user) {
            response.status(HttpStatus.NOT_FOUND).json({
                message: USER_NOT_FOUND
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
            message: LOGIN_SUCCESSFUL,
            token: token
        });
    }

    @Delete(":id")
    async deleteUser(@Param('id') id: string, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
        if (!id) {
             response.status(HttpStatus.BAD_REQUEST).json({
                message: DELETE_REQUIRE_USERID
            });
            return;
        }

        if (!request.cookies.token) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: UNAUTHORIZED
            });
            return;
        }

        const token = request.cookies.token;
        const payload: JwtPayload | void = await verifyToken(token).catch((err) => {
            console.log(err);
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: UNAUTHORIZED,
                error: err
            });
            return;
        });

        if (typeof payload !== "object" || !(typeof payload.aud === 'string')) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: UNAUTHORIZED
            });
            return;
        }
        if (payload.aud.toString() !== id.toString()) {
            response.status(HttpStatus.UNAUTHORIZED).json({
                message: UNAUTHORIZED
            });
            return;
        }

        await this.userService.deleteUser(parseInt(id)).catch((err) => {
            console.log(err);
            response.status(HttpStatus.NOT_FOUND).json({
                message: USER_NOT_FOUND,
                error: err
            });
            return;
        });

        response.status(HttpStatus.OK).json({
            message: DELETE_SUCCESSFUL
        });
    }

}
