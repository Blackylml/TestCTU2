# ⚡ Guía de Actualización en Tiempo (Casi) Real

## 📊 Comparación de Técnicas

| Técnica | Latencia | Costo Recursos | Complejidad | Escalabilidad | Recomendado Para |
|---------|----------|----------------|-------------|---------------|------------------|
| **Polling** | 5-30s | Bajo | Muy Baja | Alta | Partidos en vivo (básico) |
| **Long Polling** | 1-5s | Medio | Media | Media | Notificaciones |
| **Server-Sent Events** | <1s | Medio | Media | Media-Alta | Marcadores en vivo |
| **WebSockets** | <100ms | Alto | Alta | Media | Chat, eventos críticos |
| **Webhooks + Polling** | 2-10s | Muy Bajo | Baja | Muy Alta | **RECOMENDADO** |

---

## 1️⃣ Polling Simple (Más Barato)

### **¿Qué es?**
El cliente pregunta al servidor periódicamente "¿hay algo nuevo?"

### **Ventajas**
- ✅ Super simple de implementar
- ✅ Funciona en cualquier navegador
- ✅ Bajo costo de servidor
- ✅ Fácil de cachear

### **Desventajas**
- ❌ Latencia media-alta (5-30 segundos)
- ❌ Muchas peticiones "vacías"
- ❌ Usa ancho de banda innecesario

### **Implementación**

**Backend (ya está listo):**
```javascript
// Endpoint que ya tienes
GET /api/v1/quinielas/:id/tabla-posiciones
// Devuelve tabla actualizada
```

**Frontend:**
```javascript
// polling-simple.js
class PollingService {
  constructor(url, interval = 10000) {
    this.url = url;
    this.interval = interval; // 10 segundos
    this.timerId = null;
    this.callbacks = [];
  }

  start(callback) {
    this.callbacks.push(callback);

    // Primera llamada inmediata
    this.fetch();

    // Polling periódico
    this.timerId = setInterval(() => {
      this.fetch();
    }, this.interval);
  }

  async fetch() {
    try {
      const res = await fetch(this.url);
      const data = await res.json();

      // Notificar a todos los callbacks
      this.callbacks.forEach(cb => cb(data));
    } catch (error) {
      console.error('Error en polling:', error);
    }
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  // Polling inteligente - solo cuando la pestaña está visible
  startSmart(callback) {
    this.callbacks.push(callback);

    const poll = () => {
      if (!document.hidden) { // Solo si pestaña está visible
        this.fetch();
      }
    };

    // Primera llamada
    poll();

    // Polling periódico
    this.timerId = setInterval(poll, this.interval);

    // Pausar cuando pestaña está oculta
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.fetch(); // Actualizar al volver
      }
    });
  }
}

// USO:
const tablaPosiciones = new PollingService(
  'http://localhost:3000/api/v1/quinielas/123/tabla-posiciones',
  10000 // Cada 10 segundos
);

tablaPosiciones.startSmart((data) => {
  console.log('Tabla actualizada:', data);
  actualizarUI(data);
});

// Detener cuando usuario sale de la página
window.addEventListener('beforeunload', () => {
  tablaPosiciones.stop();
});
```

**Optimización con ETags:**
```javascript
class SmartPollingService {
  constructor(url, interval = 10000) {
    this.url = url;
    this.interval = interval;
    this.etag = null; // Para detectar cambios
  }

  async fetch() {
    const headers = {};
    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    const res = await fetch(this.url, { headers });

    // 304 Not Modified - no hay cambios
    if (res.status === 304) {
      console.log('📦 Sin cambios (304)');
      return null;
    }

    // Guardar nuevo ETag
    this.etag = res.headers.get('ETag');

    const data = await res.json();
    return data;
  }
}
```

**Costos:**
- 100 usuarios × 6 requests/minuto = 600 requests/minuto
- En 1 hora = 36,000 requests
- **Muy manejable para servidor**

---

## 2️⃣ Long Polling (Medio)

### **¿Qué es?**
El servidor mantiene la conexión abierta hasta que hay datos nuevos.

