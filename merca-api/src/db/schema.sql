CREATE DATABASE IF NOT EXISTS merca_isky;
USE merca_isky;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NULL,
  password VARCHAR(255) NULL,
  name VARCHAR(255),
  wallet_address VARCHAR(42) UNIQUE NULL,
  first_name VARCHAR(100) NULL,
  middle_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  business_name VARCHAR(255) NULL,
  phone VARCHAR(20) NULL,
  kyc_status ENUM('not_started','pending','approved','rejected')
    DEFAULT 'not_started',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  filename VARCHAR(255) NOT NULL,
  url VARCHAR(255) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  paid_date TIMESTAMP NULL,
  on_chain_id VARCHAR(66) UNIQUE NULL,
  tx_hash VARCHAR(66) NULL,
  wallet_address VARCHAR(42) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('payment', 'invoice', 'system', 'security') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('unread', 'read') NOT NULL DEFAULT 'unread',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);