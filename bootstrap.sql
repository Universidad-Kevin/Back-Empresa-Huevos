-- =============================================================
-- CampOrganic — Bootstrap de esquema de BD (SDI-115)
-- Idempotente para BD nueva. En BD existente el backend
-- detecta que las tablas ya existen y omite este script.
-- Última actualización: 2026-06-11
-- =============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------
-- TABLAS BASE (sin dependencias entre sí)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categorias (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  color       VARCHAR(7) DEFAULT '#6c757d',
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marcas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password       VARCHAR(255) NOT NULL,
  rol            ENUM('admin','empleado','cliente') DEFAULT 'cliente',
  activo         BOOLEAN DEFAULT TRUE,
  estado         ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proveedores (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(255) NOT NULL,
  contacto_nombre VARCHAR(255),
  email           VARCHAR(255),
  telefono        VARCHAR(50),
  direccion       TEXT,
  ruc             VARCHAR(20),
  notas           TEXT,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre_empresa  VARCHAR(255) NOT NULL,
  tipo_negocio    VARCHAR(100) NOT NULL,
  contacto_nombre VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password        VARCHAR(255) NULL,
  telefono        VARCHAR(50),
  direccion       TEXT,
  ruc             VARCHAR(50),
  tipo_cliente    VARCHAR(50) DEFAULT 'Mayorista',
  limite_credito  DECIMAL(10,2) DEFAULT 0,
  estado          ENUM('activo','inactivo','pendiente') DEFAULT 'activo',
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interesados (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(255) NOT NULL,
  email     VARCHAR(255) NOT NULL,
  telefono  VARCHAR(50) NOT NULL,
  asunto    VARCHAR(255),
  mensaje   TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cupones (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  codigo           VARCHAR(50) NOT NULL UNIQUE,
  descripcion      VARCHAR(255) NULL,
  tipo             ENUM('porcentaje','monto_fijo') NOT NULL DEFAULT 'porcentaje',
  valor            DECIMAL(10,2) NOT NULL,
  minimo_compra    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  maximo_descuento DECIMAL(10,2) NULL,
  usos_disponibles INT NULL,
  usos_totales     INT NOT NULL DEFAULT 0,
  fecha_inicio     DATE NULL,
  fecha_fin        DATE NULL,
  activo           TINYINT(1) NOT NULL DEFAULT 1,
  creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cupon_usos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  cupon_id   INT NOT NULL,
  usuario_id INT NOT NULL,
  pedido_id  INT NOT NULL,
  usado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cupon_usuario (cupon_id, usuario_id),
  CONSTRAINT fk_cu_cupon   FOREIGN KEY (cupon_id)   REFERENCES cupones(id)  ON DELETE CASCADE,
  CONSTRAINT fk_cu_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_cu_pedido  FOREIGN KEY (pedido_id)  REFERENCES pedidos(id)  ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- PRODUCTOS (depende de categorias y marcas)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS productos (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  codigo                 VARCHAR(50) NULL UNIQUE,
  nombre                 VARCHAR(255) NOT NULL,
  descripcion            TEXT,
  precio                 DECIMAL(10,2) NOT NULL,
  categoria              VARCHAR(100),
  categoria_id           INT,
  marca_id               INT,
  imagen                 MEDIUMTEXT,
  stock                  INT DEFAULT 0,
  unidad                 VARCHAR(50) NOT NULL DEFAULT 'unidad',
  stock_minimo           INT NOT NULL DEFAULT 5,
  ultima_alerta_stock_en TIMESTAMP NULL,
  estado                 ENUM('activo','inactivo') DEFAULT 'activo',
  caracteristicas        JSON,
  creado_en              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  FOREIGN KEY (marca_id)     REFERENCES marcas(id)     ON DELETE SET NULL
);

-- -------------------------------------------------------------
-- PEDIDOS (depende de usuarios)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pedidos (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id           INT NOT NULL,
  cliente_id           INT NULL,
  estado               ENUM('pendiente','confirmado','preparando','enviado','entregado','cancelado','devuelto') NOT NULL DEFAULT 'pendiente',
  metodo_pago          ENUM('efectivo','yape','plin','transferencia','tarjeta') NOT NULL DEFAULT 'efectivo',
  estado_pago          ENUM('pendiente','pagado') NOT NULL DEFAULT 'pendiente',
  total                DECIMAL(10,2) NOT NULL,
  nota                 TEXT,
  dir_calle            VARCHAR(200) NULL,
  dir_distrito         VARCHAR(100) NULL,
  dir_referencia       VARCHAR(200) NULL,
  codigo_verificacion  VARCHAR(20) UNIQUE,
  motivo_cancelacion   TEXT,
  cupon_codigo         VARCHAR(50) NULL,
  descuento            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  creado_en            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- -------------------------------------------------------------
-- TABLAS QUE DEPENDEN DE PEDIDOS / PRODUCTOS / USUARIOS
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id       INT NOT NULL,
  producto_id     INT NOT NULL,
  cantidad        INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  nombre_producto VARCHAR(255) NOT NULL,
  FOREIGN KEY (pedido_id)   REFERENCES pedidos(id)   ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS carrito (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT NOT NULL,
  producto_id    INT NOT NULL,
  cantidad       INT NOT NULL DEFAULT 1,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY usuario_producto (usuario_id, producto_id),
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  producto_id    INT NOT NULL,
  tipo           ENUM('entrada','salida','ajuste','pedido','devolucion','cancelacion') NOT NULL,
  cantidad       INT NOT NULL,
  stock_anterior INT NOT NULL,
  stock_nuevo    INT NOT NULL,
  motivo         TEXT,
  pedido_id      INT,
  usuario_id     INT,
  proveedor_id   INT,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id)  REFERENCES productos(id)  ON DELETE CASCADE,
  FOREIGN KEY (pedido_id)    REFERENCES pedidos(id)    ON DELETE SET NULL,
  FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)   ON DELETE SET NULL,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
  INDEX idx_producto (producto_id),
  INDEX idx_creado   (creado_en)
);

CREATE TABLE IF NOT EXISTS pagos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id      INT NOT NULL,
  metodo         ENUM('efectivo','yape','plin','transferencia','tarjeta') NOT NULL,
  estado         ENUM('pendiente','verificado','rechazado','reembolsado') NOT NULL DEFAULT 'pendiente',
  monto          DECIMAL(10,2) NOT NULL,
  voucher        MEDIUMTEXT NULL,
  notas_admin    TEXT NULL,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS facturas (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id           INT NOT NULL,
  tipo                ENUM('boleta','factura') NOT NULL DEFAULT 'boleta',
  numero              VARCHAR(20) NOT NULL UNIQUE,
  nombre_razon_social VARCHAR(255) NOT NULL,
  tipo_documento      ENUM('dni','ruc','ce','pasaporte') NOT NULL DEFAULT 'dni',
  documento           VARCHAR(20) NOT NULL,
  direccion           TEXT NULL,
  email_envio         VARCHAR(255) NULL,
  subtotal            DECIMAL(10,2) NOT NULL,
  igv                 DECIMAL(10,2) NOT NULL,
  total               DECIMAL(10,2) NOT NULL,
  pdf_base64          LONGTEXT NULL,
  creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favoritos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  producto_id INT NOT NULL,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuario_producto (usuario_id, producto_id),
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS valoraciones (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT NOT NULL,
  producto_id    INT NOT NULL,
  puntuacion     TINYINT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario     TEXT,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuario_producto (usuario_id, producto_id),
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  INDEX idx_producto (producto_id)
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo       VARCHAR(50) NOT NULL,
  titulo     VARCHAR(200) NOT NULL,
  mensaje    TEXT,
  leida      BOOLEAN NOT NULL DEFAULT FALSE,
  datos      JSON,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario_leida (usuario_id, leida),
  INDEX idx_creado        (creado_en)
);

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

-- -------------------------------------------------------------
-- SEEDS
-- -------------------------------------------------------------

INSERT IGNORE INTO categorias (nombre) VALUES
  ('standard'), ('premium'), ('especial'), ('gourmet');

-- Admin por defecto. password = "password" — CAMBIAR EN PRODUCCIÓN via SDI-121
INSERT IGNORE INTO usuarios (nombre, email, password, rol) VALUES
  ('Administrador', 'admin@camporganic.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'admin');

SET FOREIGN_KEY_CHECKS = 1;
