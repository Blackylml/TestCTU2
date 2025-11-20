# 🚀 Guía de Nuevas Funcionalidades

## 📋 Tabla de Contenido
1. [Google OAuth](#google-oauth)
2. [RapidAPI Football](#rapidapi-football)
3. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🔐 Google OAuth

### **¿Qué es?**
Permite a los usuarios iniciar sesión con su cuenta de Google sin necesidad de crear una contraseña.

### **Configuración**

Configurar credenciales de Google OAuth en `.env`:
```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
```

**Obtener credenciales:**
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto o usar existente
3. Activar Google+ API
4. Crear credenciales OAuth 2.0
5. Configurar URLs autorizadas
6. Copiar Client ID y Secret al `.env`

### **Endpoints**

#### **1. Obtener URL de autorización**
```http
GET /api/v1/auth/google
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

**Uso desde frontend:**
```javascript
// Obtener URL
const res = await fetch('http://localhost:3000/api/v1/auth/google');
const { data } = await res.json();

// Redirigir usuario
window.location.href = data.authUrl;
```

#### **2. Login con Google (método recomendado para frontend)**
```http
POST /api/v1/auth/google/login
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "...",
      "nombre": "Juan Pérez",
      "email": "juan@gmail.com",
      "avatar_url": "https://lh3.googleusercontent.com/...",
      "google_id": "1234567890"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "isNewUser": false
  }
}
```

**Implementación en frontend con Google Sign-In:**

1. **Cargar librería de Google:**
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

2. **HTML del botón:**
```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
     data-callback="handleGoogleSignIn">
