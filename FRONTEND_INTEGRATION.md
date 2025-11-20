# 🎨 Guía de Integración Frontend - QuinielaPro

## 📋 Resumen

Esta guía explica cómo integrar el frontend de QuinielaPro con la API REST backend, incluyendo autenticación, Google OAuth, manejo de datos y actualizaciones en tiempo real.

## 🗂️ Nuevos Módulos Creados

### 1. `api-client.js` - Cliente API

Cliente completo para comunicarse con el backend REST.

**Características:**
- ✅ Métodos HTTP (GET, POST, PUT, DELETE)
- ✅ Manejo automático de tokens JWT
- ✅ Refresh token automático
- ✅ Manejo de errores
- ✅ Métodos helper para todos los endpoints

**Uso básico:**

```javascript
// El cliente global `api` se crea automáticamente

// Configurar URL base (producción)
api.setBaseUrl('https://tu-api.com');

// Ejemplos de uso
const quinielas = await api.getQuinielas();
const quiniela = await api.getQuiniela(123);
await api.participarEnQuiniela(123, picks);
```

### 2. `auth.js` - Autenticación y OAuth

Maneja autenticación tradicional y Google OAuth.

**Características:**
- ✅ Login con email/password
- ✅ Login con Google OAuth 2.0
- ✅ Registro de usuarios
- ✅ Verificación de sesión
- ✅ Protección de rutas
- ✅ Manejo de roles (admin/user)

**Uso básico:**

```javascript
// El gestor global `authManager` se crea automáticamente

// Verificar sesión al cargar página
await authManager.checkSession();

// Login tradicional
await authManager.login(email, password);

// Inicializar Google Sign-In
await authManager.initGoogleSignIn();
authManager.renderGoogleButton('google-btn-container');

// Proteger página (solo usuarios autenticados)
await authManager.requireAuth();

// Proteger página de admin (solo administradores)
await authManager.requireAdmin();

// Obtener usuario actual
const user = authManager.getCurrentUser();

// Cerrar sesión
authManager.logout();
```

### 3. `api-storage.js` - Almacenamiento Híbrido

Combina API como fuente primaria y localStorage como caché offline.

**Características:**
- ✅ API primero, caché después
- ✅ Funciona offline
- ✅ Refresh automático en background
- ✅ TTL configurable
- ✅ Mantiene funciones locales (borradores, favoritos)

**Uso básico:**

```javascript
// Inicializar con API client
APIStorage.init(api);

// Obtener datos (usa caché inteligente)
const quinielas = await APIStorage.getQuinielas();
const quiniela = await APIStorage.getQuiniela(123);
const disponibles = await APIStorage.getQuinielasDisponibles();
const misQuinielas = await APIStorage.getMisParticipaciones();
const tabla = await APIStorage.getTablaPosiciones(123);

// Forzar refresh (ignorar caché)
const freshData = await APIStorage.getQuinielas(true);

// Invalidar caché manualmente
APIStorage.invalidateQuinielasCache();
APIStorage.invalidateQuinielaCache(123);

// Funciones locales (sin API)
APIStorage.guardarBorradorQuiniela(borrador);
APIStorage.agregarFavorito(quinielaId);
APIStorage.guardarConfiguracion({ tema: 'oscuro' });
```

### 4. `polling-helper.js` - Actualizaciones en Tiempo Real

Polling inteligente con intervalos adaptativos.

**Características:**
- ✅ Polling adaptativo (ajusta frecuencia según actividad)
- ✅ Solo polling cuando pestaña visible
- ✅ ETag para detectar cambios
- ✅ Clases especializadas (tabla, partidos en vivo)
- ✅ Callbacks para eventos específicos (goles)

**Uso básico:**

```javascript
// Polling para tabla de posiciones
const poller = new TablaPosicionesPoller(quinielaId, {
  baseUrl: 'http://localhost:3000',
  interval: 15000, // 15 segundos
  adaptive: true,
});

poller.start(
  // Success callback
  (data) => {
    console.log('Nuevos datos:', data);
    renderTabla(data);
  },
  // Error callback
  (error) => {
    console.error('Error:', error);
  }
);

// Detener polling
poller.stop();

// Cambiar intervalo dinámicamente
poller.setInterval(10000); // 10 segundos

// Polling para partidos en vivo (con detección de goles)
const partidosPoller = new PartidosEnVivoPoller(quinielaId);

partidosPoller
  .onGoal((goalData) => {
    console.log('¡GOL!', goalData);
    mostrarNotificacionGol(goalData);
  })
  .start((data) => {
    renderPartidos(data);
  });
```