### **Implementación Backend:**
```javascript
// src/controllers/liveController.js
const liveController = {
  async waitForUpdates(req, res) {
    const { quinielaId } = req.params;
    const { lastUpdate } = req.query; // Timestamp del último dato

    const TIMEOUT = 30000; // 30 segundos máximo
    const CHECK_INTERVAL = 1000; // Revisar cada 1 segundo

    const startTime = Date.now();

    const checkForUpdates = async () => {
      // Verificar si hay actualizaciones
      const updates = await getUpdatesAfter(quinielaId, lastUpdate);

      if (updates.length > 0) {
        // Hay datos nuevos, responder inmediatamente
        return res.json({
          success: true,
          data: updates,
          timestamp: Date.now(),
        });
      }

      // Sin actualizaciones
      if (Date.now() - startTime >= TIMEOUT) {
        // Timeout, responder vacío
        return res.json({
          success: true,
          data: [],
          timestamp: Date.now(),
        });
      }

      // Esperar y revisar de nuevo
      setTimeout(checkForUpdates, CHECK_INTERVAL);
    };

    checkForUpdates();
  },
};
```

**Frontend:**
```javascript
class LongPollingService {
  constructor(url) {
    this.url = url;
    this.lastUpdate = Date.now();
    this.running = false;
  }

  async start(callback) {
    this.running = true;

    while (this.running) {
      try {
        const res = await fetch(
          `${this.url}?lastUpdate=${this.lastUpdate}`
        );
        const data = await res.json();

        if (data.data.length > 0) {
          callback(data.data);
          this.lastUpdate = data.timestamp;
        }
      } catch (error) {
        console.error('Error:', error);
        await sleep(5000); // Esperar 5s antes de reintentar
      }
    }
  }

  stop() {
    this.running = false;
  }
}
```

**Costos:**
- Mantiene conexiones abiertas (más memoria)
- Menos requests que polling simple
- **Costo medio**

---

## 3️⃣ Server-Sent Events (SSE) (Recomendado para Marcadores)

### **¿Qué es?**
Conexión unidireccional del servidor al cliente para enviar eventos.

### **Ventajas**
- ✅ Estándar de navegadores
- ✅ Auto-reconexión
- ✅ Más eficiente que polling
- ✅ Fácil de implementar

### **Implementación Backend:**
```javascript
// src/controllers/sseController.js
const sseConnections = new Map(); // Guardar conexiones activas

const sseController = {
  // Conectar cliente
  async connect(req, res) {
    const { quinielaId } = req.params;

    // Headers para SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Enviar comentario para mantener conexión viva
    res.write(':ok\n\n');

    // Guardar conexión
    if (!sseConnections.has(quinielaId)) {
      sseConnections.set(quinielaId, new Set());
    }
    sseConnections.get(quinielaId).add(res);

    // Enviar datos iniciales
    const initialData = await getQuinielaLiveData(quinielaId);
    sendSSE(res, 'initial', initialData);

    // Limpiar al desconectar
    req.on('close', () => {
      sseConnections.get(quinielaId).delete(res);
      console.log('Cliente desconectado de SSE');
    });
  },

  // Broadcast a todos los clientes conectados
  broadcast(quinielaId, eventType, data) {
    const connections = sseConnections.get(quinielaId);
    if (!connections) return;

    connections.forEach(res => {
      sendSSE(res, eventType, data);
    });
  },
};

function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Cuando se actualiza un marcador
async function updatePartidoMarcador(partidoId, marcadores) {
  // ... actualizar BD ...

  // Broadcast a clientes conectados
  const partido = await Partido.findByPk(partidoId);
  sseController.broadcast(partido.quiniela_id, 'marcador-update', {
    partidoId,
    marcadores,
    timestamp: Date.now(),
  });
}

module.exports = sseController;
```

**Ruta:**
```javascript
// src/routes/sse.js
router.get('/quinielas/:quinielaId/live', sseController.connect);
```

