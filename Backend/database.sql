CREATE DATABASE BACKEND;
USE BACKEND;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    loginDeviceCount INTEGER,
    latestLoginAt TIMESTAMP
);

-- loginMethod: password, qrcode, notification
CREATE TABLE IF NOT EXISTS auth {
    auth_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    auth_uuid VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    loginAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ipAddress VARCHAR(255) NOT NULL,
    loginMethod VARCHAR(255) NOT NULL,
    loginDeviceName VARCHAR(255) NOT NULL,
    loginLocation VARCHAR(255) NOT NULL,
    notificationId INTEGER,
}

-- receiverAction: accept, reject, pending
CREATE TABLE IF NOT EXISTS notifications {
    notification_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    notification_uuid VARCHAR(255) NOT NULL,
    sentNotificationDeviceName VARCHAR(255) NOT NULL,
    sentNotificationLocation VARCHAR(255) NOT NULL,
    sentNotificationAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sentNotificationIp VARCHAR(255) NOT NULL,
    receiverAction VARCHAR(255) NOT NULL,
    receiverActionAt TIMESTAMP,
    authCode VARCHAR(255) NOT NULL,
}
