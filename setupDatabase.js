import mysql from 'mysql2';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function setupDatabase() {
  let connection;

  try {
    // Conectar sin especificar base de datos (usando createConnection en lugar de pool)
    connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true // Permitir múltiples statements
    });

    // Conectar manualmente
    await new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('🔗 Conectado al servidor MySQL');

    // Crear base de datos (sin prepared statements)
    await new Promise((resolve, reject) => {
      connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log(`✅ Base de datos '${process.env.DB_NAME}' creada/verificada`);

    // Usar la base de datos
    await new Promise((resolve, reject) => {
      connection.query(`USE ${process.env.DB_NAME}`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Crear tabla de usuarios
    await new Promise((resolve, reject) => {
      connection.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INT PRIMARY KEY AUTO_INCREMENT,
          nombre VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          rol ENUM('admin', 'empleado') DEFAULT 'empleado',
          activo BOOLEAN DEFAULT TRUE,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Tabla "usuarios" creada');

    // Crear tabla de productos
    await new Promise((resolve, reject) => {
      connection.query(`
        CREATE TABLE IF NOT EXISTS productos (
          id INT PRIMARY KEY AUTO_INCREMENT,
          nombre VARCHAR(255) NOT NULL,
          descripcion TEXT,
          precio DECIMAL(10,2) NOT NULL,
          categoria ENUM('standard', 'premium', 'especial', 'gourmet') NOT NULL,
          imagen VARCHAR(500),
          stock INT DEFAULT 0,
          estado ENUM('activo', 'inactivo') DEFAULT 'activo',
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Tabla "productos" creada');

    // Insertar usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await new Promise((resolve, reject) => {
      connection.query(
        'INSERT IGNORE INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        ['Administrador', 'admin@huevos.com', hashedPassword, 'admin'],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    console.log('✅ Usuario admin creado');

    // Insertar productos de ejemplo
    await new Promise((resolve, reject) => {
      connection.query(`
        INSERT IGNORE INTO productos (nombre, descripcion, precio, categoria, stock) VALUES 
        ('Huevos Orgánicos Grade A', 'Huevos frescos de gallinas criadas libremente', 8.99, 'standard', 150),
        ('Huevos Premium Omega-3', 'Enriquecidos naturalmente con Omega-3', 12.99, 'premium', 80),
        ('Huevos de Codorniz', 'Huevos pequeños llenos de sabor', 6.99, 'especial', 200),
        ('Huevos Azules Araucana', 'Huevos de color azul natural', 15.99, 'gourmet', 50)
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Productos de ejemplo insertados');

    console.log('\n🎉 ¡Base de datos configurada correctamente!');
    console.log('📧 Usuario: admin@huevos.com');
    console.log('🔑 Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      connection.end();
    }
    process.exit();
  }
}

setupDatabase();