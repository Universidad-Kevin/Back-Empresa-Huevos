-- SDI-63: Auditoría y logs del sistema
CREATE TABLE IF NOT EXISTS auditoria (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NULL,
  rol         VARCHAR(20),
  accion      VARCHAR(100) NOT NULL,
  entidad     VARCHAR(50),
  entidad_id  INT,
  detalle     JSON,
  ip          VARCHAR(45),
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_accion  (accion),
  INDEX idx_entidad (entidad, entidad_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_fecha   (creado_en)
);
