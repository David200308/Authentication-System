export const CREATE_AUTH_SQL = 'INSERT INTO auth SET ?';

export const GET_AUTH_BY_UUID_SQL = 'SELECT * FROM auth WHERE uuid = ?';

export const GET_AUTH_BY_USER_ID_SQL = 'SELECT * FROM auth WHERE user_id = ? ORDER BY loginAt DESC';
