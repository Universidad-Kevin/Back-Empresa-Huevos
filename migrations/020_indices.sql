-- SDI-267: Índices en columnas de filtrado/ordenamiento frecuente
-- Compatible con MySQL 5.7+ usando PROCEDURE para idempotencia

DROP PROCEDURE IF EXISTS add_index_if_not_exists;

DELIMITER $$
CREATE PROCEDURE add_index_if_not_exists(
  tbl VARCHAR(64), idx VARCHAR(64), cols VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name   = tbl
      AND index_name   = idx
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD INDEX `', idx, '` (', cols, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- pedidos
CALL add_index_if_not_exists('pedidos', 'idx_pedidos_usuario_id',    'usuario_id');
CALL add_index_if_not_exists('pedidos', 'idx_pedidos_estado',         'estado');
CALL add_index_if_not_exists('pedidos', 'idx_pedidos_creado_en',      'creado_en');
CALL add_index_if_not_exists('pedidos', 'idx_pedidos_usuario_estado', 'usuario_id, estado');

-- productos
CALL add_index_if_not_exists('productos', 'idx_productos_estado_cat',    'estado, categoria_id');
CALL add_index_if_not_exists('productos', 'idx_productos_estado_creado', 'estado, creado_en');

-- favoritos
CALL add_index_if_not_exists('favoritos', 'idx_favoritos_usuario_id', 'usuario_id');

-- notificaciones
CALL add_index_if_not_exists('notificaciones', 'idx_notif_usuario_leida', 'usuario_id, leida');

-- movimientos_inventario
CALL add_index_if_not_exists('movimientos_inventario', 'idx_inv_producto_fecha', 'producto_id, creado_en');

-- password_resets
CALL add_index_if_not_exists('password_resets', 'idx_pr_token', 'token');

-- detalle_pedidos
CALL add_index_if_not_exists('detalle_pedidos', 'idx_dp_pedido_id', 'pedido_id');

DROP PROCEDURE IF EXISTS add_index_if_not_exists;
