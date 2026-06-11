-- SDI-93: Cupones y Promociones
-- Ejecutar: Get-Content migrations/008_cupones.sql | docker compose exec -T db mysql -uhuevos_user -phuevos_password huevos_organicos

-- Columnas en pedidos para registrar el cupón usado
ALTER TABLE pedidos
  ADD COLUMN cupon_codigo VARCHAR(50) NULL,
  ADD COLUMN descuento DECIMAL(10,2) NOT NULL DEFAULT 0.00;

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
