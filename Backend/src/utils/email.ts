import { readFileSync } from 'fs';
import { activationEmail } from './emailTemplates';
import 'dotenv/config';

const domain = process.env.MAILGUN_FROM_DOMAIN_FILE;

export function validateEmail(email: string) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

export const sendActivationEmail = async (to: string, token: string) => {
    const apiEndpoint = `https://api.mailgun.net/v3/${domain}/messages`;

    const reqHeaders = new Headers();
    // reqHeaders.append('Authorization', `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY_FILE}`).toString('base64')}`);
    reqHeaders.append('Authorization', `Basic ${Buffer.from(`api:${readFileSync(process.env.MAILGUN_API_KEY_FILE, 'utf8').trim()}`).toString('base64')}`);

    const formdata = new FormData();
    formdata.append("from", `Auth System <postmaster@${domain}>`);
    formdata.append("to", to);
    formdata.append("subject", "Please activate your account!");
    formdata.append("text", "Please activate your account!");
    formdata.append("html", activationEmail(`${process.env.PASSKEY_ORIGIN}/verify-email?email=${to}&token=${token}`));

    const requestOptions = {
        method: 'POST',
        headers: reqHeaders,
        body: formdata,
    };

    try {
        const response = await fetch(apiEndpoint, requestOptions);
        const result = await response.text();
        if (result) return true;
        return false;
    } catch (error) {
        console.error(error);
        return false;
    };
}
