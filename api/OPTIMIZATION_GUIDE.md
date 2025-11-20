# 🚀 Guía de Optimización - Uso Eficiente de APIs

## 📊 Problema: Límite de RapidAPI

**RapidAPI Football (Plan Gratuito):**
- ✅ 100 requests por día
- ❌ Se resetea cada 24 horas
- ⚠️ Si se excede, API deja de funcionar hasta el reset

**Problema sin optimización:**
- Cada vez que se lista quinielas → Consulta API (malo)
- Cada vez que se muestran partidos → Consulta API (malo)
- 10 usuarios viendo quinielas = 10 requests desperdiciados

**Solución implementada:**
- API solo se consulta cuando es necesario
- Partidos se guardan en base de datos
- Sistema de caché en memoria

---

## ✅ Flujo Optimizado Implementado

### **1. Crear Quiniela (Admin)**

```
Admin busca partidos
       ↓
¿Está en caché? (1 hora)
  ↓ NO          ↓ SÍ
Consulta API   Usa caché
       ↓            ↓
Guarda caché  ←─────┘
       ↓
Muestra fixtures al admin
       ↓
Admin selecciona partidos
       ↓
POST /football/import/:quinielaId
       ↓
Partidos se guardan en BD
```

**Resultado:**
- ✅ 1 request a RapidAPI (o 0 si está en caché)
- ✅ Partidos guardados permanentemente en BD

### **2. Ver Quinielas (Usuarios)**

```
Usuario ve lista de quinielas
       ↓
GET /quinielas
       ↓
Se consulta BD (NO API)
       ↓
Se obtienen partidos desde BD
```

**Resultado:**
- ✅ 0 requests a RapidAPI
- ✅ Rápido (solo BD)

### **3. Ver Detalle de Quiniela**

```
Usuario ve detalles
       ↓
GET /quinielas/:id
       ↓
Se obtienen partidos desde BD (NO API)
       ↓
Se muestran logos, equipos, estadios (desde BD)
```

**Resultado:**
- ✅ 0 requests a RapidAPI
- ✅ Todos los datos desde BD

### **4. Sincronizar Resultados (Admin)**

```
Admin sincroniza resultados
       ↓
POST /football/sync-results
       ↓
Se obtienen partidos con external_id
       ↓
Por cada partido: Consulta resultado en API
       ↓
Actualiza marcadores en BD
```

**Resultado:**
- ✅ N requests (solo los partidos a sincronizar)
- ✅ Bajo consumo (típicamente 10-15 partidos)

---

## 🎯 Sistema de Caché Implementado

### **Cómo Funciona**

El servicio `cacheService.js` mantiene un caché en memoria:

```javascript
// Primera búsqueda de Liga MX
GET /football/fixtures/liga_mx?from=2024-12-01&to=2024-12-31
→ Consulta API (1 request)
→ Guarda en caché por 1 hora

// Segunda búsqueda (dentro de 1 hora)
GET /football/fixtures/liga_mx?from=2024-12-01&to=2024-12-31
→ Usa caché (0 requests)

// Después de 1 hora
→ Caché expiró
→ Siguiente búsqueda consulta API nuevamente
```

### **TTL (Time To Live)**

| Recurso | TTL | Razón |
|---------|-----|-------|
| Fixtures | 1 hora | Partidos no cambian frecuentemente |
| Ligas | Ilimitado | Lista de ligas nunca cambia |
| Resultados | No cachea | Necesita estar actualizado |

### **Estadísticas de Caché**

```bash
# Ver estadísticas
GET /api/v1/cache/stats

# Limpiar caché (admin)
POST /api/v1/cache/clear
```

---

## 📊 Comparación: Con vs Sin Optimización

### **Escenario: 100 usuarios en un día**

