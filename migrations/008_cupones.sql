-- SDI-93: Cupones y Promociones
-- Usa PREPARE/EXECUTE para compatibilidad con MySQL 8 (IF NOT EXISTS no es estándar en ALTER).

-- Columnas en pedidos para registrar el cupón usado
SET @has_cupon_codigo = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'cupon_codigo'
);
SET @sql = IF(@has_cupon_codigo = 0,
  'ALTER TABLE pedidos ADD COLUMN cupon_codigo VARCHAR(50) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_descuento = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'descuento'
);
SET @sql = IF(@has_descuento = 0,
  'ALTER TABLE pedidos ADD COLUMN descuento DECIMAL(10,2) NOT NULL DEFAULT 0.00',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tabla de cupones
CREATE TABLE IF NOT EXISTS cupones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  tipo ENUM('porcentaje','monto_fijo') NOT NULL DEFAULT 'porcentaje',
  valor DECIMAL(10,2) NOT NULL,
  minimo_compra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  maximo_descuento DECIMAL(10,2) NULL COMMENT 'Solo tipo porcentaje. NULL = sin tope',
  usos_disponibles INT NULL COMMENT 'NULL = ilimitado',
  usos_totales INT NOT NULL DEFAULT 0,
  fecha_inicio DATE NULL,
  fecha_fin DATE NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
