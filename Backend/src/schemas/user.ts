import { RegistrationResponseJSON } from '@simplewebauthn/server';

export type User = {
    id: number;
    username: string;
    email: string;
    password?: string;
    createAt: Date;
    updateAt: Date;
    loginDeviceCount: number;
    latestLoginAt: Date;
    mfaEnabled: boolean;
    passkeyEnabled: boolean;
};

// loginMethod: general, qr, notification, passkey
export type Auth = {
    auth_id: number;
    auth_uuid: string;
    user_id: number;
    loginAt: Date;
    ipAddress: string;
    loginMethod: "general" | "qr" | "notification" | "passkey";
    loginDeviceName: string;
    loginLocation: string;
    notificationId?: string;
    qrId?: string;
};

// loginMethod: general, qr, notification, passkey
export type CreateAuthRecordSchema = {
    auth_uuid: string;
    user_id: number;
    ipAddress: string;
    loginMethod: "general" | "qr" | "notification" | "passkey";
    loginDeviceName: string;
    loginLocation: string;
    notificationId?: string;
    qrId?: string;
}

export type Notification = {
    notification_id: number;
    user_id: number;
    notification_uuid: string;
    sentNotificationDeviceName: string;
    sentNotificationLocation: string;
    sentNotificationAt: Date;
    sentNotificationIp: string;
    receiverAction: 'approved' | 'rejected';
    receiverActionAt: Date;
    authCode: string;
    alreadyUsed: boolean;
};

export type QR = {
    qr_id: number;
    user_id: number;
    qr_uuid: string;
    qrDeviceName: string;
    qrLocation: string;
    qrAt: Date;
    qrIp: string;
    scannerAction: 'approved' | 'rejected';
    scannerActionAt: Date;
    authCode: string;
    alreadyUsed: boolean;
};

export type Passkey = {
    passkey_id: number;
    user_id: number;
    passkey_uid: string;
    public_key: string;
    counter: number;
    transports: string;
    createdAt: Date;
};

export type Logs = {
    log_id: number,
    user_id: number,
    log_time: Date,
    content: string
}

export type CreatePasskeyRequestBodySchema = {
    passkeyOptions: RegistrationResponseJSON;
    challenge: string;
}

export type CreatePasskeySchema = {
    user_id: number;
    passkey_uid: string;
    public_key: string;
    counter: number;
    transports: string;
}

export type CreateLogSchema = {
    user_id: number;
    content: string;
}

export type SignUpSchema = {
    username: string;
    email: string;
    password?: string;
}

export type PasswordSignInSchema = {
    email: string;
    password: string;
}

export type ReturnUserSchema = {
    id: number;
    username: string;
    email: string;
    createAt: Date;
    updateAt: Date;
}

export type UpdateNotificationLoginBodySchema = {
    action: 'approved' | 'rejected';
    notification_uuid: string;
    authCode?: string;
}

export type UpdateQRLoginBodySchema = {
    action: 'approved' | 'rejected';
    qr_uuid: string;
    authCode?: string;
}

export type MFASchema = {
    mfa_id: number;
    user_id: number;
    mfa_key: string;
    enableAt: Date;
    initialSetup: boolean;
}
