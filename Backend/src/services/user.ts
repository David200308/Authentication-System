import { connection } from "../database/database";
import { SignUpSchema, User } from "../schemas/user";
import { Injectable } from '@nestjs/common';
import { 
    CREATE_USER_SQL, 
    GET_USER_BY_EMAIL_SQL,
    GET_USER_BY_ID_SQL,
    GET_USER_BY_NAME_SQL
} from "../database/sql/user";
import { GET_LATEST_NOTIFICATION_BY_USER_ID_SQL, GET_NOTIFICATIONS_BY_USER_ID_SQL } from "../database/sql/notification";

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

    getUserLoginNotificationByUserId = async(id: number) => {
        try {
            const sql = GET_LATEST_NOTIFICATION_BY_USER_ID_SQL;
            const [rows] = await connection.promise().query(sql, id);
            const data = rows[0] as User;
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

}
