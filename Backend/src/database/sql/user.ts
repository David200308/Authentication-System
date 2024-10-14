export const CREATE_USER_SQL = 'INSERT INTO users SET ?';

export const GET_USER_BY_EMAIL_SQL = 'SELECT * FROM users WHERE email = ?';

export const GET_USER_BY_NAME_SQL = 'SELECT * FROM users WHERE username = ?';

export const GET_USER_BY_ID_SQL = 'SELECT * FROM users WHERE id = ?';

export const ADD_DEVICE_COUNT_SQL = 'UPDATE users SET loginDeviceCount = loginDeviceCount + 1 WHERE id = ?';

export const REMOVE_DEVICE_COUNT_SQL = 'UPDATE users SET loginDeviceCount = loginDeviceCount - 1 WHERE id = ?';
