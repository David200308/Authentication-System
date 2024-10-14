import { connection } from "../database/database";
import { SignUpSchema, User, Notification, Logs, CreateLogSchema } from "../schemas/user";
import { Injectable } from '@nestjs/common';
import { 
    ADD_DEVICE_COUNT_SQL,
    CREATE_USER_SQL, 
    GET_USER_BY_EMAIL_SQL,
    GET_USER_BY_ID_SQL,
    GET_USER_BY_NAME_SQL,
    REMOVE_DEVICE_COUNT_SQL
} from "../database/sql/user";
import { 
    CREATE_NOTIFICATION_SQL, 
    GET_LATEST_NOTIFICATION_BY_USER_ID_SQL, 
    GET_NOTIFICATION_BY_UUID_SQL, 
    GET_NOTIFICATIONS_BY_USER_ID_SQL, 
    UPDATE_ALEADY_USED_NOTIFICATION_SQL, 
    UPDATE_NOTIFICATION_SQL 
} from "../database/sql/notification";
import { CREATE_LOG_SQL, GET_LOGS_BY_USERID } from "../database/sql/logs";

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

    getUserByName = async (username: string) => {
        try {
            const sql = GET_USER_BY_NAME_SQL;
            const [rows] = await connection.promise().query(sql, username);
            const data = rows[0] as User;
            return data;
        } catch (error) {
            throw new Error(error);
        }
    }

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

    createAuthRecord = async () => {
        return;
    };

    createLoginNotification = async (
        user_id: number,
        notification_uuid: string,
        sentNotificationDeviceName: string,
        sentNotificationLocation: string,
        sentNotificationIp: string,
        authCode: string
    ) => {
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
            return data;
        } catch (error) {
            throw new Error(error);
        }
    }

    getAllLoginNotificationsByUserId = async(id: number) => {
        try {
            const sql = GET_NOTIFICATIONS_BY_USER_ID_SQL;
            const [rows] = await connection.promise().query(sql, id);
            const data = rows as User[];
            return data;
        } catch (error) {
            throw new Error(error);
        }
    };

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

    createLog = async (data: CreateLogSchema) => {
        const sql = CREATE_LOG_SQL;
        const [result] = await connection.promise().query(sql, data);
        return result;
    };

    getLogsByUserId = async (userId: number) => {
        const sql = GET_LOGS_BY_USERID;
        const [rows] = await connection.promise().query(sql, userId);
        const data = rows as Logs[];
        return data;
    };

}
