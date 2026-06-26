-- Agrega columnas codigo y unidad a productos (faltaban en bootstrap.sql original)

SET @sql_codigo = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'productos'
     AND column_name = 'codigo') = 0,
  'ALTER TABLE productos ADD COLUMN codigo VARCHAR(50) NULL UNIQUE AFTER id',
  'SELECT 1'
);
PREPARE stmt FROM @sql_codigo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_unidad = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'productos'
     AND column_name = 'unidad') = 0,
  'ALTER TABLE productos ADD COLUMN unidad VARCHAR(50) NOT NULL DEFAULT ''unidad'' AFTER stock',
  'SELECT 1'
);
PREPARE stmt FROM @sql_unidad;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
