-- 016_seed_productos.sql
-- Seed de ~100 productos organicos comestibles. Sin imagenes (se cargan via dashboard).
-- Incluye presentaciones minoristas y mayoristas por categoria.

INSERT IGNORE INTO categorias (nombre) VALUES
  ('Huevos'),
  ('Verduras'),
  ('Frutas'),
  ('Tuberculos y Raices'),
  ('Granos y Cereales'),
  ('Legumbres'),
  ('Harinas y Pastas'),
  ('Aceites y Vinagres'),
  ('Mermeladas y Conservas'),
  ('Lacteos'),
  ('Hierbas y Especias'),
  ('Bebidas');

INSERT INTO productos (nombre, descripcion, precio, categoria, stock, stock_minimo, estado, imagen) VALUES

-- ============================================================
-- HUEVOS
-- ============================================================
('Huevo Organico Blanco - Bandeja x12',
 'Huevos blancos organicos de gallina de campo libre. Bandeja de 12 unidades.',
 9.50, 'Huevos', 200, 20, 'activo', NULL),

('Huevo Organico Blanco - Bandeja x30',
 'Huevos blancos organicos de gallina de campo libre. Bandeja de 30 unidades.',
 21.00, 'Huevos', 150, 15, 'activo', NULL),

('Huevo Organico Blanco - Caja x180',
 'Caja mayorista de 180 huevos blancos organicos. Ideal para negocios.',
 110.00, 'Huevos', 50, 5, 'activo', NULL),

('Huevo Organico Rojo - Bandeja x12',
 'Huevos rojos organicos de gallina de campo libre. Bandeja de 12 unidades.',
 10.00, 'Huevos', 180, 20, 'activo', NULL),

('Huevo Organico Rojo - Bandeja x30',
 'Huevos rojos organicos de gallina de campo libre. Bandeja de 30 unidades.',
 22.50, 'Huevos', 130, 15, 'activo', NULL),

('Huevo Organico Rojo - Caja x180',
 'Caja mayorista de 180 huevos rojos organicos. Ideal para negocios.',
 118.00, 'Huevos', 40, 5, 'activo', NULL),

('Huevo Organico Omega 3 - Bandeja x12',
 'Huevos enriquecidos con Omega 3. Gallinas alimentadas con lino organico. Bandeja x12.',
 12.00, 'Huevos', 120, 15, 'activo', NULL),

('Huevo Organico Omega 3 - Bandeja x30',
 'Huevos enriquecidos con Omega 3. Gallinas alimentadas con lino organico. Bandeja x30.',
 28.00, 'Huevos', 80, 10, 'activo', NULL),

('Huevo Azul Araucano Organico - Bandeja x12',
 'Huevos de raza Araucana con cascaras naturalmente azules. Bandeja x12.',
 14.00, 'Huevos', 80, 10, 'activo', NULL),

('Huevo Jumbo Organico - Bandeja x12',
 'Huevos de gran tamano con yema grande y nutritiva. Bandeja x12.',
 11.00, 'Huevos', 100, 10, 'activo', NULL),

('Huevo de Codorniz Organico - Bandeja x24',
 'Huevos de codorniz criada en campo abierto. Bandeja x24 unidades.',
 8.50, 'Huevos', 150, 15, 'activo', NULL),

('Huevo de Codorniz Organico - Caja x120',
 'Caja mayorista de 120 huevos de codorniz organicos.',
 38.00, 'Huevos', 30, 5, 'activo', NULL),

-- ============================================================
-- VERDURAS
-- ============================================================
('Lechuga Organica',
 'Lechuga fresca de cultivo organico certificado. 1 unidad.',
 2.50, 'Verduras', 200, 20, 'activo', NULL),

('Lechuga Organica - Caja x20',
 'Caja mayorista de 20 lechugas organicas frescas.',
 38.00, 'Verduras', 30, 3, 'activo', NULL),

('Espinaca Organica',
 'Espinaca organica fresca. Bolsa de 250g.',
 3.00, 'Verduras', 150, 15, 'activo', NULL),

('Tomate Organico',
 'Tomates organicos frescos de temporada. 1 kg.',
 4.50, 'Verduras', 200, 20, 'activo', NULL),

('Tomate Organico - Caja x10kg',
 'Caja mayorista de tomates organicos frescos. 10 kg.',
 38.00, 'Verduras', 30, 3, 'activo', NULL),

