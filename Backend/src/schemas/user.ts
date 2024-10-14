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

export type Auth = {
    id: number;
    uuid: string;
    userId: number;
    loginAt: Date;
    ipAddress: string;
    loginMethod: string;
    loginDeviceName: string;
    loginLocation: string;
    notificationId?: Notification;
    qrId?: any;
};

export type Notification = {
    notification_id: number;
    user_id: number;
    notification_uuid: string;
    sentNotificationDeviceName: string;
    sentNotificationLocation: string;
    sentNotificationAt: Date;
    sentNotificationIp: string;
    receiverAction: string;
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
    action: string;
    notification_uuid: string;
    authCode: string;
}