**Frontend:**
```javascript
// sse-client.js
class SSEService {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
    this.handlers = {};
  }

  connect() {
    this.eventSource = new EventSource(this.url);

    // Evento de conexión
    this.eventSource.onopen = () => {
      console.log('✅ SSE Conectado');
    };

    // Evento de error
    this.eventSource.onerror = (error) => {
      console.error('❌ SSE Error:', error);
      // Auto-reconexión automática del navegador
    };

    // Datos iniciales
    this.eventSource.addEventListener('initial', (e) => {
      const data = JSON.parse(e.data);
      console.log('Datos iniciales:', data);
      this.emit('initial', data);
    });

    // Actualización de marcador
    this.eventSource.addEventListener('marcador-update', (e) => {
      const data = JSON.parse(e.data);
      console.log('🎯 Marcador actualizado:', data);
      this.emit('marcador-update', data);
    });

    // Actualización de tabla
    this.eventSource.addEventListener('tabla-update', (e) => {
      const data = JSON.parse(e.data);
      this.emit('tabla-update', data);
    });

    return this;
  }

  on(event, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
    return this;
  }

  emit(event, data) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(handler => handler(data));
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// USO:
const liveUpdates = new SSEService(
  'http://localhost:3000/api/v1/sse/quinielas/123/live'
);

liveUpdates
  .on('initial', (data) => {
    renderQuiniela(data);
  })
  .on('marcador-update', (data) => {
    actualizarMarcador(data.partidoId, data.marcadores);
    mostrarNotificacion('¡Gol!');
  })
  .on('tabla-update', (data) => {
    actualizarTablaPosiciones(data);
  })
  .connect();

// Desconectar al salir
window.addEventListener('beforeunload', () => {
  liveUpdates.disconnect();
});
```

**Costos:**
- 100 usuarios = 100 conexiones activas
- Cada conexión ~1-2KB memoria
- **Costo medio-bajo**

---

## 4️⃣ WebSockets (Más Costoso, Más Rápido)

### **Cuándo Usarlo:**
- Chat en tiempo real
- Juegos multijugador
- Colaboración en tiempo real
- **NO necesario para marcadores deportivos**

### **Implementación (si decides usarlo):**

**Backend con Socket.io:**
```bash
npm install socket.io
```

```javascript
// server.js
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// Namespace para quinielas
const quinielasNamespace = io.of('/quinielas');

quinielasNamespace.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Cliente se suscribe a una quiniela
  socket.on('subscribe', (quinielaId) => {
    socket.join(`quiniela:${quinielaId}`);
    console.log(`Cliente ${socket.id} suscrito a quiniela ${quinielaId}`);
  });

  // Cliente se desuscribe
  socket.on('unsubscribe', (quinielaId) => {
    socket.leave(`quiniela:${quinielaId}`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Broadcast de actualización
function broadcastMarcadorUpdate(quinielaId, data) {
  quinielasNamespace.to(`quiniela:${quinielaId}`).emit('marcador-update', data);
}

module.exports = { io, broadcastMarcadorUpdate };
```

**Frontend:**
```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
```

```javascript
const socket = io('http://localhost:3000/quinielas');

socket.on('connect', () => {
  console.log('✅ WebSocket conectado');

  // Suscribirse a quiniela
  socket.emit('subscribe', quinielaId);
});

socket.on('marcador-update', (data) => {
  console.log('⚡ Marcador actualizado:', data);
  actualizarMarcador(data);
});

socket.on('disconnect', () => {
  console.log('❌ WebSocket desconectado');
});
```

**Costos:**
- 100 usuarios = 100 conexiones WebSocket
- Cada conexión ~10KB memoria + CPU
- **Costo alto**

---

## 5️⃣ Estrategia Híbrida (RECOMENDADO) ⭐

### **Combinación Inteligente:**

```javascript
class HybridLiveService {
  constructor(quinielaId) {
    this.quinielaId = quinielaId;
    this.mode = this.detectBestMode();
  }

  detectBestMode() {
    // Detectar capacidades del navegador y conexión
    if ('EventSource' in window && navigator.connection?.effectiveType !== 'slow-2g') {
      return 'sse'; // Usar SSE si está disponible y conexión es buena
    }
    return 'polling'; // Fallback a polling
  }

  start(callback) {
    if (this.mode === 'sse') {
      this.startSSE(callback);
    } else {
      this.startPolling(callback);
    }
  }

  startSSE(callback) {
    // Usar SSE...
  }

  startPolling(callback) {
    // Usar Polling...
  }
}
```

---

## 🎯 Recomendación Específica para QuinielaPro

### **Arquitectura Propuesta:**

```
┌─────────────────────────────────────────────────────┐
│  RapidAPI Football (actualiza cada 1 min)           │
│  ↓ Webhook o Polling cada 60s                       │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  Servidor Backend                                    │
│  - Actualiza BD cuando hay cambios                  │
│  - Calcula tabla de posiciones                      │
│  - Broadcast a clientes (SSE o Polling)             │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  Clientes (Usuarios)                                 │
│  - Polling Simple: 15-30s (partidos no en vivo)    │
│  - SSE: Tiempo real (solo durante partidos en vivo)│
└─────────────────────────────────────────────────────┘
```

