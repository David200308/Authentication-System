import { compare, hash } from "bcryptjs";
import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
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
    const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
    const token = sign(payload, privateKey, {
        algorithm: "ES256",
        expiresIn: '1h',
    });

    return token;
};

export const verifyToken = async (token: string) => {
    const publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
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

export function generateUuid() {
    return uuidv4();
}

export async function getIpLocation(ipaddress: string) {
    const ipInfo = await fetch(`https://api.iplocation.net/?ip=${ipaddress}`);
    const ipInfoJson = await ipInfo.json();
    const location = ipInfoJson.country_name;

    return location;
}

export function generateRandom6Digits() {
    const timestamp = Date.now();
    const randomPart = Math.floor(Math.random() * 1000000);
    const combinedNumber = (timestamp + randomPart) % 1000000;
    const sixDigitNumber = combinedNumber.toString().padStart(6, '0');
    return parseInt(sixDigitNumber, 10);
}
