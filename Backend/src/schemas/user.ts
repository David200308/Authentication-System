export type User = {
    id: number;
    username: string;
    email: string;
    password?: string;
    createAt: Date;
    updateAt: Date;
    loginDeviceCount: number;
    latestLoginAt: Date;
    MFAEnabled: boolean;
    MFAKey: string;
    auths: Auth[];
}

// loginMethod: general, qr, notification
export type Auth = {
    auth_id: number;
    auth_uuid: string;
    user_id: number;
    loginAt: Date;
    ipAddress: string;
    loginMethod: "general" | "qr" | "notification";
    loginDeviceName: string;
    loginLocation: string;
    notificationId?: string;
    qrId?: string;
};

// loginMethod: general, qr, notification
export type CreateAuthRecordType = {
    auth_uuid: string;
    user_id: number;
    ipAddress: string;
    loginMethod: "general" | "qr" | "notification";
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

export type Logs = {
    log_id: number,
    user_id: number,
    log_time: Date,
    content: string
}

export type CreateLogSchema = {
    user_id: number,
    content: string
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
    authCode: string;
}