('Zanahoria Organica',
 'Zanahorias organicas frescas. 1 kg.',
 3.50, 'Verduras', 200, 20, 'activo', NULL),

('Zanahoria Organica - Saco x10kg',
 'Saco mayorista de zanahorias organicas. 10 kg.',
 28.00, 'Verduras', 30, 3, 'activo', NULL),

('Brocoli Organico',
 'Brocoli organico fresco. 1 unidad aprox. 600g.',
 4.00, 'Verduras', 120, 15, 'activo', NULL),

('Pepino Organico',
 'Pepinos organicos frescos. 1 kg.',
 3.00, 'Verduras', 150, 15, 'activo', NULL),

('Pimiento Rojo Organico',
 'Pimientos rojos organicos frescos. 1 kg.',
 5.00, 'Verduras', 100, 10, 'activo', NULL),

('Pimiento Verde Organico',
 'Pimientos verdes organicos frescos. 1 kg.',
 4.50, 'Verduras', 100, 10, 'activo', NULL),

('Cebolla Organica',
 'Cebollas organicas frescas. 1 kg.',
 3.00, 'Verduras', 250, 25, 'activo', NULL),

('Cebolla Organica - Saco x10kg',
 'Saco mayorista de cebollas organicas. 10 kg.',
 24.00, 'Verduras', 25, 3, 'activo', NULL),

('Coliflor Organica',
 'Coliflor organica fresca. 1 unidad aprox. 800g.',
 5.00, 'Verduras', 80, 10, 'activo', NULL),

('Apio Organico',
 'Apio organico fresco. 1 atado.',
 2.50, 'Verduras', 100, 10, 'activo', NULL),

('Col Organica',
 'Col blanca organica fresca. 1 unidad.',
 3.50, 'Verduras', 100, 10, 'activo', NULL),

('Zapallo Organico',
 'Zapallo organico fresco. Porcion de 1 kg.',
 3.00, 'Verduras', 150, 15, 'activo', NULL),

-- ============================================================
-- FRUTAS
-- ============================================================
('Platano Organico',
 'Platanos organicos maduros de campo. 1 kg.',
 3.50, 'Frutas', 200, 20, 'activo', NULL),

('Platano Organico - Caja x18kg',
 'Caja mayorista de platanos organicos. 18 kg.',
 52.00, 'Frutas', 20, 3, 'activo', NULL),

('Manzana Organica',
 'Manzanas organicas frescas. 1 kg.',
 6.00, 'Frutas', 150, 15, 'activo', NULL),

('Manzana Organica - Caja x18kg',
 'Caja mayorista de manzanas organicas. 18 kg.',
 90.00, 'Frutas', 15, 3, 'activo', NULL),

('Pera Organica',
 'Peras organicas frescas. 1 kg.',
 6.50, 'Frutas', 120, 10, 'activo', NULL),

('Naranja Organica',
 'Naranjas organicas frescas. 1 kg.',
 4.00, 'Frutas', 200, 20, 'activo', NULL),

('Naranja Organica - Caja x15kg',
 'Caja mayorista de naranjas organicas. 15 kg.',
 50.00, 'Frutas', 20, 3, 'activo', NULL),

('Limon Organico',
 'Limones organicos frescos. 1 kg.',
 4.00, 'Frutas', 150, 15, 'activo', NULL),

('Mango Organico',
 'Mangos organicos frescos de temporada. 1 kg.',
 7.00, 'Frutas', 100, 10, 'activo', NULL),

('Papaya Organica',
 'Papaya organica fresca. 1 unidad aprox. 1.5 kg.',
 6.00, 'Frutas', 80, 8, 'activo', NULL),

('Fresa Organica',
 'Fresas organicas frescas. 500g.',
 8.00, 'Frutas', 100, 10, 'activo', NULL),

('Fresa Organica - Caja x5kg',
 'Caja mayorista de fresas organicas. 5 kg.',
 65.00, 'Frutas', 15, 3, 'activo', NULL),

('Arandano Organico',
 'Arandanos organicos frescos. 125g.',
 12.00, 'Frutas', 80, 8, 'activo', NULL),

('Maracuya Organico',
 'Maracuya organico fresco de campo. 1 kg.',
 5.00, 'Frutas', 100, 10, 'activo', NULL),

('Melon Organico',
 'Melon organico fresco. 1 unidad aprox. 2 kg.',
 9.00, 'Frutas', 60, 6, 'activo', NULL),

