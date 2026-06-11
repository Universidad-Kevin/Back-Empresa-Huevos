-- Recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  token      VARCHAR(64) NOT NULL UNIQUE,
  expira_en  DATETIME NOT NULL,
  usado      TINYINT(1) NOT NULL DEFAULT 0,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_email (email)
);