**❌ Sin Optimización:**
```
100 usuarios × 1 vista de quinielas = 100 requests
50 usuarios ven detalles = 50 requests
10 admins buscan partidos = 10 requests
─────────────────────────────────────
TOTAL: 160 requests → LÍMITE EXCEDIDO
```

**✅ Con Optimización:**
```
100 usuarios ven quinielas = 0 requests (BD)
50 usuarios ven detalles = 0 requests (BD)
10 admins buscan partidos = 10 requests (1ra vez)
5 admins sincronizan (10 partidos c/u) = 50 requests
─────────────────────────────────────
TOTAL: 60 requests → DENTRO DEL LÍMITE ✅
```

---

## 💡 Mejores Prácticas

### **1. Buscar Partidos (Admin)**

```javascript
// ✅ CORRECTO: Buscar una vez, usar múltiples veces
const { fixtures } = await fetch(
  'http://localhost:3000/api/v1/football/fixtures/liga_mx?from=2024-12-01&to=2024-12-31'
).then(r => r.json());

// Guardar fixtures en variable
// Permitir al admin seleccionar múltiples
// Importar todos juntos

// ❌ INCORRECTO: Buscar cada vez que el admin cambia filtro
// Esto desperdicia requests si el caché expiró
```

### **2. Mostrar Partidos a Usuarios**

```javascript
// ✅ CORRECTO: Siempre desde BD
const res = await fetch(`http://localhost:3000/api/v1/quinielas/${id}`);
const { data: quiniela } = await res.json();
// quiniela.partidos viene de BD

// ❌ INCORRECTO: Buscar en API cada vez
// Nunca hacer esto para mostrar partidos de quinielas existentes
```

### **3. Sincronizar Resultados**

```javascript
// ✅ CORRECTO: Solo partidos con external_id
const partidosConAPI = partidos.filter(p => p.external_id);
await fetch('http://localhost:3000/api/v1/football/sync-results', {
  body: JSON.stringify({
    partidoIds: partidosConAPI.map(p => p.id)
  })
});

// ❌ INCORRECTO: Intentar sincronizar partidos manuales
// Los partidos sin external_id no se pueden sincronizar
```

---

## 🔧 Implementación en Frontend

### **Ejemplo: Selector de Partidos (Admin)**

```javascript
let cachedFixtures = null;

async function buscarPartidos(liga, desde, hasta) {
  // Verificar caché local (frontend)
  const cacheKey = `${liga}-${desde}-${hasta}`;
  if (cachedFixtures && cachedFixtures.key === cacheKey) {
    console.log('Usando caché frontend');
    return cachedFixtures.data;
  }

  // Consultar API (que usa su propio caché backend)
  const res = await fetch(
    `http://localhost:3000/api/v1/football/fixtures/${liga}?from=${desde}&to=${hasta}`
  );
  const data = await res.json();

  // Guardar en caché frontend
  cachedFixtures = {
    key: cacheKey,
    data: data.fixtures,
  };

  return data.fixtures;
}

// Ejemplo de uso
const fixtures = await buscarPartidos('liga_mx', '2024-12-01', '2024-12-31');
// Usuario cambia selección de partidos → No volver a buscar
// Usuario cambia fechas → Buscar de nuevo
```

### **Ejemplo: Mostrar Quinielas (Usuario)**

```javascript
async function cargarQuinielas() {
  // Siempre desde BD, nunca desde API de fútbol
  const res = await fetch('http://localhost:3000/api/v1/quinielas/disponibles');
  const { data: quinielas } = await res.json();

  // Renderizar quinielas
  quinielas.forEach(quiniela => {
    // quiniela.partidos viene de BD
    // NO hacer fetch a football API
    renderQuiniela(quiniela);
  });
}
```

---

## 📈 Monitoreo y Debugging

### **Ver Logs de Caché**

El servidor muestra logs automáticamente:

```bash
📦 Cache SET: fixtures:262:2024:2024-12-01:2024-12-31 (TTL: 3600s)
✅ Cache HIT: fixtures:262:2024:2024-12-01:2024-12-31
❌ Cache MISS: fixtures:253:2024:2024-12-01:2024-12-31 - Fetching...
🗑️  Cache EXPIRED: fixtures:262:2024:2024-12-01:2024-12-31
🧹 Cleaned 5 expired cache entries
```

### **Contar Requests a RapidAPI**

Agregar contador en el código:

```javascript
// En footballAPIService.js
let requestCount = 0;

