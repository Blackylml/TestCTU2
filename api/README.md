# QuinielaPro API

API REST escalable para sistema de gestión de quinielas deportivas.

## 🚀 Características

- ✅ Autenticación JWT
- ✅ Autorización basada en roles (Admin/User)
- ✅ CRUD completo de quinielas
- ✅ Sistema de picks y predicciones
- ✅ Cálculo automático de ganadores
- ✅ Distribución de premios
- ✅ Tabla de posiciones
- ✅ Estadísticas de usuarios y quinielas
- ✅ Validación de datos
- ✅ Rate limiting
- ✅ Manejo centralizado de errores
- ✅ Base de datos PostgreSQL
- ✅ Arquitectura escalable y modular

## 📋 Requisitos

- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm >= 9.0.0

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
cd api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quiniela_pro
DB_USER=postgres
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=tu_secret_super_secreto
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

4. **Crear base de datos**
```bash
# En PostgreSQL
createdb quiniela_pro
```

5. **Poblar base de datos con datos de prueba (opcional)**
```bash
npm run seed
```

6. **Iniciar servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 API Endpoints

### Autenticación (`/api/v1/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Registrar usuario | No |
| POST | `/login` | Login | No |
| GET | `/profile` | Obtener perfil | Sí |
| PUT | `/profile` | Actualizar perfil | Sí |
| PUT | `/change-password` | Cambiar contraseña | Sí |

### Quinielas (`/api/v1/quinielas`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/` | Listar quinielas | No | - |
| GET | `/disponibles` | Quinielas disponibles | No | - |
| GET | `/:id` | Obtener quiniela | No | - |
| POST | `/` | Crear quiniela | Sí | Admin |
| PUT | `/:id` | Actualizar quiniela | Sí | Admin |
| DELETE | `/:id` | Eliminar quiniela | Sí | Admin |
| POST | `/:id/activar` | Activar quiniela | Sí | Admin |
| POST | `/:id/comprar` | Comprar quiniela | Sí | User |
| POST | `/:id/picks` | Guardar picks | Sí | User |
| GET | `/:id/tabla-posiciones` | Tabla de posiciones | No | - |
| GET | `/:id/stats` | Estadísticas | No | - |
| POST | `/:id/calcular-ganadores` | Calcular ganadores | Sí | Admin |

### Partidos (`/api/v1/partidos`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/:id` | Obtener partido | No | - |
| POST | `/` | Crear partido | Sí | Admin |
| PUT | `/:id` | Actualizar partido | Sí | Admin |
| PUT | `/:id/resultado` | Actualizar resultado | Sí | Admin |
| DELETE | `/:id` | Eliminar partido | Sí | Admin |

## 📦 Estructura del Proyecto

```
api/
├── src/
│   ├── config/           # Configuraciones
│   │   ├── database.js
│   │   ├── jwt.js
│   │   └── constants.js
│   ├── models/           # Modelos de base de datos
│   │   ├── User.js
│   │   ├── Quiniela.js
│   │   ├── Partido.js
│   │   ├── Participacion.js
│   │   ├── Pick.js
│   │   └── index.js
│   ├── controllers/      # Controladores
│   │   ├── authController.js
│   │   ├── quinielasController.js
│   │   └── partidosController.js
│   ├── services/         # Lógica de negocio
│   │   ├── authService.js
│   │   ├── quinielaService.js
│   │   ├── calculatorService.js
│   │   └── notificationService.js
│   ├── middleware/       # Middlewares
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── validator.js
│   │   └── rateLimiter.js
│   ├── routes/           # Rutas
│   │   ├── auth.js
│   │   ├── quinielas.js
│   │   └── partidos.js
│   ├── database/         # Migrations y seeds
│   │   └── seeds/
│   └── app.js
├── server.js             # Punto de entrada
├── package.json
├── .env.example
└── README.md
```

## 🔐 Autenticación

La API usa JWT (JSON Web Tokens) para autenticación.

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@quinielapro.com",
  "password": "admin123"
}
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

### Usar token
```bash
GET /api/v1/auth/profile
Authorization: Bearer {token}
```

## 💡 Ejemplos de Uso

### Crear Quiniela (Admin)
```bash
POST /api/v1/quinielas
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "nombre": "Liga MX Jornada 18",
  "descripcion": "Quiniela de la jornada 18",
  "deporte": "futbol",
  "precio": 50,
  "premio_total": 5000,
  "premio_primero": 3000,
  "premio_segundo": 1500,
  "premio_tercero": 500,
  "max_participantes": 100,
  "fecha_inicio": "2024-12-20T00:00:00Z",
  "fecha_cierre": "2024-12-25T00:00:00Z",
  "partidos": [
    {
      "equipo_local": "América",
      "equipo_visitante": "Chivas",
      "fecha_partido": "2024-12-20T19:00:00Z",
      "liga": "Liga MX"
    }
  ]
}
```

### Comprar Quiniela (User)
```bash
POST /api/v1/quinielas/{id}/comprar
Authorization: Bearer {user_token}
```

### Guardar Picks (User)
```bash
POST /api/v1/quinielas/{id}/picks
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "picks": [
    {
      "partido_id": "uuid-del-partido",
      "prediccion": "local"
    },
    {
      "partido_id": "uuid-del-partido-2",
      "prediccion": "visitante"
    }
  ]
}
```

### Actualizar Resultado (Admin)
```bash
PUT /api/v1/partidos/{id}/resultado
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "marcador_local": 2,
  "marcador_visitante": 1
}
```

### Calcular Ganadores (Admin)
```bash
POST /api/v1/quinielas/{id}/calcular-ganadores
Authorization: Bearer {admin_token}
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm test
```

## 🚢 Deployment

### Render.com (Recomendado)

1. Crear cuenta en Render.com
2. Crear nuevo Web Service
3. Conectar repositorio
4. Configurar:
   - Build Command: `cd api && npm install`
   - Start Command: `cd api && npm start`
5. Agregar variables de entorno
6. Deploy!

### Railway.app

1. Crear cuenta en Railway.app
2. New Project → Deploy from GitHub
3. Seleccionar repositorio
4. Configurar variables de entorno
5. Deploy automático

## 📝 Variables de Entorno

Ver `.env.example` para todas las variables disponibles.

### Variables Críticas:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` (cambiar en producción!)
- `NODE_ENV` (production/development)
- `PORT`
- `CORS_ORIGIN`

## 🔒 Seguridad

- ✅ Bcrypt para passwords
- ✅ JWT para autenticación
- ✅ Helmet para headers de seguridad
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Validación de inputs
- ✅ SQL injection protection (Sequelize)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch (`git checkout -b feature/nueva-feature`)
3. Commit cambios (`git commit -m 'Agregar nueva feature'`)
4. Push al branch (`git push origin feature/nueva-feature`)
5. Abrir Pull Request

## 📄 Licencia

MIT

## 👨‍💻 Autor

QuinielaPro Team

## 🆘 Soporte

Para reportar bugs o solicitar features, abrir un issue en GitHub.
