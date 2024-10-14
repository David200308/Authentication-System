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

export const GET_LATEST_NOTIFICATION_BY_USER_ID_SQL = 'SELECT * FROM notifications WHERE user_id = ? AND receiverAction = ? ORDER BY sentNotificationAt DESC LIMIT 1';

export const GET_NOTIFICATIONS_BY_USER_ID_SQL = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY sentNotificationAt DESC';

export const CREATE_NOTIFICATION_SQL = 'INSERT INTO notifications SET ?';

export const UPDATE_NOTIFICATION_SQL = 'UPDATE notifications SET receiverAction = ?, receiverActionAt = ? WHERE notification_uuid = ? AND user_id = ?';

export const GET_NOTIFICATION_BY_UUID_SQL = 'SELECT * FROM notifications WHERE notification_uuid = ?';

export const UPDATE_ALEADY_USED_NOTIFICATION_SQL = 'UPDATE notifications SET alreadyUsed = TRUE WHERE notification_uuid = ?';
