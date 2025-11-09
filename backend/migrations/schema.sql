CREATE DATABASE IF NOT EXISTS taixiu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taixiu_db;

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS bets;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  balance BIGINT DEFAULT 1000000, -- 1,000,000 mặc định
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  choice ENUM('TAI','XIU') NOT NULL,
  amount BIGINT NOT NULL,
  result ENUM('WIN','LOSE') NULL,
  payout BIGINT NULL,
  dice_sum TINYINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('DEPOSIT','WITHDRAW','BET','PAYOUT') NOT NULL,
  amount BIGINT NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed user demo
INSERT INTO users (username, password, balance) VALUES
('demo', '$2b$10$z8ncz0o8k9u2QHkQbWz9bO3Qy2dvg6gQnA9G9KsT0L1q3rVfG6j1K', 5000000);
-- password for 'demo' is 'password123' (bcrypt hash precomputed)
