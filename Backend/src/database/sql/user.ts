// CREATE TABLE IF NOT EXISTS users (
//     id INTEGER PRIMARY KEY AUTO_INCREMENT,
//     username VARCHAR(255) NOT NULL,
//     email VARCHAR(255) NOT NULL,
//     password VARCHAR(255),
//     createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//     updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//     loginDeviceCount INTEGER NOT NULL DEFAULT 0,
//     latestLoginAt TIMESTAMP,
//     mfaEnabled BOOLEAN DEFAULT FALSE,
//     passkeyEnabled BOOLEAN DEFAULT FALSE,
//     isVerify BOOLEAN DEFAULT FALSE
// );

export const CREATE_USER_SQL = 'INSERT INTO users SET ?';

export const GET_USER_BY_EMAIL_SQL = 'SELECT * FROM users WHERE email = ? AND isVerify = 1';

// export const GET_USER_BY_NAME_SQL = 'SELECT * FROM users WHERE username = ?';

export const GET_USER_BY_ID_SQL = 'SELECT * FROM users WHERE id = ? AND isVerify = 1';

export const ACTIVATE_USER_SQL = 'UPDATE users SET isVerify = 1 WHERE email = ?';

export const ADD_DEVICE_COUNT_SQL = 'UPDATE users SET loginDeviceCount = loginDeviceCount + 1 WHERE id = ?';

export const REMOVE_DEVICE_COUNT_SQL = 'UPDATE users SET loginDeviceCount = loginDeviceCount - 1 WHERE id = ?';

export const ENABLE_MFA_SQL = 'UPDATE users SET mfaEnabled = 1 WHERE id = ?';

export const ENABLE_PASSKEY_SQL = 'UPDATE users SET passkeyEnabled = 1 WHERE id = ?';