('Sandia Organica',
 'Sandia organica fresca. 1 unidad aprox. 4 kg.',
 14.00, 'Frutas', 50, 5, 'activo', NULL),

-- ============================================================
-- TUBERCULOS Y RAICES
-- ============================================================
('Papa Organica',
 'Papas organicas frescas de sierra. 2 kg.',
 5.50, 'Tuberculos y Raices', 300, 30, 'activo', NULL),

('Papa Organica - Saco x25kg',
 'Saco mayorista de papas organicas. 25 kg.',
 55.00, 'Tuberculos y Raices', 40, 5, 'activo', NULL),

('Camote Organico',
 'Camotes organicos frescos. 1 kg.',
 3.50, 'Tuberculos y Raices', 200, 20, 'activo', NULL),

('Camote Organico - Saco x20kg',
 'Saco mayorista de camotes organicos. 20 kg.',
 58.00, 'Tuberculos y Raices', 30, 4, 'activo', NULL),

('Yuca Organica',
 'Yuca organica fresca. 1 kg.',
 3.00, 'Tuberculos y Raices', 150, 15, 'activo', NULL),

('Olluco Organico',
 'Ollucos organicos frescos andinos. 500g.',
 3.50, 'Tuberculos y Raices', 100, 10, 'activo', NULL),

('Oca Organica',
 'Oca organica fresca andina. 500g.',
 4.00, 'Tuberculos y Raices', 80, 8, 'activo', NULL),

('Mashua Organica',
 'Mashua organica fresca andina. 500g.',
 4.00, 'Tuberculos y Raices', 80, 8, 'activo', NULL),

-- ============================================================
-- GRANOS Y CEREALES
-- ============================================================
('Quinua Blanca Organica',
 'Quinua blanca organica de los Andes. 500g.',
 9.00, 'Granos y Cereales', 200, 20, 'activo', NULL),

('Quinua Blanca Organica - Saco x25kg',
 'Saco mayorista de quinua blanca organica andina. 25 kg.',
 390.00, 'Granos y Cereales', 20, 3, 'activo', NULL),

('Quinua Roja Organica',
 'Quinua roja organica de los Andes. 500g.',
 10.00, 'Granos y Cereales', 150, 15, 'activo', NULL),

('Quinua Negra Organica',
 'Quinua negra organica de los Andes. 500g.',
 10.50, 'Granos y Cereales', 100, 10, 'activo', NULL),

('Kiwicha Organica',
 'Kiwicha (amaranto) organica andina. 500g.',
 8.00, 'Granos y Cereales', 150, 15, 'activo', NULL),

('Canihua Organica',
 'Canihua organica andina. 500g.',
 9.00, 'Granos y Cereales', 100, 10, 'activo', NULL),

('Avena Organica',
 'Avena organica en hojuelas. 500g.',
 5.50, 'Granos y Cereales', 200, 20, 'activo', NULL),

('Avena Organica - Saco x25kg',
 'Saco mayorista de avena organica en hojuelas. 25 kg.',
 220.00, 'Granos y Cereales', 15, 3, 'activo', NULL),

('Arroz Integral Organico',
 'Arroz integral organico sin pulir. 1 kg.',
 7.00, 'Granos y Cereales', 200, 20, 'activo', NULL),

('Arroz Integral Organico - Saco x50kg',
 'Saco mayorista de arroz integral organico. 50 kg.',
 300.00, 'Granos y Cereales', 15, 3, 'activo', NULL),

('Maiz Morado Organico',
 'Maiz morado organico andino. 500g.',
 6.00, 'Granos y Cereales', 150, 15, 'activo', NULL),

('Trigo Organico en Grano',
 'Trigo organico entero para moler o cocinar. 1 kg.',
 5.00, 'Granos y Cereales', 150, 15, 'activo', NULL),

('Cebada Organica',
 'Cebada organica en grano. 500g.',
 4.50, 'Granos y Cereales', 120, 12, 'activo', NULL),

-- ============================================================
-- LEGUMBRES
-- ============================================================
('Lenteja Organica',
 'Lentejas organicas. 500g.',
 5.00, 'Legumbres', 200, 20, 'activo', NULL),

('Lenteja Organica - Saco x25kg',
 'Saco mayorista de lentejas organicas. 25 kg.',
 210.00, 'Legumbres', 15, 3, 'activo', NULL),

