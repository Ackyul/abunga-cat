-- Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    fruta VARCHAR(100) NOT NULL,
    image TEXT,
    precio NUMERIC(10, 2),
    precios JSONB,
    brand VARCHAR(255) DEFAULT 'Abunga'
);

-- Tabla de Noticias
CREATE TABLE IF NOT EXISTS noticias (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Limpiar la tabla para evitar duplicados si se vuelve a correr
TRUNCATE TABLE productos RESTART IDENTITY;

-- Sembrar productos con todos sus precios estructurados
INSERT INTO productos (name, tipo, fruta, image, precio, precios, brand) VALUES
('Láminas de Fresa', 'Láminas', 'Fresa', NULL, 10.00, NULL, 'Abunga'),
('Láminas de Tamarindo', 'Láminas', 'Tamarindo', NULL, 10.00, NULL, 'Abunga'),
('Láminas de Piña', 'Láminas', 'Piña', NULL, 10.00, NULL, 'Abunga'),
('Láminas de Coco', 'Láminas', 'Coco', NULL, 10.00, NULL, 'Abunga'),
('Láminas de Acaí', 'Láminas', 'Acaí', NULL, 10.00, NULL, 'Abunga'),
('Láminas de Maracuyá', 'Láminas', 'Maracuyá', NULL, 10.00, NULL, 'Abunga'),
('Láminas de Sandía', 'Láminas', 'Sandía', NULL, 10.00, NULL, 'Abunga'),
('Láminas de Papaya', 'Láminas', 'Papaya', NULL, 10.00, NULL, 'Abunga'),
('Láminas de Cacao', 'Láminas', 'Cacao', NULL, 10.00, NULL, 'Abunga'),
('Fresa Deshidratada', 'Fruta', 'Fresa', NULL, 13.00, '{"50gr": 13, "100gr": 25, "500gr": 120, "1kg": 220}', 'Abunga'),
('Plátano Deshidratado', 'Fruta', 'Plátano', NULL, 8.00, '{"50gr": 8, "100gr": 15, "500gr": 70, "1kg": 130}', 'Abunga'),
('Mango Deshidratado', 'Fruta', 'Mango', NULL, 10.00, '{"50gr": 10, "100gr": 20, "500gr": 95, "1kg": 180}', 'Abunga'),
('Papaya Deshidratada', 'Fruta', 'Papaya', NULL, 8.00, '{"50gr": 8, "100gr": 16, "500gr": 70, "1kg": 130}', 'Abunga'),
('Piña Deshidratada', 'Fruta', 'Piña', NULL, 9.00, '{"50gr": 9, "100gr": 18, "500gr": 85, "1kg": 160}', 'Abunga'),
('Manzana Deshidratada', 'Fruta', 'Manzana', NULL, 10.00, '{"50gr": 10, "100gr": 20, "500gr": 95, "1kg": 180}', 'Abunga'),
('Ritual Calma', 'Infusión', 'Manzana', NULL, 10.00, NULL, 'Abunga'),
('Ritual Energía Tropical', 'Infusión', 'Piña y naranja', NULL, 10.00, NULL, 'Abunga'),
('Ritual Defensa', 'Infusión', 'Fresa y arandano', NULL, 10.00, NULL, 'Abunga'),
('Ritual Digestión', 'Infusión', 'Piña', NULL, 10.00, NULL, 'Abunga'),
('Manzana Deshidratada con Canela', 'Fruta', 'Manzana', NULL, 10.00, NULL, 'Abunga'),
('Naranja Deshidratada', 'Fruta', 'Naranja', NULL, 10.00, NULL, 'Abunga');

-- Sembrar noticias iniciales
TRUNCATE TABLE noticias RESTART IDENTITY;
INSERT INTO noticias (title, content, image) VALUES
('¡Lanzamiento de nuestra web!', 'Bienvenidos a nuestra nueva tienda en línea de Abunga. Ahora puedes armar tus mixtos deshidratados de forma personalizada desde la comodidad de tu hogar.', NULL);
