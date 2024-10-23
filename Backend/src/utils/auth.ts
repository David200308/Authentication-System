import { compare, hash } from "bcryptjs";
import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { connection } from "../database/database";
import crypto from 'crypto';
import 'dotenv/config';

export const passwordHash = async (password: string) => {
    const hashedPassword = await hash(password, 10);
    return hashedPassword;
};

export const passwordVerify = async (password: string, hashedPassword: string) => {
    const result = await compare(password, hashedPassword);
    return result;
};

export const generateToken = (payload: JwtPayload, expireFast: boolean) => {
    // use ES256 algorithm to sign payload
    const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
    const token = sign(payload, privateKey, {
        algorithm: "ES256",
        // expireFast true 5 minuties, false 1 hour
        expiresIn: expireFast ? "5m" : "1h"
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

export async function getIPDeviiceNameLocation(request: Request) {
    let loginIpAddress = request.headers['x-forwarded-for'];
    if (Array.isArray(loginIpAddress)) {
        loginIpAddress = loginIpAddress[0];
    }
    if (loginIpAddress.includes(',')) {
        loginIpAddress = loginIpAddress.split(',')[0].trim();
    }
    const device = request.headers['user-agent'];
    const location = await getIpLocation(loginIpAddress);

    return { loginIpAddress, device, location };
}

export const rpName = (): string => { return process.env.PASSKEY_RPNAME; };
export const rpID = (): string => { return process.env.PASSKEY_RPID; };
export const origin = (): string => { return process.env.PASSKEY_ORIGIN; };

export const uint8ArrayToBase64 = (uint8Array: Uint8Array): string =>
    Buffer.from(uint8Array).toString('base64');
 
export const base64ToUint8Array = (base64: string): Uint8Array =>
    new Uint8Array(Buffer.from(base64, 'base64'));

export const intToUint8Array = (num: number): Uint8Array => {
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setUint32(0, num);
    return new Uint8Array(buffer);
}

export const uint8ArrayToInt = (uint8Array: Uint8Array): number =>
    new DataView(uint8Array.buffer).getUint32(0);

export async function mysqlAESEncrypt(data: string): Promise<string | null> {
    const key = process.env.AES_KEY;
    const iv = crypto.randomBytes(16).toString('hex');

    await connection.execute("SET block_encryption_mode = 'aes-256-cbc'");
    const [rows]: any = await connection.execute(
        "SELECT HEX(AES_ENCRYPT(?, UNHEX(?), UNHEX(?))) AS encrypted",
        [data, key, iv]
    );

    return rows[0] ? rows[0].encrypted + ':' + iv : null;
}

export async function mysqlAESDecrypt(encryptedData: string): Promise<string | null> {
    const key = process.env.AES_KEY;
    const [data, iv] = encryptedData.split(':');

    await connection.execute("SET block_encryption_mode = 'aes-256-cbc'");
    const [rows]: any = await connection.execute(
        "SELECT AES_DECRYPT(UNHEX(?), UNHEX(?), UNHEX(?)) AS decrypted",
        [data, key, iv]
    );

    const decryptedData = rows[0] ? rows[0].decrypted : null;
    return decryptedData ? decryptedData.toString('utf-8') : null;
}