('Garbanzo Organico',
 'Garbanzos organicos. 500g.',
 6.00, 'Legumbres', 150, 15, 'activo', NULL),

('Frijol Negro Organico',
 'Frijoles negros organicos. 500g.',
 5.50, 'Legumbres', 150, 15, 'activo', NULL),

('Frijol Canario Organico',
 'Frijoles canarios organicos. 500g.',
 5.00, 'Legumbres', 150, 15, 'activo', NULL),

('Haba Seca Organica',
 'Habas secas organicas. 500g.',
 5.00, 'Legumbres', 100, 10, 'activo', NULL),

('Soya Organica',
 'Soya organica en grano. 500g.',
 6.50, 'Legumbres', 100, 10, 'activo', NULL),

-- ============================================================
-- HARINAS Y PASTAS
-- ============================================================
('Harina de Quinua Organica',
 'Harina de quinua organica fina. 500g.',
 9.00, 'Harinas y Pastas', 150, 15, 'activo', NULL),

('Harina de Trigo Integral Organica',
 'Harina de trigo integral organica. 1 kg.',
 7.00, 'Harinas y Pastas', 150, 15, 'activo', NULL),

('Harina de Maiz Organica',
 'Harina de maiz organica. 500g.',
 6.00, 'Harinas y Pastas', 100, 10, 'activo', NULL),

('Harina de Kiwicha Organica',
 'Harina de kiwicha organica andina. 500g.',
 9.50, 'Harinas y Pastas', 100, 10, 'activo', NULL),

('Fideos de Quinua Organicos',
 'Fideos elaborados con quinua organica. 250g.',
 7.00, 'Harinas y Pastas', 120, 12, 'activo', NULL),

('Fideos de Trigo Integral Organicos',
 'Fideos de trigo integral organico. 500g.',
 6.00, 'Harinas y Pastas', 120, 12, 'activo', NULL),

-- ============================================================
-- ACEITES Y VINAGRES
-- ============================================================
('Aceite de Oliva Extra Virgen Organico',
 'Aceite de oliva extra virgen organico prensado en frio. 500ml.',
 28.00, 'Aceites y Vinagres', 80, 8, 'activo', NULL),

('Aceite de Oliva Extra Virgen Organico - 5L',
 'Bidon mayorista de aceite de oliva extra virgen organico. 5 litros.',
 230.00, 'Aceites y Vinagres', 20, 3, 'activo', NULL),

('Aceite de Coco Organico',
 'Aceite de coco organico prensado en frio. 250ml.',
 22.00, 'Aceites y Vinagres', 80, 8, 'activo', NULL),

('Aceite de Sacha Inchi Organico',
 'Aceite de sacha inchi organico peruano, rico en Omega 3. 250ml.',
 25.00, 'Aceites y Vinagres', 60, 6, 'activo', NULL),

('Vinagre de Manzana Organico',
 'Vinagre de manzana organico con la madre. 500ml.',
 14.00, 'Aceites y Vinagres', 100, 10, 'activo', NULL),

-- ============================================================
-- MERMELADAS Y CONSERVAS
-- ============================================================
('Mermelada de Fresa Organica',
 'Mermelada artesanal de fresa organica sin conservantes. 250g.',
 12.00, 'Mermeladas y Conservas', 100, 10, 'activo', NULL),

('Mermelada de Mango Organico',
 'Mermelada artesanal de mango organico sin conservantes. 250g.',
 11.00, 'Mermeladas y Conservas', 100, 10, 'activo', NULL),

('Mermelada de Arandano Organica',
 'Mermelada artesanal de arandano organico. 250g.',
 15.00, 'Mermeladas y Conservas', 80, 8, 'activo', NULL),

('Mermelada de Maracuya Organico',
 'Mermelada artesanal de maracuya organico. 250g.',
 11.00, 'Mermeladas y Conservas', 80, 8, 'activo', NULL),

('Miel de Abeja Organica',
 'Miel de abeja pura organica sin procesar. 250g.',
 18.00, 'Mermeladas y Conservas', 100, 10, 'activo', NULL),

('Miel de Abeja Organica - 1kg',
 'Miel de abeja pura organica sin procesar. 1 kg. Para mayoristas.',
 62.00, 'Mermeladas y Conservas', 50, 5, 'activo', NULL),

-- ============================================================
-- LACTEOS
-- ============================================================
('Leche de Vaca Organica',
 'Leche fresca organica de vaca de pastoreo. 1 litro.',
 5.50, 'Lacteos', 150, 15, 'activo', NULL),