### **Implementación Recomendada:**

**1. Polling Simple para Vista General (15-30s)**
```javascript
// Para lista de quinielas, tabla general
const polling = new PollingService(url, 30000); // 30 segundos
```

**2. Polling Rápido Durante Partidos en Vivo (5-10s)**
```javascript
// Solo cuando hay partidos en vivo
if (hayPartidosEnVivo) {
  const polling = new PollingService(url, 10000); // 10 segundos
}
```

**3. SSE para Vista de Partido Individual (< 1s)**
```javascript
// Solo cuando usuario está viendo un partido específico
const sse = new SSEService(`/sse/partidos/${partidoId}/live`);
```

---

## 📊 Costos Comparados

### **Escenario: 100 usuarios activos**

**Opción 1: Solo Polling (30s)**
```
100 usuarios × 2 requests/minuto = 200 req/min
Costo servidor: BAJO
Latencia: 30s
```

**Opción 2: Solo SSE**
```
100 conexiones activas = ~200KB memoria
Costo servidor: MEDIO
Latencia: <1s
```

**Opción 3: Híbrido (RECOMENDADO)**
```
80 usuarios (polling 30s) = 160 req/min
20 usuarios viendo partido en vivo (SSE) = 20 conexiones

Costo servidor: BAJO-MEDIO
Latencia: 30s (general) / <1s (partido en vivo)
```

---

## 💡 Optimizaciones Adicionales

### **1. Polling Adaptativo**
```javascript
class AdaptivePolling {
  constructor(url) {
    this.url = url;
    this.interval = 30000; // Empezar con 30s
  }

  adjustInterval(hasChanges) {
    if (hasChanges) {
      // Hay actividad, aumentar frecuencia
      this.interval = Math.max(5000, this.interval - 5000);
    } else {
      // Sin cambios, reducir frecuencia
      this.interval = Math.min(60000, this.interval + 5000);
    }
  }
}
```

### **2. Cache Primero + Actualización en Background**
```javascript
// Mostrar datos cacheados inmediatamente
const cachedData = localStorage.getItem('tabla');
if (cachedData) {
  renderTabla(JSON.parse(cachedData));
}

// Actualizar en background
fetch(url).then(res => {
  localStorage.setItem('tabla', JSON.stringify(res.data));
  renderTabla(res.data);
});
```

### **3. Notificaciones Web API**
```javascript
// Solo notificar eventos importantes
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification('¡Gol!', {
    body: 'América 2 - 1 Chivas',
    icon: '/icon.png',
  });
}
```

---

## ✅ Plan de Implementación Recomendado

### **Fase 1: Básico (Implementar Ya)**
- ✅ Polling simple 30s para vista general
- ✅ Polling 10s cuando hay partidos en vivo
- ✅ Caché en frontend

**Costo:** Muy bajo
**Complejidad:** Muy baja
**Suficiente para:** 80% de casos de uso

### **Fase 2: Mejorado (Futuro)**
- ⬜ SSE para vista de partido individual
- ⬜ Notificaciones push para eventos importantes
- ⬜ Polling adaptativo

**Costo:** Medio
**Complejidad:** Media
**Mejora:** Experiencia premium

### **Fase 3: Avanzado (Solo si Crece Mucho)**
- ⬜ WebSockets para chat en vivo
- ⬜ Redis pub/sub para escalabilidad
- ⬜ CDN para static assets

**Costo:** Alto
**Complejidad:** Alta
**Necesario para:** 1000+ usuarios concurrentes

---

## 🎯 Conclusión

**Para QuinielaPro, recomiendo:**

1. **Empezar con Polling Simple (30s)**
   - Fácil de implementar
   - Bajo costo
   - Suficiente para la mayoría

2. **Agregar Polling Rápido (10s) solo durante partidos en vivo**
   - Detectar cuando hay partidos en progreso
   - Aumentar frecuencia automáticamente
   - Reducir cuando terminen

3. **Considerar SSE en el futuro** si:
   - Tienes 500+ usuarios concurrentes
   - Quieres experiencia "premium"
   - Tienes recursos de servidor

**Nunca necesitarás WebSockets** para mostrar marcadores deportivos. Es overkill.

---

## 📝 Código Listo para Usar

Implementación completa en:
- `REALTIME_IMPLEMENTATION.md` (próximamente)
- Ejemplos de código probados
- Comparativas de rendimiento

¿Quieres que implemente alguna de estas opciones en la API?
