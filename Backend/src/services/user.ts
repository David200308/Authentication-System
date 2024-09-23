import { connection } from "../database/database";
import { SignUpSchema, User } from "../schemas/user";
import { Injectable } from '@nestjs/common';
import { USER_ALEADY_EXISTS } from "../const/user";
import { 
    CREATE_USER_SQL, 
    DELETE_USER_SQL, 
    GET_USER_BY_EMAIL_SQL,
    GET_USER_BY_ID_SQL,
    GET_USER_BY_NAME_SQL
} from "../database/sql/user";

@Injectable()
export class UserServices {
    createUser = async (data: SignUpSchema) => {
        const searchUser = await this.getUserByEmail(data.email);
        if (searchUser) {
            throw new Error(USER_ALEADY_EXISTS);
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

    deleteUser = async (id: number) => {
        const sql = DELETE_USER_SQL;
        const [result] = await connection.promise().query(sql, id);
        return result;
    }

    // updateUser = async (id: string, data: User) => {
    //     const sql = 'UPDATE users SET ? WHERE id = ?';
    //     const [result] = await connection.promise().query(sql, [data, id]);
    //     return result;
    // }
    
}