</div>
<div class="g_id_signin" data-type="standard"></div>
```

3. **JavaScript:**
```javascript
async function handleGoogleSignIn(response) {
  const idToken = response.credential;

  // Enviar token a tu API
  const res = await fetch('http://localhost:3000/api/v1/auth/google/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  const data = await res.json();

  if (data.success) {
    // Guardar token
    localStorage.setItem('token', data.data.token);

    // Mostrar mensaje de bienvenida
    if (data.data.isNewUser) {
      alert('¡Bienvenido! Tu cuenta ha sido creada.');
    } else {
      alert('¡Bienvenido de nuevo!');
    }

    // Redirigir
    window.location.href = '/dashboard';
  }
}
```

#### **3. Vincular cuenta de Google (usuario existente)**
```http
POST /api/v1/auth/google/link
Authorization: Bearer {token}
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

#### **4. Desvincular cuenta de Google**
```http
POST /api/v1/auth/google/unlink
Authorization: Bearer {token}
```

**Nota:** No se puede desvincular si no hay contraseña configurada.

---

## ⚽ RapidAPI Football

### **¿Qué es?**
Integración con RapidAPI Football para obtener fixtures (partidos) reales de ligas profesionales automáticamente.

### **Configuración**

Ya está configurado:
```env
FOOTBALL_API_HOST=api-football-v1.p.rapidapi.com
FOOTBALL_API_KEY=1dec45416emsh269d1d4adce38e2p136b9bjsn951df1a6d6c5
```

### **Ligas Disponibles**

24+ ligas configuradas:
- ⚽ Liga MX (ID: 262)
- ⚽ MLS (ID: 253)
- ⚽ Leagues Cup (ID: 772)
- ⚽ CONCACAF Champions League (ID: 16)
- ⚽ UEFA Champions League (ID: 2)
- ⚽ Premier League (ID: 39)
- ⚽ La Liga (ID: 140)
- ⚽ Serie A (ID: 135)
- ⚽ Bundesliga (ID: 78)
- ⚽ Y más...

### **Endpoints**

#### **1. Listar ligas disponibles**
```http
GET /api/v1/football/leagues
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "key": "liga_mx",
      "id": 262,
      "name": "Liga MX",
      "country": "Mexico"
    },
    {
      "key": "premier_league",
      "id": 39,
      "name": "Premier League",
      "country": "England"
    }
    // ...
  ],
  "count": 24
}
```

#### **2. Buscar liga**
```http
GET /api/v1/football/search?q=liga mx
```

#### **3. Obtener fixtures de una liga**
```http
GET /api/v1/football/fixtures/:leagueKey?season=2024&from=2024-12-01&to=2024-12-31
```

**Ejemplo:**
```http
GET /api/v1/football/fixtures/liga_mx?from=2024-12-01&to=2024-12-31
```

**Respuesta:**
```json
{
  "success": true,
  "liga": {
    "key": "liga_mx",
    "id": 262,
    "name": "Liga MX",
    "country": "Mexico"
  },
  "fixtures": [
    {
      "equipo_local": "América",
      "equipo_visitante": "Chivas",
      "fecha_partido": "2024-12-01T19:00:00.000Z",
      "liga": "Liga MX",
      "jornada": "Jornada 17",
      "estadio": "Estadio Azteca",
      "ciudad": "Mexico City",
      "external_id": "1234567",
      "metadata": {
        "api_source": "rapidapi-football",
        "league_id": 262,
        "season": 2024,
        "referee": "César Arturo Ramos",
        "logo_local": "https://media.api-sports.io/football/teams/2825.png",
        "logo_visitante": "https://media.api-sports.io/football/teams/2826.png"
      }
    }
    // ... más fixtures
  ],
  "count": 10
}
```

#### **4. Importar fixtures a quiniela (Admin)**
```http
POST /api/v1/football/import/:quinielaId
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "fixtures": [
    {
      "equipo_local": "América",
      "equipo_visitante": "Chivas",
      "fecha_partido": "2024-12-01T19:00:00.000Z",
      "liga": "Liga MX",
      "jornada": "Jornada 17",
      "estadio": "Estadio Azteca",
      "ciudad": "Mexico City",
      "external_id": "1234567"
    }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "10 partidos importados exitosamente",
  "data": [...]
}
```

#### **5. Fixtures en vivo**
```http
GET /api/v1/football/fixtures/live
```

#### **6. Sincronizar resultados automáticamente (Admin)**
```http
POST /api/v1/football/sync-results
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "partidoIds": [
    "uuid-partido-1",
    "uuid-partido-2"
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "3 partidos actualizados",
  "data": {
    "total": 5,
    "updated": 3,
    "results": [
      {
        "external_id": "1234567",
        "completed": true,
        "marcador_local": 2,
        "marcador_visitante": 1
      }
    ]
  }
}
```

---

## 💡 Ejemplos de Uso Completos

### **Ejemplo 1: Crear quiniela con partidos de la API**

```javascript
// 1. Login como admin
const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@quinielapro.com',
    password: 'admin123'
  })
});
const { data: { token } } = await loginRes.json();

// 2. Crear quiniela
const quinielaRes = await fetch('http://localhost:3000/api/v1/quinielas', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nombre: 'Liga MX Jornada 18',
    descripcion: 'Quiniela de la jornada 18',
    deporte: 'futbol',
    precio: 50,
    premio_total: 5000,
    premio_primero: 3000,
    fecha_inicio: '2024-12-20T00:00:00Z',
    fecha_cierre: '2024-12-25T00:00:00Z'
  })
});
const { data: quiniela } = await quinielaRes.json();

// 3. Obtener fixtures de Liga MX
const fixturesRes = await fetch(
  'http://localhost:3000/api/v1/football/fixtures/liga_mx?from=2024-12-20&to=2024-12-25'
);
const { fixtures } = await fixturesRes.json();

// 4. Importar fixtures a la quiniela
const importRes = await fetch(`http://localhost:3000/api/v1/football/import/${quiniela.id}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ fixtures })
});

console.log('✅ Quiniela creada con partidos reales!');
```

### **Ejemplo 2: Login con Google en tu frontend**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Login con Google - QuinielaPro</title>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
  <h1>QuinielaPro</h1>

  <!-- Botón de Google -->
  <div id="g_id_onload"
       data-client_id="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
       data-callback="handleGoogleSignIn">
  </div>
  <div class="g_id_signin" data-type="standard"></div>

  <script>
    async function handleGoogleSignIn(response) {
      try {
        const res = await fetch('http://localhost:3000/api/v1/auth/google/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: response.credential })
        });

        const data = await res.json();

        if (data.success) {
          // Guardar token
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.user));

          // Mensaje de bienvenida
          const msg = data.data.isNewUser
            ? '¡Bienvenido! Tu cuenta ha sido creada.'
            : `¡Hola de nuevo, ${data.data.user.nombre}!`;

          alert(msg);

          // Redirigir
          window.location.href = '/user/index.html';
        } else {
          alert('Error: ' + data.message);
        }
      } catch (error) {
        alert('Error en login: ' + error.message);
      }
    }
  </script>
</body>
</html>
```

