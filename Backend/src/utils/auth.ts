import { compare, hash } from "bcryptjs";
import { JwtPayload, sign, verify } from 'jsonwebtoken';
import fs from 'fs';
import 'dotenv/config'

export const passwordHash = async (password: string) => {
    const hashedPassword = await hash(password, 10);
    return hashedPassword;
};

export const passwordVerify = async (password: string, hashedPassword: string) => {
    const result = await compare(password, hashedPassword);
    return result;
};

export const generateToken = (payload: JwtPayload) => {
    // use ES256 algorithm to sign payload
    const privateKey = fs.readFileSync("../../private_key.pem")
    const token = sign(payload, privateKey, {
        algorithm: "ES256",
        expiresIn: '1h',
    });

    return token;
};

export const verifyToken = async (token: string) => {
    const publicKey = fs.readFileSync("../../public_key.pem")
    const payload = verify(token, publicKey, {
        algorithms: ["ES256"]
    });
    if (!payload) throw new Error('Invalid token');
    if (typeof payload === 'string') throw new Error('Invalid token');
    return payload;
};

export function validateEmail(email: string) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}
