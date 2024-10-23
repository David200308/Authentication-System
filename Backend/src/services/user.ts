import { connection } from "../database/database";
import { SignUpSchema, User, Notification, Logs, CreateLogSchema, CreateAuthRecordSchema, CreatePasskeySchema } from "../schemas/user";
import { Injectable } from '@nestjs/common';
import { base64ToUint8Array, mysqlAESDecrypt, mysqlAESEncrypt } from "../utils/auth";
import { 
    ADD_DEVICE_COUNT_SQL,
    CREATE_USER_SQL, 
    ENABLE_MFA_SQL, 
    ENABLE_PASSKEY_SQL, 
    GET_USER_BY_EMAIL_SQL,
    GET_USER_BY_ID_SQL,
    // GET_USER_BY_NAME_SQL,
    REMOVE_DEVICE_COUNT_SQL
} from "../database/sql/user";
import { 
    CREATE_NOTIFICATION_SQL, 
    GET_LATEST_NOTIFICATION_BY_USER_ID_SQL, 
    GET_NOTIFICATION_BY_UUID_SQL, 
    // GET_NOTIFICATIONS_BY_USER_ID_SQL, 
    UPDATE_ALEADY_USED_NOTIFICATION_SQL, 
    UPDATE_NOTIFICATION_SQL 
} from "../database/sql/notification";
import { 
    CREATE_PASSKEY_SQL, 
    GET_PASSKEY_BY_PASSKEY_UID_SQL, 
    UPDATE_PASSKEY_COUNT_SQL 
} from "../database/sql/passkey";
import { 
    CREATE_LOG_SQL, 
    GET_LOGS_BY_USERID 
} from "../database/sql/logs";
import { 
    CREATE_AUTH_SQL
} from "../database/sql/auth";
import { 
    CREATE_MFA_SQL, 
    GET_MFA_BY_USER_ID_NOT_VERIFY_SQL, 
    GET_MFA_BY_USER_ID_SQL, 
    UPDATE_MFA_INITIAL_SETUP_SQL
} from "../database/sql/mfa";

@Injectable()
export class UserServices {
    createUser = async (data: SignUpSchema) => {
        const searchUser = await this.getUserByEmail(data.email);
        if (searchUser) {
            throw new Error('Email already exists');
        }
        const sql = CREATE_USER_SQL;
        const [result] = await connection.promise().query(sql, data);
        return result;
    };

    getUserByEmail = async (email: string) => {
        try {
            const sql = GET_USER_BY_EMAIL_SQL;
            const [rows] = await connection.promise().query(sql, email);
            const data = rows[0] as User;
            return data;
        } catch (error) {
            throw new Error(error);
        }
    }

    // getUserByName = async (username: string) => {
    //     try {
    //         const sql = GET_USER_BY_NAME_SQL;
    //         const [rows] = await connection.promise().query(sql, username);
    //         const data = rows[0] as User;
    //         return data;
    //     } catch (error) {
    //         throw new Error(error);
    //     }
    // }

    getUserById = async (id: number): Promise<User> => {
        try {
            const sql = GET_USER_BY_ID_SQL;
            const [rows] = await connection.promise().query(sql, id);
            const data = rows[0] as User;
            return data;
        } catch (error) {
            throw new Error(error);
        }
    }

