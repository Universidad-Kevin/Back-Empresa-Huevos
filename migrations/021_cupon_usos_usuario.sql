-- SDI-269: Un usuario no puede usar el mismo cupón más de una vez
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
