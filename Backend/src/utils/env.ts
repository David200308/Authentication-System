import 'dotenv/config';

export const checkEnv = () => {
    const requiredEnvVars = [
        'DB_HOST',
        'DB_USER',
        'DB_PASS',
        'DB_NAME',
        'JWT_PRIVATE_KEY',
        'JWT_PUBLIC_KEY',
        'DOCS_USER',
        'DOCS_PASSWORD',
        'PASSKEY_RPNAME',
        'PASSKEY_RPID',
        'PASSKEY_ORIGIN',
        'AES_KEY'
    ];
    
    for (const varName of requiredEnvVars) {
        switch (varName) {
            case 'DB_HOST':
                if (!process.env.DB_HOST) {
                    throw new Error('Please provide DB_HOST in .env file');
                }
                break;
            case 'DB_USER':
                if (!process.env.DB_USER) {
                    throw new Error('Please provide DB_USER in .env file');
                }
                break;
            case 'DB_PASS':
                if (!process.env.DB_PASS) {
                    throw new Error('Please provide DB_PASS in .env file');
                }
                break;
            case 'DB_NAME':
                if (!process.env.DB_NAME) {
                    throw new Error('Please provide DB_NAME in .env file');
                }
                break;
            case 'JWT_PRIVATE_KEY':
                if (!process.env.JWT_PRIVATE_KEY) {
                    throw new Error('Please provide JWT_PRIVATE_KEY in .env file');
                }
                break;
            case 'JWT_PUBLIC_KEY':
                if (!process.env.JWT_PUBLIC_KEY) {
                    throw new Error('Please provide JWT_PUBLIC_KEY in .env file');
                }
                break;
            case 'DOCS_USER':
                if (!process.env.DOCS_USER) {
                    throw new Error('Please provide DOCS_USER in .env file');
                }
                break;
            case 'DOCS_PASSWORD':
                if (!process.env.DOCS_PASSWORD) {
                    throw new Error('Please provide DOCS_PASSWORD in .env file');
                }
                break;
            case 'PASSKEY_RPNAME':
                if (!process.env.PASSKEY_RPNAME) {
                    throw new Error('Please provide PASSKEY_RPNAME in .env file');
                }
                break;
            case 'PASSKEY_RPID':
                if (!process.env.PASSKEY_RPID) {
                    throw new Error('Please provide PASSKEY_RPID in .env file');
                }
                break;
            case 'PASSKEY_ORIGIN':
                if (!process.env.PASSKEY_ORIGIN) {
                    throw new Error('Please provide PASSKEY_ORIGIN in .env file');
                }
                break;
            case 'AES_KEY':
                if (!process.env.AES_KEY) {
                    throw new Error('Please provide AES_KEY in .env file');
                }
                break;
            default:
                continue;
        }
    }
}