    updateDeviceCount = async (id: number, mode: string) => {
        try {
            switch (mode) {
                case 'add':
                    const sql = ADD_DEVICE_COUNT_SQL;
                    connection.promise().query(sql, id);
                    return true;

                case 'remove':
                    const sql2 = REMOVE_DEVICE_COUNT_SQL;
                    connection.promise().query(sql2, id);
                    return true;

                default:
                    return false;
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    createAuthRecord = async (data: CreateAuthRecordSchema) => {
        const encryptedIp = await mysqlAESEncrypt(data.ipAddress);
        // const encryptedDeviceName = await mysqlAESEncrypt(data.loginDeviceName);
        const encryptedLocation = await mysqlAESEncrypt(data.loginLocation);
        if (encryptedIp) {
            data.ipAddress = encryptedIp;
        }
        // if (encryptedDeviceName) {
        //     data.loginDeviceName = encryptedDeviceName;
        // }
        if (encryptedLocation) {
            data.loginLocation = encryptedLocation;
        }
        const sql = CREATE_AUTH_SQL;
        const [result] = await connection.promise().query(sql, data);
        return result;
    };

    createLoginNotification = async (
        user_id: number,
        notification_uuid: string,
        sentNotificationDeviceName: string,
        sentNotificationLocation: string,
        sentNotificationIp: string,
        authCode: string
    ) => {
        const encryptedIp = await mysqlAESEncrypt(sentNotificationIp);
        // const encryptedDeviceName = await mysqlAESEncrypt(sentNotificationDeviceName);
        const encryptedLocation = await mysqlAESEncrypt(sentNotificationLocation);
        if (encryptedIp) {
            sentNotificationIp = encryptedIp;
        }
        // if (encryptedDeviceName) {
        //     sentNotificationDeviceName = encryptedDeviceName;
        // }
        if (encryptedLocation) {
            sentNotificationLocation = encryptedLocation;
        }

        const sql = CREATE_NOTIFICATION_SQL;
        const [result] = await connection.promise().query(sql, {
            user_id,
            notification_uuid,
            sentNotificationDeviceName,
            sentNotificationLocation,
            sentNotificationIp,
            receiverAction: 'pending',
            authCode
        });
        return result;
    };

    getUserLoginNotificationByUserId = async(id: number) => {
        try {
            const sql = GET_LATEST_NOTIFICATION_BY_USER_ID_SQL;
            const [rows] = await connection.promise().query(sql, [id, 'pending']);
            const data = rows[0] as Notification;
            if (data) {
                const decryptedIp = await mysqlAESDecrypt(data.sentNotificationIp);
                // const decryptedDeviceName = await mysqlAESDecrypt(data.sentNotificationDeviceName);
                const decryptedLocation = await mysqlAESDecrypt(data.sentNotificationLocation);
                if (decryptedIp) {
                    data.sentNotificationIp = decryptedIp;
                }
                // if (decryptedDeviceName) {
                //     data.sentNotificationDeviceName = decryptedDeviceName;
                // }
                if (decryptedLocation) {
                    data.sentNotificationLocation = decryptedLocation;
                }
            }
            return data;
        } catch (error) {
            throw new Error(error);
        }
    }

    // getAllLoginNotificationsByUserId = async(id: number) => {
    //     try {
    //         const sql = GET_NOTIFICATIONS_BY_USER_ID_SQL;
    //         const [rows] = await connection.promise().query(sql, id);
    //         const data = rows as Notification[];
    //         return data;
    //     } catch (error) {
    //         throw new Error(error);
    //     }
    // };

    updateLoginNotification = async(receiverAction: string, notification_uuid: string, user_id: number) => {
        try {
            const sql = UPDATE_NOTIFICATION_SQL;
            const [result] = await connection.promise().query(sql, [receiverAction, new Date(), notification_uuid, user_id]);
            return result;
        } catch (error) {
            throw new Error(error);
        }
    };

    getUserNotificationByNotificationUUId = async(notification_uuid: string): Promise<Notification> => {
        try {
            const sql = GET_NOTIFICATION_BY_UUID_SQL;
            const [rows] = await connection.promise().query(sql, notification_uuid);
            const data = rows[0] as Notification;
            if (data) {
                const decryptedIp = await mysqlAESDecrypt(data.sentNotificationIp);
                // const decryptedDeviceName = await mysqlAESDecrypt(data.sentNotificationDeviceName);
                const decryptedLocation = await mysqlAESDecrypt(data.sentNotificationLocation);
                if (decryptedIp) {
                    data.sentNotificationIp = decryptedIp;
                }
                // if (decryptedDeviceName) {
                //     data.sentNotificationDeviceName = decryptedDeviceName;
                // }
                if (decryptedLocation) {
                    data.sentNotificationLocation = decryptedLocation;
                }
            }
            return data;
        } catch (error) {
            throw new Error(error);
        }
    };

    updateAlreadyUsedNotification = async(notification_uuid: string) => {
        try {
            const sql = UPDATE_ALEADY_USED_NOTIFICATION_SQL;
            const [result] = await connection.promise().query(sql, notification_uuid);
            return result;
        } catch (error) {
            throw new Error(error);
        }
    };

    createPasskey = async (data: CreatePasskeySchema) => {
        const sql = CREATE_PASSKEY_SQL;
        const [result] = await connection.promise().query(sql, data);
        return result;
    };

    getPasskeyByPasskeyUid = async (passkeyUid : string) => {
        try {
            const sql = GET_PASSKEY_BY_PASSKEY_UID_SQL;
            const [rows] = await connection.promise().query(sql, passkeyUid);
            const data = rows[0];
            return {
                userID: data.user_id,
                credentialID: data.passkey_uid,
                credentialPublicKey: base64ToUint8Array(data.public_key),
                counter: data.counter,
                transports: data.transports ? data.transports.split(',') : [],
            };
        } catch (error) {
            console.log(error);
            return null;
        }
    };

    updatePasskeyCounter = async (passkeyUid: string, counter: number) => {
        try {
            const sql = UPDATE_PASSKEY_COUNT_SQL;
            const [result] = await connection.promise().query(sql, [counter, passkeyUid]);
            return result;
        } catch (error) {
            throw new Error(error);
        }
    };

    enablePasskey = async (userId: number) => {
        try {
            const sql = ENABLE_PASSKEY_SQL;
            await connection.promise().query(sql, userId);
            return true;
        } catch (error) {
            return false;
        }
    };

    createMFA = async (userId: number, mfaKey: string) => {
        try {
            const sql = CREATE_MFA_SQL;
            await connection.promise().query(sql, {
                user_id: userId,
                mfa_key: mfaKey,
            });
            return true;
        } catch (error) {
            return false;
        }
    };

    enableMFA = async (userId: number) => {
        try {
            const sql1 = UPDATE_MFA_INITIAL_SETUP_SQL;
            const sql2 = ENABLE_MFA_SQL;

            await connection.promise().query(sql1, [userId]);
            await connection.promise().query(sql2, [userId]);

            return true;
        } catch (error) {
            return false;
        }
    };

    getMFANotVerifyByUserId = async (userId: number) => {
        try {
            const sql = GET_MFA_BY_USER_ID_NOT_VERIFY_SQL;
            const [rows] = await connection.promise().query(sql, userId);
            const data = rows[0];
            return data;
        } catch (error) {
            return null;
        }
    }

    getMFAByUserId = async (userId: number) => {
        try {
            const sql = GET_MFA_BY_USER_ID_SQL;
            const [rows] = await connection.promise().query(sql, userId);
            const data = rows[0];
            return data;
        } catch (error) {
            return null;
        }
    }

    createLog = async (data: CreateLogSchema) => {
        // const encryptedData = await mysqlAESEncrypt(data.content);
        // if (encryptedData) {
        //     data.content = encryptedData;
        // }
        const sql = CREATE_LOG_SQL;
        const [result] = await connection.promise().query(sql, data);
        return result;
    };

    getLogsByUserId = async (userId: number) => {
        const sql = GET_LOGS_BY_USERID;
        const [rows] = await connection.promise().query(sql, userId);
        const data = rows as Logs[];
        // decrypt logs
        // data.forEach(async(log) => {
        //     const decryptedData = await mysqlAESDecrypt(log.content);
        //     if (decryptedData) {
        //         log.content = decryptedData;
        //     }
        // });

        return data;
    };

}
