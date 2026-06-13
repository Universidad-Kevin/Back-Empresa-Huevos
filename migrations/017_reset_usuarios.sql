-- 017_reset_usuarios.sql
-- Limpia todas las cuentas existentes y crea 3 nuevas con emails reales para pruebas de email.
-- Admin: kevinanthonytenoriorojas159@gmail.com / password
-- Minorista: tutorkevin159@gmail.com / Minorista1
-- Mayorista: kevin2005tenorio@gmail.com / Mayorista1  (tabla clientes)

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM notificaciones;
DELETE FROM favoritos;
DELETE FROM valoraciones;
DELETE FROM carrito;
DELETE FROM detalle_pedidos;
DELETE FROM pagos;
DELETE FROM facturas;
DELETE FROM pedidos;
DELETE FROM password_resets;
DELETE FROM usuarios;
DELETE FROM clientes;

SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE usuarios AUTO_INCREMENT = 1;
ALTER TABLE clientes AUTO_INCREMENT = 1;

INSERT INTO usuarios (nombre, email, password, rol, activo, estado) VALUES
('Kevin Tenorio', 'kevinanthonytenoriorojas159@gmail.com', '$2a$10$PGdfqhu26lk38L75bd7nS.VlbIIvU1oF7WSBISW2bOdlWpddATzMS', 'admin', 1, 'activo'),
('Kevin Tutor',   'tutorkevin159@gmail.com',               '$2a$10$asinujkiJFefDREBuTo.f.2c/9NlsDcv2RVmpu6.jWjg6gK51oEgK', 'cliente', 1, 'activo');

INSERT INTO clientes (nombre_empresa, tipo_negocio, contacto_nombre, email, password, tipo_cliente, estado) VALUES
('Distribuidora Kevin', 'Distribuidora', 'Kevin Mayorista', 'kevin2005tenorio@gmail.com', '$2a$10$Pmh2ND9a7gpKbWNrFYa5reETkUq24mHLLj/oCR5C6T5UVN6Y2S/fq', 'Mayorista', 'activo');
