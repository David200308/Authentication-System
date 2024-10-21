// CREATE TABLE IF NOT EXISTS passkey (
//     passkey_id INTEGER PRIMARY KEY AUTO_INCREMENT,
//     user_id INTEGER NOT NULL,
//     passkey_uuid VARCHAR(255) NOT NULL,
//     public_key VARCHAR(255) NOT NULL,
//     counter INT NOT NULL,
//     transports VARCHAR(255),
//     createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
// );

export const CREATE_PASSKEY_SQL = 'INSERT INTO passkey SET ?';

export const GET_PASSKEY_BY_PASSKEY_UID_SQL = 'SELECT * FROM passkey WHERE passkey_uid = ? LIMIT 1';

export const UPDATE_PASSKEY_COUNT_SQL = 'UPDATE passkey SET counter = ? WHERE passkey_uid = ?';