---

## 🚀 Pasos de Integración

### Paso 1: Incluir Scripts en HTML

Agregar en el `<head>` o antes de `</body>`:

```html
<!-- API Client -->
<script src="/assets/js/api-client.js"></script>

<!-- Autenticación -->
<script src="/assets/js/auth.js"></script>

<!-- Storage Híbrido -->
<script src="/assets/js/api-storage.js"></script>

<!-- Polling (opcional, solo en páginas que lo necesiten) -->
<script src="/assets/js/polling-helper.js"></script>
```

**Orden importante:**
1. `api-client.js` primero (crea `api` global)
2. `auth.js` después (usa `api`)
3. `api-storage.js` después (usa `api`)
4. `polling-helper.js` al final (opcional)

### Paso 2: Configurar API Base URL

En `assets/js/config.js` (crear si no existe):

```javascript
// Configuración global
const APP_CONFIG = {
  // Desarrollo
  API_URL: 'http://localhost:3000',

  // Producción (descomentar cuando sea necesario)
  // API_URL: 'https://tu-api-produccion.com',

  GOOGLE_CLIENT_ID: '548408750723-r8d4cb8i5vq5abgfl31f5b88k4ecuu8e.apps.googleusercontent.com',
};

// Configurar API client
if (typeof api !== 'undefined') {
  api.setBaseUrl(APP_CONFIG.API_URL);
}

// Inicializar API Storage
if (typeof APIStorage !== 'undefined') {
  APIStorage.init(api);
}
```

Incluir en HTML:

```html
<script src="/assets/js/config.js"></script>
```

### Paso 3: Crear Página de Login

Ejemplo completo de página de login con Google OAuth:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Login - QuinielaPro</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="login-container"></div>

  <!-- Scripts -->
  <script src="/assets/js/api-client.js"></script>
  <script src="/assets/js/auth.js"></script>
  <script src="/assets/js/config.js"></script>

  <script>
    // Configurar API
    api.setBaseUrl('http://localhost:3000');

    // Si ya está autenticado, redirigir
    if (authManager.isAuthenticated()) {
      const user = authManager.getCurrentUser();
      if (user.role === 'admin') {
        window.location.href = '/admin/index.html';
      } else {
        window.location.href = '/user/index.html';
      }
    }

    // Crear formulario de login
    authManager.createLoginForm('login-container', {
      showGoogle: true,
      showRegister: true,
    });
  </script>
</body>
</html>
```

### Paso 4: Proteger Páginas de Usuario

En `user/index.html` y otras páginas de usuario:

```html
<script src="/assets/js/api-client.js"></script>
<script src="/assets/js/auth.js"></script>
<script src="/assets/js/config.js"></script>

<script>
  // Verificar autenticación al cargar
  (async () => {
    const isAuth = await authManager.requireAuth('/index.html');

    if (isAuth) {
      // Usuario autenticado, cargar datos
      cargarDatosUsuario();
    }
  })();

  async function cargarDatosUsuario() {
    const user = authManager.getCurrentUser();

    // Mostrar nombre del usuario
    document.getElementById('user-name').textContent = user.nombre;

    // Cargar quinielas disponibles
    const quinielas = await APIStorage.getQuinielasDisponibles();
    renderQuinielas(quinielas);
  }
</script>
```

### Paso 5: Proteger Páginas de Admin

En `admin/index.html` y otras páginas de admin:

```html
<script>
  (async () => {
    const isAdmin = await authManager.requireAdmin('/index.html');

    if (isAdmin) {
      cargarDatosAdmin();
    }
  })();

  async function cargarDatosAdmin() {
    // Cargar todas las quinielas (incluyendo inactivas)
    const quinielas = await APIStorage.getQuinielas(true); // force refresh
    renderQuinielasAdmin(quinielas);
  }
</script>
```

### Paso 6: Implementar Tabla en Tiempo Real

Ejemplo de tabla de posiciones con polling:

```html
<!-- En user/resultados.html -->

<div id="tabla-posiciones"></div>

<script src="/assets/js/api-client.js"></script>
<script src="/assets/js/auth.js"></script>
<script src="/assets/js/polling-helper.js"></script>
<script src="/assets/js/config.js"></script>

