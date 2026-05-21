# CampOrganic — Backend

API REST para la plataforma e-commerce de huevos orgánicos. Gestiona autenticación, productos, pedidos, carrito, clientes e interesados.

## Stack tecnológico

| Tecnología | Versión |
|------------|---------|
| Node.js | 18+ |
| Express | 4.18.2 |
| MySQL2 | latest |
| JWT (jsonwebtoken) | latest |
| bcryptjs | latest |
| Nodemailer | latest |

## Requisitos previos

- Docker y Docker Compose (recomendado)
- Node.js 18+ (para ejecución local)
- MySQL 8.0

## Instalación y ejecución

### Con Docker (recomendado)

```bash
docker compose up -d
```

Esto levanta:
- **backend** en `http://localhost:3000`
- **mysql** en el puerto 3306
- **phpmyadmin** en `http://localhost:8080`

La base de datos se inicializa automáticamente con `init.sql`.

### Sin Docker (desarrollo local)

```bash
npm install
npm run dev
```

> Requiere MySQL corriendo localmente con las credenciales del `.env`.

## Variables de entorno

Crear un archivo `.env` en la raíz:

```env
BACKEND_PORT=3000

DB_HOST=db
DB_USER=huevos_user
DB_PASSWORD=huevos_password
DB_NAME=huevos_organicos

JWT_SECRET=tu_secreto_jwt_aqui

# Email (dejar vacío para deshabilitar notificaciones)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password

# URL del frontend (para links en emails)
FRONTEND_URL=http://localhost:5173

# Datos bancarios para transferencias
BANCO_NOMBRE=BCP
BANCO_CUENTA=123456789
BANCO_TITULAR=Tu Nombre
```

> Para el email con Gmail, usa una **App Password** (no la contraseña de la cuenta). Activar en: Cuenta Google → Seguridad → Verificación en dos pasos → Contraseñas de aplicación.

## Estructura del proyecto

```
Back-Empresa-Huevos/
├── config/
│   └── database.js          # Pool de conexiones MySQL
├── controllers/
│   ├── authController.js    # Login y registro
│   ├── carritoController.js # Sincronización del carrito
│   ├── clientesController.js# CRUD clientes mayoristas
│   ├── interesadoController.js
│   ├── pedidosController.js # Pedidos con transacciones
│   ├── productosController.js
│   └── usuariosController.js# Perfil y cambio de contraseña
├── middleware/
│   └── auth.js              # Verificación JWT + roles
├── routes/
│   ├── auth.js
│   ├── carrito.js
│   ├── clientes.js
│   ├── interesados.js
│   ├── pedidos.js
│   ├── productos.js
│   └── usuarios.js
├── services/
│   └── emailService.js      # Notificaciones por email (Nodemailer)
├── init.sql                 # Schema inicial de la base de datos
├── server.js
└── docker-compose.yml
```

## Endpoints de la API

Base URL: `http://localhost:3000/api`

### Autenticación

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/auth/login` | Público | Iniciar sesión |
| POST | `/auth/register` | Público | Registrar usuario (rol: cliente) |

### Productos

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/productos/activos` | Público | Listar productos activos |
| GET | `/productos/all` | Admin | Listar todos los productos |
| GET | `/productos/inactivos` | Admin | Listar productos inactivos |
| GET | `/productos/:id` | Público | Obtener producto por ID |
| POST | `/productos` | Admin | Crear producto |
| PUT | `/productos/:id` | Admin | Actualizar producto |
| DELETE | `/productos/:id` | Admin | Eliminar/desactivar producto |

### Carrito

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/carrito` | Autenticado | Obtener carrito del usuario |
| POST | `/carrito/sync` | Autenticado | Sincronizar carrito local con servidor |
| DELETE | `/carrito` | Autenticado | Vaciar carrito |

### Pedidos

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/pedidos/mis-pedidos` | Cliente | Pedidos del usuario autenticado |
| GET | `/pedidos/:id` | Cliente/Admin | Detalle de pedido |
| POST | `/pedidos` | Cliente | Crear pedido (con transacción y descuento de stock) |
| GET | `/pedidos` | Admin | Todos los pedidos |
| PUT | `/pedidos/:id/estado` | Admin | Cambiar estado del pedido |

### Usuarios

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/usuarios/perfil` | Autenticado | Obtener perfil propio |
| PUT | `/usuarios/perfil` | Autenticado | Actualizar datos o contraseña |

### Clientes mayoristas

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/clientes/all` | Admin | Listar todos los clientes |
| GET | `/clientes/:id` | Admin | Obtener cliente por ID |
| POST | `/clientes` | Admin | Crear cliente |
| PUT | `/clientes/:id` | Admin | Actualizar cliente |
| DELETE | `/clientes/:id` | Admin | Desactivar cliente |

### Interesados

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/interesados` | Público | Registrar formulario de contacto |

## Base de datos

Las tablas se crean automáticamente al iniciar el servidor con `init.sql`.

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Cuentas de acceso (admin, empleado, cliente) |
| `productos` | Catálogo con stock, características JSON y estado |
| `pedidos` | Órdenes de compra con método de pago y estado |
| `detalle_pedidos` | Líneas de cada pedido |
| `carrito` | Carrito persistente por usuario |
| `clientes` | Clientes mayoristas corporativos |
| `interesados` | Registros del formulario de contacto |

### Estados de pedido

`pendiente` → `procesando` → `enviado` → `completado`

(o `cancelado` desde cualquier estado excepto completado)

## Notificaciones por email

El sistema envía emails automáticamente en los siguientes eventos:

- **Registro**: email de bienvenida al nuevo usuario
- **Nuevo pedido**: confirmación con detalle de productos y método de pago
- **Cambio de estado**: notificación al cliente cuando el admin actualiza el pedido

Si `EMAIL_USER` o `EMAIL_PASS` están vacíos, los emails se simulan en consola sin error.

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@camporganic.com` | `password` |

## Relacionado

- [Front-Empresa-Huevos](../Front-Empresa-Huevos) — Interfaz React + Vite
