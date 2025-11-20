# 🚀 Guía Rápida - QuinielaPro API

## Instalación Rápida

### 1. Instalar Dependencias
```bash
cd api
npm install
```

### 2. Configurar PostgreSQL

**Opción A: PostgreSQL Local**
```bash
# Instalar PostgreSQL
# En Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# Iniciar servicio
sudo service postgresql start

# Crear base de datos
sudo -u postgres createdb quiniela_pro

# Crear usuario (opcional)
sudo -u postgres psql
CREATE USER quiniela_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE quiniela_pro TO quiniela_user;
\q
```

**Opción B: PostgreSQL con Docker**
```bash
docker run --name quiniela-postgres \
  -e POSTGRES_DB=quiniela_pro \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15
```

**Opción C: PostgreSQL Online (Gratis)**
- [Render PostgreSQL](https://render.com) - 512MB gratis
- [Supabase](https://supabase.com) - 500MB gratis
- [ElephantSQL](https://www.elephantsql.com) - 20MB gratis

### 3. Variables de Entorno

El archivo `.env` ya está creado con valores por defecto. Si usas PostgreSQL online, actualiza:

```env
DB_HOST=tu-host.render.com
DB_PORT=5432
DB_NAME=tu_database
DB_USER=tu_usuario
DB_PASSWORD=tu_password
```

### 4. Poblar Base de Datos

```bash
npm run seed
```

Esto creará:
- ✅ 3 usuarios (1 admin, 2 users)
- ✅ 2 quinielas de ejemplo
- ✅ 7 partidos

**Credenciales de prueba:**
- Admin: `admin@quinielapro.com` / `admin123`
- User 1: `juan@example.com` / `password123`
- User 2: `maria@example.com` / `password123`

### 5. Iniciar Servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

La API estará disponible en: `http://localhost:3000`

## 📝 Primeros Pasos

### 1. Verificar que funciona

```bash
curl http://localhost:3000/health
```

Respuesta:
```json
{
  "success": true,
  "status": "OK",
  "timestamp": "2024-11-19T...",
  "uptime": 12.345
}
```

### 2. Login como Admin

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@quinielapro.com",
    "password": "admin123"
  }'
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

**⚠️ IMPORTANTE:** Guarda el `token` para las siguientes peticiones.

### 3. Ver Quinielas Disponibles

```bash
curl http://localhost:3000/api/v1/quinielas/disponibles
```

### 4. Ver Detalle de una Quiniela

```bash
# Usa el ID de una quiniela de la lista anterior
curl http://localhost:3000/api/v1/quinielas/{id}
```

### 5. Comprar una Quiniela (como User)

Primero, login como usuario:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```

Luego, comprar quiniela:
```bash
curl -X POST http://localhost:3000/api/v1/quinielas/{id}/comprar \
  -H "Authorization: Bearer {token_de_juan}" \
  -H "Content-Type: application/json"
```

### 6. Guardar Picks

```bash
curl -X POST http://localhost:3000/api/v1/quinielas/{id}/picks \
  -H "Authorization: Bearer {token_de_juan}" \
  -H "Content-Type: application/json" \
  -d '{
    "picks": [
      {
        "partido_id": "{id_partido_1}",
        "prediccion": "local"
      },
      {
        "partido_id": "{id_partido_2}",
        "prediccion": "visitante"
      }
    ]
  }'
```

### 7. Actualizar Resultado de Partido (como Admin)

```bash
curl -X PUT http://localhost:3000/api/v1/partidos/{id}/resultado \
  -H "Authorization: Bearer {token_admin}" \
  -H "Content-Type: application/json" \
  -d '{
    "marcador_local": 2,
    "marcador_visitante": 1
  }'
```

### 8. Calcular Ganadores (como Admin)

Cuando todos los partidos tengan resultado:

```bash
curl -X POST http://localhost:3000/api/v1/quinielas/{id}/calcular-ganadores \
  -H "Authorization: Bearer {token_admin}"
```

### 9. Ver Tabla de Posiciones

```bash
curl http://localhost:3000/api/v1/quinielas/{id}/tabla-posiciones
```

## 🧪 Probar con Postman/Insomnia

1. Importar colección (próximamente)
2. O crear manualmente:
   - Base URL: `http://localhost:3000/api/v1`
   - Token en headers: `Authorization: Bearer {token}`

## 🐛 Troubleshooting

### Error: "Unable to connect to database"

**Causa:** PostgreSQL no está corriendo o credenciales incorrectas.

**Solución:**
```bash
# Verificar que PostgreSQL está corriendo
sudo service postgresql status

# O con Docker:
docker ps | grep postgres

# Verificar credenciales en .env
cat .env | grep DB_
```

### Error: "Port 3000 already in use"

**Solución:**
```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9
```

### Error: "relation 'users' does not exist"

**Causa:** Tablas no creadas.

**Solución:**
```bash
# Correr seeds (crea tablas automáticamente)
npm run seed
```

### Error en login: "Invalid credentials"

**Solución:**
- Verificar email/password
- Si recién corriste seeds, usa: `admin@quinielapro.com` / `admin123`
- Verificar que el servidor esté corriendo

## 📱 Conectar con Frontend

En tu frontend actual, cambia localStorage por llamadas a la API:

```javascript
// Antes (localStorage)
const quinielas = Storage.obtenerQuinielas();

// Después (API)
const response = await fetch('http://localhost:3000/api/v1/quinielas/disponibles');
const data = await response.json();
const quinielas = data.data;
```

## 🚀 Desplegar a Producción

Ver [README.md](README.md) sección "Deployment" para instrucciones detalladas de:
- Render.com
- Railway.app
- Vercel (serverless)

## 📚 Documentación Completa

- [README.md](README.md) - Documentación completa
- [API Endpoints](README.md#-api-endpoints) - Lista de todos los endpoints
- Código bien comentado en `/src`

## 💡 Próximos Pasos

1. ✅ Conectar frontend con API
2. ⬜ Implementar sistema de pagos (Stripe/PayPal)
3. ⬜ Agregar notificaciones por email
4. ⬜ Implementar WebSockets para actualizaciones en tiempo real
5. ⬜ Agregar sistema de favoritos
6. ⬜ Dashboard de analytics
7. ⬜ Tests automatizados

## 🆘 Ayuda

Si tienes problemas:
1. Revisa esta guía
2. Lee el [README.md](README.md)
3. Revisa los logs del servidor
4. Abre un issue en GitHub
