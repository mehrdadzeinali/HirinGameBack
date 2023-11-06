const pool = require('../config/db');

const createUserTable = async () => {
  try {
    await pool.execute(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      email_verified BOOLEAN DEFAULT false
    )`);
    console.log("User table created or already exists.");
  } catch (error) {
    console.error("Could not create user table:", error);
  }
};

const findUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

const createUser = async (email, password) => {
  const [result] = await pool.query('INSERT INTO users (email, password, email_verified) VALUES (?, ?, ?)', [email, password, false]);
  return result.insertId;
};

const updateUserEmailVerified = async (id, emailVerified) => {
  const [result] = await pool.query('UPDATE users SET email_verified = ? WHERE id = ?', [emailVerified, id]);
  return result.affectedRows;
};

module.exports = {
  createUserTable,
  findUserByEmail,
  createUser,
  updateUserEmailVerified
};
