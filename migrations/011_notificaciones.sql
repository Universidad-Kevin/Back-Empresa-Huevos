-- SDI-61: Centro de notificaciones
-- Ejecutar: Get-Content migrations/011_notificaciones.sql | docker compose exec -T db mysql -uhuevos_user -phuevos_password huevos_organicos

CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT,
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  datos JSON,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario_leida (usuario_id, leida),
  INDEX idx_creado (creado_en)
);