('Leche de Vaca Organica - Pack x6L',
 'Pack mayorista de 6 litros de leche organica de vaca de pastoreo.',
 28.00, 'Lacteos', 40, 5, 'activo', NULL),

('Yogur Natural Organico',
 'Yogur natural organico sin azucar ni conservantes. 200g.',
 5.00, 'Lacteos', 120, 12, 'activo', NULL),

('Yogur Natural Organico - 1kg',
 'Yogur natural organico sin azucar. Presentacion 1 kg para mayoristas.',
 20.00, 'Lacteos', 60, 6, 'activo', NULL),

('Queso Fresco Organico',
 'Queso fresco organico artesanal de leche de pastoreo. 250g.',
 10.00, 'Lacteos', 100, 10, 'activo', NULL),

('Mantequilla Organica',
 'Mantequilla organica sin sal elaborada con leche de pastoreo. 200g.',
 12.00, 'Lacteos', 80, 8, 'activo', NULL),

-- ============================================================
-- HIERBAS Y ESPECIAS
-- ============================================================
('Oregano Organico Seco',
 'Oregano organico deshidratado. 50g.',
 4.50, 'Hierbas y Especias', 150, 15, 'activo', NULL),

('Tomillo Organico Seco',
 'Tomillo organico deshidratado. 50g.',
 4.50, 'Hierbas y Especias', 120, 12, 'activo', NULL),

('Albahaca Organica Seca',
 'Albahaca organica deshidratada. 50g.',
 5.00, 'Hierbas y Especias', 120, 12, 'activo', NULL),

('Curcuma Organica en Polvo',
 'Curcuma organica molida. 100g.',
 7.00, 'Hierbas y Especias', 100, 10, 'activo', NULL),

('Jengibre Organico en Polvo',
 'Jengibre organico molido. 100g.',
 7.00, 'Hierbas y Especias', 100, 10, 'activo', NULL),

('Canela Organica en Polvo',
 'Canela organica de Ceylon molida. 100g.',
 6.50, 'Hierbas y Especias', 100, 10, 'activo', NULL),

('Aji Panca Organico Molido',
 'Aji panca organico peruano molido. 100g.',
 6.00, 'Hierbas y Especias', 100, 10, 'activo', NULL),

('Aji Amarillo Organico Molido',
 'Aji amarillo organico peruano molido. 100g.',
 6.00, 'Hierbas y Especias', 100, 10, 'activo', NULL),

-- ============================================================
-- BEBIDAS
-- ============================================================
('Infusion de Manzanilla Organica',
 'Infusion de manzanilla organica. Caja x25 sobres.',
 6.50, 'Bebidas', 150, 15, 'activo', NULL),

('Infusion de Menta Organica',
 'Infusion de menta organica. Caja x25 sobres.',
 6.50, 'Bebidas', 150, 15, 'activo', NULL),

('Infusion de Jengibre Organico',
 'Infusion de jengibre organico. Caja x25 sobres.',
 7.00, 'Bebidas', 120, 12, 'activo', NULL),

('Infusion de Muna Organica',
 'Infusion de muna organica andina. Caja x25 sobres.',
 7.00, 'Bebidas', 100, 10, 'activo', NULL),

('Cafe Organico Molido',
 'Cafe organico de altura molido. 250g.',
 18.00, 'Bebidas', 100, 10, 'activo', NULL),

('Cafe Organico Molido - Bolsa x1kg',
 'Bolsa mayorista de cafe organico de altura molido. 1 kg.',
 65.00, 'Bebidas', 30, 4, 'activo', NULL),

('Cafe Organico en Grano',
 'Cafe organico de altura en grano entero. 250g.',
 20.00, 'Bebidas', 80, 8, 'activo', NULL),

('Chocolate Organico en Polvo',
 'Cacao organico en polvo sin azucar. 200g.',
 14.00, 'Bebidas', 100, 10, 'activo', NULL),

('Agua de Coco Organica',
 'Agua de coco organica natural sin azucar. 330ml.',
 5.50, 'Bebidas', 150, 15, 'activo', NULL),

('Agua de Coco Organica - Pack x24',
 'Pack mayorista de 24 unidades de agua de coco organica. 330ml c/u.',
 110.00, 'Bebidas', 20, 3, 'activo', NULL);