### **Ejemplo 3: Selector de partidos con API**

```html
<!-- selector-partidos.html -->
<div id="liga-selector">
  <label>Selecciona liga:</label>
  <select id="liga-select"></select>

  <label>Desde:</label>
  <input type="date" id="fecha-desde">

  <label>Hasta:</label>
  <input type="date" id="fecha-hasta">

  <button onclick="buscarPartidos()">Buscar Partidos</button>
</div>

<div id="partidos-list"></div>

<script>
// Cargar ligas al inicio
async function cargarLigas() {
  const res = await fetch('http://localhost:3000/api/v1/football/leagues');
  const { data: leagues } = await res.json();

  const select = document.getElementById('liga-select');
  leagues.forEach(liga => {
    const option = document.createElement('option');
    option.value = liga.key;
    option.textContent = `${liga.name} (${liga.country})`;
    select.appendChild(option);
  });
}

// Buscar partidos
async function buscarPartidos() {
  const liga = document.getElementById('liga-select').value;
  const desde = document.getElementById('fecha-desde').value;
  const hasta = document.getElementById('fecha-hasta').value;

  const url = `http://localhost:3000/api/v1/football/fixtures/${liga}?from=${desde}&to=${hasta}`;
  const res = await fetch(url);
  const { fixtures } = await res.json();

  const list = document.getElementById('partidos-list');
  list.innerHTML = '';

  fixtures.forEach(fixture => {
    const div = document.createElement('div');
    div.className = 'partido';
    div.innerHTML = `
      <input type="checkbox" value="${JSON.stringify(fixture)}">
      <strong>${fixture.equipo_local}</strong> vs <strong>${fixture.equipo_visitante}</strong>
      <br>
      ${new Date(fixture.fecha_partido).toLocaleString()}
      <br>
      ${fixture.liga} - ${fixture.jornada}
    `;
    list.appendChild(div);
  });
}

// Inicializar
cargarLigas();
</script>
```

---

## 🎯 Flujo Completo: Admin creando quiniela

1. **Admin inicia sesión**
2. **Va a "Crear Quiniela"**
3. **Llena datos básicos** (nombre, precio, fechas, etc.)
4. **Selecciona "Importar partidos desde API"**
5. **Elige liga** (ej: Liga MX)
6. **Elige fechas** (ej: del 1 al 10 de diciembre)
7. **Ve lista de partidos disponibles**
8. **Selecciona los partidos** que quiere incluir
9. **Clic en "Importar seleccionados"**
10. **Los partidos se agregan automáticamente** con todos los datos (equipos, fecha, estadio, logos, etc.)
11. **Activa la quiniela**
12. **¡Listo!** Los usuarios pueden comprar y llenar picks

---

## 🔧 Troubleshooting

### Error: "API Error" al obtener fixtures

**Causa:** Límite de requests de RapidAPI alcanzado (100/día gratis)

**Solución:**
- Esperar 24 horas
- Usar caché (los fixtures no cambian constantemente)
- Actualizar plan de RapidAPI

### Error: "Token de Google inválido"

**Causa:** Client ID incorrecto o token expirado

**Solución:**
- Verificar que uses el Client ID correcto
- El token expira rápido, enviarlo inmediatamente

### Los logos de equipos no cargan

**Causa:** URLs de logos pueden requerir headers especiales

**Solución:**
- Guardar logos localmente
- Usar proxy para imágenes

---

## 📚 Recursos

- [RapidAPI Football Docs](https://rapidapi.com/api-sports/api/api-football)
- [Google Sign-In Docs](https://developers.google.com/identity/gsi/web/guides/overview)
- [Configuración OAuth Google Console](https://console.cloud.google.com/apis/credentials)

---

¡Listo para usar! 🚀
