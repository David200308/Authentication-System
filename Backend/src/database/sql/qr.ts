// CREATE TABLE IF NOT EXISTS notifications {
//     notification_id INTEGER PRIMARY KEY AUTO_INCREMENT,
//     user_id INTEGER NOT NULL,
//     notification_uuid VARCHAR(255) NOT NULL,
//     sentNotificationDeviceName VARCHAR(255) NOT NULL,
//     sentNotificationLocation VARCHAR(255) NOT NULL,
//     sentNotificationAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//     sentNotificationIp VARCHAR(255) NOT NULL,
//     receiverAction VARCHAR(255) NOT NULL,
//     receiverActionAt TIMESTAMP,
//     authCode VARCHAR(255) NOT NULL,
//     alreadyUsed BOOLEAN NOT NULL DEFAULT FALSE
// }

// export const GET_LATEST_NOTIFICATION_BY_USER_ID_SQL = `
//     SELECT * FROM notifications 
//     WHERE user_id = ? 
//       AND receiverAction = ? 
//       AND sentNotificationAt >= NOW() - INTERVAL 5 MINUTE 
//     ORDER BY sentNotificationAt DESC 
//     LIMIT 1
// `;

// export const GET_NOTIFICATIONS_BY_USER_ID_SQL = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY sentNotificationAt DESC';

export const CREATE_QR_SQL = 'INSERT INTO qr SET ?';

export const UPDATE_QR_SQL = 'UPDATE qr SET user_id = ?, scannerAction = ?, scannerActionAt = ? WHERE qr_uuid = ?';

export const GET_QR_BY_UUID_SQL = 'SELECT * FROM qr WHERE qr_uuid = ?';

export const GET_QR_BY_UUID_AUTHCODE_SQL = 'SELECT * FROM qr WHERE qr_uuid = ? AND authCode = ?';

export const UPDATE_ALEADY_USED_QR_SQL = 'UPDATE qr SET alreadyUsed = TRUE WHERE qr_uuid = ?';
