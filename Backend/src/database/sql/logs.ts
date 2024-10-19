// export type Logs = {
//     log_id: number,
//     user_id: number,
//     log_time: Date,
//     content: string
// }

export const GET_LOGS_BY_USERID = 'SELECT * FROM logs WHERE user_id = ? ORDER BY log_time DESC';

export const CREATE_LOG_SQL = 'INSERT INTO logs SET ?';