const fetchFromAPI = async () => {
  requestCount++;
  console.log(`📊 RapidAPI Request #${requestCount} today`);

  if (requestCount > 90) {
    console.warn('⚠️  Acercándose al límite de 100 requests');
  }

  // ... resto del código
};
```

---

## 🎯 Estrategias Adicionales

### **1. Pre-cargar Partidos Populares**

```javascript
// Script que se ejecuta 1 vez al día (cron job)
// Pre-carga fixtures de ligas populares
async function preloadPopularLeagues() {
  const popularLeagues = ['liga_mx', 'mls', 'premier_league'];
  const nextWeek = getNextWeekDates();

  for (const league of popularLeagues) {
    await getFixtures(league, null, nextWeek.from, nextWeek.to);
    // Esto llena el caché antes de que los admins busquen
  }
}

// Ejecutar cada día a las 2 AM
// 3 ligas × 1 request = 3 requests/día
```

### **2. Caché Persistente (Opcional)**

Si el servidor se reinicia, el caché en memoria se pierde. Para persistir:

```javascript
// Usar Redis (producción)
const redis = require('redis');
const client = redis.createClient();

// O guardar en archivo (desarrollo)
const fs = require('fs');
fs.writeFileSync('cache.json', JSON.stringify(cache));
```

### **3. Refresh Inteligente**

```javascript
// Refrescar caché automáticamente antes de que expire
setTimeout(() => {
  // Refrescar fixtures populares cada 50 minutos
  refreshPopularFixtures();
}, 50 * 60 * 1000);
```

---

## ⚠️ Casos de Uso Especiales

### **Fixtures En Vivo**

```javascript
// Fixtures en vivo NO deben cachearse
// Cambian cada minuto
GET /football/fixtures/live
→ SIEMPRE consulta API (sin caché)
```

### **Resultados Recientes**

```javascript
// Si necesitas resultados de partidos que terminaron hace poco
// Usar TTL corto (5 minutos)
cacheService.set(key, results, 300); // 5 minutos
```

---

## 📊 Resumen

| Operación | Consulta API | Usa BD | Usa Caché |
|-----------|--------------|--------|-----------|
| Buscar fixtures (admin) | ✅ (1ra vez) | ❌ | ✅ (después) |
| Importar partidos | ❌ | ✅ | ❌ |
| Listar quinielas | ❌ | ✅ | ❌ |
| Ver detalle quiniela | ❌ | ✅ | ❌ |
| Sincronizar resultados | ✅ | ✅ | ❌ |
| Fixtures en vivo | ✅ | ❌ | ❌ |

---

## ✅ Checklist de Implementación

- [x] Sistema de caché implementado
- [x] Fixtures se cachean 1 hora
- [x] Partidos se guardan en BD al importar
- [x] Quinielas se leen desde BD
- [x] Sincronización solo consulta partidos específicos
- [x] Logs de caché para debugging
- [ ] Frontend implementa búsqueda única
- [ ] Dashboard de monitoreo de requests
- [ ] Cron job para pre-cargar fixtures populares
- [ ] Caché persistente con Redis (producción)

---

**Resultado esperado:**
- De 160+ requests/día → **~60 requests/día**
- Dentro del límite gratuito de 100/día
- Aplicación más rápida (BD es más rápida que API)
- Mejor experiencia de usuario

🎯 **Objetivo cumplido: Uso eficiente de RapidAPI** ✅
