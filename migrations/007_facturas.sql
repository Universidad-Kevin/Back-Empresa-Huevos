-- SDI-57: Facturación (Boleta / Factura)
-- Ejecutar: Get-Content migrations/007_facturas.sql | docker compose exec -T db mysql -uhuevos_user -phuevos_password huevos_organicos

CREATE TABLE IF NOT EXISTS facturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  tipo ENUM('boleta','factura') NOT NULL DEFAULT 'boleta',
  numero VARCHAR(20) NOT NULL UNIQUE,
  nombre_razon_social VARCHAR(255) NOT NULL,
  tipo_documento ENUM('dni','ruc','ce','pasaporte') NOT NULL DEFAULT 'dni',
  documento VARCHAR(20) NOT NULL,
  direccion TEXT NULL,
  email_envio VARCHAR(255) NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  igv DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  pdf_base64 LONGTEXT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);
