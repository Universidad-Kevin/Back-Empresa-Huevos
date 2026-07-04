-- SDI-142: tabla de configuración general de la empresa, editable desde /admin/configuracion.
-- Fila única (id = 1); no hay multi-tenant en este sistema.
CREATE TABLE IF NOT EXISTS configuracion (
  id             INT PRIMARY KEY DEFAULT 1,
  nombre_empresa VARCHAR(150) NOT NULL,
  email_contacto VARCHAR(150) NOT NULL,
  telefono       VARCHAR(30),
  direccion      VARCHAR(200),
  descripcion    VARCHAR(2000),
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_configuracion_singleton CHECK (id = 1)
);

INSERT IGNORE INTO configuracion (id, nombre_empresa, email_contacto, telefono, direccion) VALUES
  (1, 'CampOrganic', 'admin@camporganic.com', '+51 234 567 890', 'Av. Principal 123, Ciudad');
