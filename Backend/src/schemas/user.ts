export type User = {
    id: number;
    username: string;
    email: string;
    password?: string;
    createAt: Date;
    updateAt: Date;
    loginDeviceCount: number;
    latestLoginAt: Date;
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
};

export type Notification = {
    notificationId: number;
    userId: number;
    notificationUuid: string;
    sentNotificationDeviceName: string;
    sentNotificationLocation: string;
    sentNotificationAt: Date;
    sentNotificationIp: string;
    receiverAction: string;
    receiverActionAt: Date;
    authCode: string;
};

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