<script>
  let poller = null;

  async function inicializarTabla(quinielaId) {
    // Verificar autenticación
    await authManager.requireAuth();

    // Crear poller
    poller = new TablaPosicionesPoller(quinielaId, {
      baseUrl: APP_CONFIG.API_URL,
      interval: 15000, // 15 segundos
      adaptive: true,
    });

    // Iniciar polling
    poller.start(
      (data) => {
        renderTabla(data.data || data);
      },
      (error) => {
        console.error('Error cargando tabla:', error);
      }
    );
  }

  function renderTabla(participantes) {
    const container = document.getElementById('tabla-posiciones');

    let html = '<table><thead><tr>';
    html += '<th>Posición</th>';
    html += '<th>Usuario</th>';
    html += '<th>Aciertos</th>';
    html += '<th>Premio</th>';
    html += '</tr></thead><tbody>';

    participantes.forEach((p, index) => {
      html += '<tr>';
      html += `<td>${p.posicion || index + 1}</td>`;
      html += `<td>${p.usuario?.nombre || 'Usuario'}</td>`;
      html += `<td>${p.aciertos || 0}</td>`;
      html += `<td>$${p.premio_ganado || 0}</td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // Limpiar al cerrar página
  window.addEventListener('beforeunload', () => {
    if (poller) {
      poller.stop();
    }
  });

  // Iniciar con ID de quiniela
  const quinielaId = new URLSearchParams(window.location.search).get('id');
  if (quinielaId) {
    inicializarTabla(quinielaId);
  }
</script>
```

---

## 📝 Ejemplos de Uso Completos

### Ejemplo 1: Listar Quinielas Disponibles

```javascript
async function mostrarQuinielasDisponibles() {
  try {
    // Obtener quinielas (usa caché inteligente)
    const quinielas = await APIStorage.getQuinielasDisponibles();

    const container = document.getElementById('quinielas-container');
    container.innerHTML = '';

    quinielas.forEach(quiniela => {
      const card = document.createElement('div');
      card.className = 'quiniela-card';
      card.innerHTML = `
        <h3>${quiniela.nombre}</h3>
        <p>${quiniela.descripcion}</p>
        <p>Costo: $${quiniela.costo}</p>
        <p>Premio: $${quiniela.premio_total}</p>
        <button onclick="verDetalle(${quiniela.id})">
          Ver Detalle
        </button>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error:', error);
    mostrarError('No se pudieron cargar las quinielas');
  }
}
```

### Ejemplo 2: Ver Detalle y Participar

```javascript
async function verDetalle(quinielaId) {
  try {
    const quiniela = await APIStorage.getQuiniela(quinielaId);

    // Mostrar información
    document.getElementById('nombre').textContent = quiniela.nombre;
    document.getElementById('descripcion').textContent = quiniela.descripcion;

    // Mostrar partidos
    const partidosContainer = document.getElementById('partidos');
    partidosContainer.innerHTML = '';

    quiniela.partidos.forEach(partido => {
      const item = document.createElement('div');
      item.innerHTML = `
        <div class="partido">
          <span>${partido.equipo_local}</span>
          <span>vs</span>
          <span>${partido.equipo_visitante}</span>
          <select id="pick_${partido.id}">
            <option value="">-- Selecciona --</option>
            <option value="local">${partido.equipo_local}</option>
            <option value="empate">Empate</option>
            <option value="visitante">${partido.equipo_visitante}</option>
          </select>
        </div>
      `;
      partidosContainer.appendChild(item);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

async function participar(quinielaId) {
  try {
    const quiniela = await APIStorage.getQuiniela(quinielaId);
    const picks = [];

    quiniela.partidos.forEach(partido => {
      const select = document.getElementById(`pick_${partido.id}`);
      const prediccion = select.value;

      if (prediccion) {
        picks.push({
          partido_id: partido.id,
          prediccion: prediccion,
        });
      }
    });

    if (picks.length !== quiniela.partidos.length) {
      alert('Debes completar todos los picks');
      return;
    }

    // Enviar participación
    const response = await api.participarEnQuiniela(quinielaId, picks);

    if (response.success) {
      alert('¡Participación registrada exitosamente!');

      // Invalidar caché
      APIStorage.invalidateQuinielasCache();

      // Redirigir a mis quinielas
      window.location.href = '/user/mis-quinielas.html';
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al participar: ' + error.message);
  }
}
```

### Ejemplo 3: Crear Quiniela (Admin)

```javascript
async function crearQuiniela() {
  try {
    const formData = {
      nombre: document.getElementById('nombre').value,
      descripcion: document.getElementById('descripcion').value,
      costo: parseFloat(document.getElementById('costo').value),
      premio_total: parseFloat(document.getElementById('premio').value),
      fecha_inicio: document.getElementById('fecha_inicio').value,
      fecha_fin: document.getElementById('fecha_fin').value,
      tipo_distribucion: document.getElementById('tipo_distribucion').value,
      max_participantes: parseInt(document.getElementById('max_participantes').value) || null,
    };

    // Validar
    if (!formData.nombre || !formData.costo || !formData.premio_total) {
      alert('Completa todos los campos obligatorios');
      return;
    }

    // Crear quiniela
    const response = await api.createQuiniela(formData);

    if (response.success) {
      const quinielaId = response.data.id;

      alert('Quiniela creada exitosamente');

      // Invalidar caché
      APIStorage.invalidateQuinielasCache();

      // Redirigir a agregar partidos
      window.location.href = `/admin/agregar-partidos.html?id=${quinielaId}`;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al crear quiniela: ' + error.message);
  }
}
```

### Ejemplo 4: Buscar Fixtures de RapidAPI (Admin)

```javascript
async function buscarFixtures() {
  try {
    const liga = document.getElementById('liga').value; // 'liga_mx', 'mls', etc.
    const desde = document.getElementById('fecha_desde').value;
    const hasta = document.getElementById('fecha_hasta').value;

    if (!liga || !desde || !hasta) {
      alert('Selecciona liga y fechas');
      return;
    }

    // Mostrar loading
    document.getElementById('loading').classList.remove('hidden');

    // Buscar fixtures
    const response = await api.getFixtures(liga, {
      from: desde,
      to: hasta,
    });

    if (response.success) {
      const fixtures = response.fixtures;

      renderFixtures(fixtures);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error buscando fixtures: ' + error.message);
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
}

function renderFixtures(fixtures) {
  const container = document.getElementById('fixtures-container');
  container.innerHTML = '';

  fixtures.forEach(fixture => {
    const item = document.createElement('div');
    item.className = 'fixture-item';
    item.innerHTML = `
      <input type="checkbox" id="fixture_${fixture.fixture.id}" value="${fixture.fixture.id}">
      <label for="fixture_${fixture.fixture.id}">
        <img src="${fixture.teams.home.logo}" width="30">
        ${fixture.teams.home.name}
        vs
        ${fixture.teams.away.name}
        <img src="${fixture.teams.away.logo}" width="30">
        <br>
        <small>${new Date(fixture.fixture.date).toLocaleString()}</small>
      </label>
    `;
    container.appendChild(item);
  });
}

async function importarPartidos(quinielaId) {
  try {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const fixtureIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (fixtureIds.length === 0) {
      alert('Selecciona al menos un partido');
      return;
    }

    // Importar partidos
    const response = await api.importarPartidos(quinielaId, fixtureIds);

    if (response.success) {
      alert(`${response.data.importados} partidos importados exitosamente`);

      // Invalidar caché
      APIStorage.invalidateQuinielaCache(quinielaId);

      // Volver a gestión
      window.location.href = `/admin/gestionar-quinielas.html`;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error importando partidos: ' + error.message);
  }
}
```

### Ejemplo 5: Sincronizar Resultados (Admin)

```javascript
async function sincronizarResultados(quinielaId) {
  try {
    // Confirmar
    if (!confirm('¿Sincronizar resultados desde RapidAPI?')) {
      return;
    }

    // Mostrar loading
    document.getElementById('loading').classList.remove('hidden');

    // Obtener quiniela con partidos
    const quiniela = await api.getQuiniela(quinielaId);

    // Filtrar solo partidos con external_id (de RapidAPI)
    const partidosAPI = quiniela.data.partidos
      .filter(p => p.external_id)
      .map(p => p.id);

    if (partidosAPI.length === 0) {
      alert('No hay partidos de RapidAPI para sincronizar');
      return;
    }

    // Sincronizar
    const response = await api.syncResultados(partidosAPI);

    if (response.success) {
      alert(`✅ ${response.data.actualizados} partidos sincronizados`);

      // Invalidar caché
      APIStorage.invalidateQuinielaCache(quinielaId);

      // Recargar página
      window.location.reload();
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error sincronizando: ' + error.message);
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
}
```

---

## 🔐 Gestión de Sesión

### Auto-verificar sesión en cada página

Crear `assets/js/session-check.js`:

```javascript
// Verificar sesión automáticamente
(async () => {
  // Solo en páginas protegidas
  const currentPath = window.location.pathname;

  if (currentPath.includes('/user/') || currentPath.includes('/admin/')) {
    const isAuth = await authManager.checkSession();

    if (!isAuth) {
      window.location.href = '/index.html';
      return;
    }

    // Verificar rol para páginas de admin
    if (currentPath.includes('/admin/') && !authManager.isAdmin()) {
      window.location.href = '/user/index.html';
      return;
    }

    // Mostrar datos del usuario en UI
    const user = authManager.getCurrentUser();
    const userNameElements = document.querySelectorAll('[data-user-name]');
    userNameElements.forEach(el => {
      el.textContent = user.nombre;
    });

    const userAvatarElements = document.querySelectorAll('[data-user-avatar]');
    userAvatarElements.forEach(el => {
      if (user.avatar_url) {
        el.src = user.avatar_url;
      }
    });
  }
})();
```

Incluir en todas las páginas protegidas:

```html
<script src="/assets/js/api-client.js"></script>
<script src="/assets/js/auth.js"></script>
<script src="/assets/js/config.js"></script>
<script src="/assets/js/session-check.js"></script>
```

---

## 🎯 Checklist de Integración

### Configuración Inicial
- [ ] Iniciar API backend (`cd api && npm run dev`)
- [ ] Verificar que API está corriendo en http://localhost:3000
- [ ] Actualizar `APP_CONFIG.API_URL` en `config.js`
- [ ] Incluir scripts en todas las páginas

### Autenticación
- [ ] Crear página de login con Google OAuth
- [ ] Proteger páginas de usuario con `requireAuth()`
- [ ] Proteger páginas de admin con `requireAdmin()`
- [ ] Implementar botón de logout en todas las páginas
- [ ] Agregar `session-check.js` a páginas protegidas

### Quinielas (Usuario)
- [ ] Mostrar quinielas disponibles usando `APIStorage`
- [ ] Implementar vista de detalle de quiniela
- [ ] Implementar formulario de participación
- [ ] Mostrar mis participaciones
- [ ] Implementar polling para tabla de posiciones

### Quinielas (Admin)
- [ ] Formulario de crear quiniela
- [ ] Buscar fixtures de RapidAPI
- [ ] Importar partidos desde RapidAPI
- [ ] Crear partidos manualmente (opcional)
- [ ] Sincronizar resultados
- [ ] Calcular ganadores

### Optimización
- [ ] Verificar que caché funciona correctamente
- [ ] Implementar indicadores de "offline/online"
- [ ] Agregar loading states en todas las operaciones
- [ ] Implementar manejo de errores consistente
- [ ] Optimizar polling (30s general, 10s en vivo)

### Testing
- [ ] Probar flujo completo de usuario
- [ ] Probar flujo completo de admin
- [ ] Probar con conexión lenta
- [ ] Probar modo offline
- [ ] Probar en móvil
- [ ] Verificar que no se excede límite de RapidAPI

---

## 🚨 Solución de Problemas

### Error: "api is not defined"

**Problema:** El script no encuentra el objeto `api` global.

**Solución:**
```html
<!-- Asegúrate de incluir api-client.js PRIMERO -->
<script src="/assets/js/api-client.js"></script>
<script src="/assets/js/auth.js"></script>
```

### Error: "Failed to fetch"

**Problema:** No puede conectar con la API.

**Solución:**
1. Verificar que la API está corriendo: `curl http://localhost:3000/health`
2. Verificar CORS en `api/src/app.js`
3. Verificar URL base: `console.log(api.baseUrl)`

### Error: "401 Unauthorized"

**Problema:** Token expirado o inválido.

**Solución:**
```javascript
// Limpiar tokens y redirigir
authManager.logout();
```

### Caché no se actualiza

**Problema:** Los datos no se refrescan.

**Solución:**
```javascript
// Forzar refresh
const datos = await APIStorage.getQuinielas(true);

// O invalidar caché
APIStorage.invalidateQuinielasCache();
```

### Google OAuth no funciona

**Problema:** Botón de Google no aparece.

**Solución:**
1. Verificar que `GOOGLE_CLIENT_ID` es correcto
2. Verificar que dominio está autorizado en Google Console
3. Abrir consola del navegador para ver errores
4. Para desarrollo local, usar http://localhost (no IP)

---

## 📚 Recursos Adicionales

- **API Documentation:** Ver `api/README.md`
- **Optimization Guide:** Ver `api/OPTIMIZATION_GUIDE.md`
- **Realtime Guide:** Ver `api/REALTIME_GUIDE.md`
- **Polling Example:** Abrir `api/public/examples/polling-example.html` en navegador

---

## 🎓 Ejemplos Completos

Ver carpeta `examples/` (crear si no existe) con ejemplos completos de:
- Login page
- User dashboard
- Admin dashboard
- Quiniela detail page
- Real-time leaderboard

---

**¡La integración está lista para empezar!** 🚀

Comienza con el paso 1 y sigue la checklist. Si tienes dudas, revisa los ejemplos de uso completos en esta guía.
