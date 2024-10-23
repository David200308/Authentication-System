// CREATE TABLE IF NOT EXISTS mfa (
//     mfa_id INTEGER PRIMARY KEY AUTO_INCREMENT,
//     user_id INTEGER NOT NULL,
//     mfa_key VARCHAR(255) NOT NULL,
//     enableAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//     initialSetup BOOLEAN NOT NULL DEFAULT FALSE
// );

export const CREATE_MFA_SQL = 'INSERT INTO mfa SET ?';

export const GET_MFA_BY_USER_ID_NOT_VERIFY_SQL = 'SELECT * FROM mfa WHERE user_id = ? AND initialSetup = FALSE ORDER BY enableAt DESC LIMIT 1';

export const GET_MFA_BY_USER_ID_SQL = 'SELECT * FROM mfa WHERE user_id = ? AND initialSetup = TRUE';

export const UPDATE_MFA_INITIAL_SETUP_SQL = 'UPDATE mfa SET initialSetup = TRUE WHERE user_id = ? AND initialSetup = FALSE ORDER BY enableAt DESC LIMIT 1';
