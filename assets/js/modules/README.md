# Módulos QuinielaPro - Documentación

Este directorio contiene todos los módulos de lógica pura para QuinielaPro. Estos módulos **NO requieren backend/API** y funcionan completamente en el frontend.

## 📦 Módulos Disponibles

### 1. **validators.js** - Sistema de Validaciones
Contiene todas las validaciones para formularios, datos y reglas de negocio.

**Funciones principales:**
- `required(value)` - Valida campos requeridos
- `positiveNumber(value)` - Valida números positivos
- `email(email)` - Valida formato de email
- `quinielaDateRange(dates)` - Valida rangos de fechas para quinielas
- `quinielaForm(formData)` - Valida formulario completo de creación de quiniela
- `userPicks(picks, totalPartidos)` - Valida picks de usuario

**Ejemplo de uso:**
```javascript
// Validar un campo requerido
const result = Validators.required(nombre);
if (!result.valid) {
    console.log(result.message); // "Este campo es requerido"
}

// Validar formulario completo de quiniela
const formData = {
    nombre: 'Liga MX Jornada 5',
    descripcion: 'Quiniela de la jornada 5',
    deporte: 'Fútbol',
    fechaInicio: '2025-12-01',
    fechaCierre: '2025-12-05',
    fechaFinalizacion: '2025-12-08',
    precio: 100,
    premios: [
        { posicion: 1, monto: 500 },
        { posicion: 2, monto: 300 }
    ],
    partidos: [...]
};

const validation = Validators.quinielaForm(formData);
if (!validation.valid) {
    console.log(validation.errors); // Objeto con errores por campo
}
```

---

### 2. **calculator.js** - Cálculo de Ganadores y Estadísticas
Algoritmos para calcular ganadores, estadísticas de usuarios y quinielas.

**Funciones principales:**
- `calcularAciertos(userPicks, resultadosReales)` - Calcula aciertos de un usuario
- `calcularGanadores(participaciones, resultadosReales)` - Calcula ganadores ordenados
- `distribuirPremios(ganadores, premios)` - Distribuye premios entre ganadores
- `calcularEstadisticasUsuario(participaciones)` - Calcula stats completas de usuario
- `calcularEstadisticasQuiniela(participaciones, resultados)` - Stats de la quiniela
- `calcularRacha(participaciones)` - Calcula racha de victorias/derrotas

**Ejemplo de uso:**
```javascript
// Calcular ganadores de una quiniela
const participaciones = [
    {
        userId: 1,
        userName: 'Juan',
        picks: [
            { partidoId: 1, resultado: 'local' },
            { partidoId: 2, resultado: 'visitante' }
        ],
        timestamp: 1234567890
    },
    // ... más participaciones
];

const resultadosReales = [
    { partidoId: 1, golesLocal: 2, golesVisitante: 1 }, // Ganó local
    { partidoId: 2, golesLocal: 0, golesVisitante: 2 }  // Ganó visitante
];

const ganadores = Calculator.calcularGanadores(participaciones, resultadosReales);
// Retorna array ordenado con: userId, aciertos, posicion, etc.

// Distribuir premios
const premios = [
    { posicion: 1, monto: 500, descripcion: '1er Lugar' },
    { posicion: 2, monto: 300, descripcion: '2do Lugar' }
];

const ganadoresConPremios = Calculator.distribuirPremios(ganadores, premios);
```

---

### 3. **filters.js** - Filtrado, Búsqueda y Ordenamiento
Sistema completo de filtrado y búsqueda para quinielas, usuarios y más.

**Funciones principales:**
- `filtrarQuinielas(quinielas, criterios)` - Filtra por múltiples criterios
- `buscarQuinielas(quinielas, query)` - Búsqueda de texto
- `ordenarQuinielas(quinielas, campo, direccion)` - Ordena resultados
- `paginar(datos, pagina, porPagina)` - Pagina resultados
- `procesarQuinielas(quinielas, opciones)` - Aplica filtros + búsqueda + orden + paginación

**Ejemplo de uso:**
```javascript
// Filtrar quinielas
const quinielas = [...]; // Array de quinielas

const quinielasFiltradas = Filters.filtrarQuinielas(quinielas, {
    estado: 'activa',
    deporte: 'Fútbol',
    precioMin: 50,
    precioMax: 200
});

// Buscar en quinielas
const resultados = Filters.buscarQuinielas(quinielas, 'Liga MX');

// Procesar con todo en una llamada
const resultado = Filters.procesarQuinielas(quinielas, {
    filtros: { estado: 'activa', deporte: 'Fútbol' },
    busqueda: 'Liga',
    orden: { campo: 'precio', direccion: 'asc' },
    pagina: 1,
    porPagina: 10
});

// resultado contiene: { datos, totalPaginas, paginaActual, total, ... }
```

---

### 4. **storage.js** - Gestión de localStorage
Maneja almacenamiento persistente en el navegador.

**Funciones principales:**
- `set(key, value)` - Guarda un valor
- `get(key, defaultValue)` - Obtiene un valor
- `guardarBorradorQuiniela(borrador)` - Guarda borrador de quiniela
- `obtenerBorradoresQuinielas()` - Obtiene todos los borradores
- `agregarFavorito(quinielaId)` - Marca quiniela como favorita
- `guardarCacheQuinielas(quinielas, ttl)` - Guarda caché para uso offline
- `guardarEstadoFormulario(formId, data)` - Auto-guardado de formularios

**Ejemplo de uso:**
```javascript
// Guardar borrador de quiniela
const borrador = {
    nombre: 'Mi Quiniela',
    descripcion: 'Descripción...',
    partidos: [...]
};

const borradorId = Storage.guardarBorradorQuiniela(borrador);

// Recuperar borradores
const borradores = Storage.obtenerBorradoresQuinielas();

// Marcar como favorito
Storage.agregarFavorito('quiniela_123');

// Auto-guardado de formulario
Storage.guardarEstadoFormulario('form-crear-quiniela', {
    nombre: 'Liga MX',
    deporte: 'Fútbol'
});

// Recuperar estado
const estadoGuardado = Storage.recuperarEstadoFormulario('form-crear-quiniela');
```

---

### 5. **partidosManager.js** - Gestión Dinámica de Partidos
Maneja creación, edición y eliminación de partidos en formularios.

**Funciones principales:**
- `init(containerId, options)` - Inicializa el gestor
- `agregarPartido(data)` - Agrega un nuevo partido
- `eliminarPartido(partidoId)` - Elimina un partido
- `actualizarPartido(partidoId, data)` - Actualiza datos
- `validar()` - Valida todos los partidos
- `cargar(partidos)` - Carga partidos desde array

**Ejemplo de uso:**
```javascript
// Inicializar gestor
PartidosManager.init('partidos-container', {
    onChange: (partidos) => {
        console.log('Partidos actualizados:', partidos);
    },
    onAdd: (partido) => {
        console.log('Partido agregado:', partido);
    }
});

// Agregar partido
PartidosManager.agregarPartido({
    equipoLocal: 'América',
    equipoVisitante: 'Chivas',
    fecha: '2025-12-01',
    hora: '20:00'
});

// Validar todos los partidos
const validacion = PartidosManager.validar();
if (!validacion.valid) {
    console.log('Errores:', validacion.errors);
}

// Obtener todos los partidos
const partidos = PartidosManager.obtenerTodos();
```

---

### 6. **formatters.js** - Formateo de Datos
Funciones para formatear fechas, monedas, números y más.

**Funciones principales:**
- `moneda(valor, moneda, locale)` - Formatea moneda
- `numero(valor, decimales)` - Formatea números
- `porcentaje(valor, decimales)` - Formatea porcentajes
- `fecha(fecha, opciones)` - Formatea fechas
- `fechaRelativa(fecha)` - Fecha relativa (hace 2 días)
- `marcador(golesLocal, golesVisitante)` - Formatea marcador
- `estadoQuiniela(estado)` - Formatea estado con clases CSS

**Ejemplo de uso:**
```javascript
// Formatear moneda
Formatters.moneda(1500); // "$1,500.00"
Formatters.moneda(2500, 'USD', 'en-US'); // "$2,500.00"

// Formatear fecha
Formatters.fecha('2025-12-01'); // "1 de diciembre de 2025"
Formatters.fechaCorta('2025-12-01'); // "01/12/2025"
Formatters.fechaRelativa('2025-11-16'); // "hace 2 días"

// Formatear marcador
Formatters.marcador(3, 1); // "3 - 1"

// Formatear porcentaje
Formatters.porcentaje(75.5); // "75.50%"

// Estado de quiniela (retorna objeto con texto y clase CSS)
const estado = Formatters.estadoQuiniela('activa');
// { texto: 'Activa', clase: 'bg-green-100 text-green-800...' }
```

---

### 7. **ui-helpers.js** - Utilidades de UI
Helper functions para manipulación del DOM, notificaciones, modales, etc.

**Funciones principales:**
- `mostrarNotificacion(mensaje, tipo, duracion)` - Muestra toast notifications
- `mostrarConfirmacion(titulo, mensaje, onConfirm)` - Modal de confirmación
- `mostrarLoader(mensaje)` / `ocultarLoader()` - Muestra/oculta spinner
- `mostrarErroresFormulario(errors, formId)` - Muestra errores de validación
- `animarContador(elemento, valorFinal)` - Anima un contador
- `actualizarProgreso(elemento, porcentaje)` - Actualiza barra de progreso
- `copiarAlPortapapeles(texto)` - Copia texto
- `descargarJSON(datos, nombreArchivo)` - Descarga datos como JSON
- `debounce(func, delay)` - Debounce para búsquedas

**Ejemplo de uso:**
```javascript
// Mostrar notificación
UIHelpers.mostrarNotificacion('Quiniela creada exitosamente', 'success');
UIHelpers.mostrarNotificacion('Error al guardar', 'error');

// Modal de confirmación
UIHelpers.mostrarConfirmacion(
    '¿Eliminar quiniela?',
    'Esta acción no se puede deshacer',
    () => {
        // Usuario confirmó
        console.log('Eliminando...');
    }
);

// Mostrar loader
UIHelpers.mostrarLoader('Guardando...');
// ... hacer operación
UIHelpers.ocultarLoader();

// Mostrar errores de formulario
UIHelpers.mostrarErroresFormulario({
    nombre: 'El nombre es requerido',
    precio: 'Debe ser mayor a 0'
}, 'form-crear-quiniela');

// Animar contador
UIHelpers.animarContador('contador-participantes', 150, 2000);

// Debounce para búsqueda
const buscarQuinielas = UIHelpers.debounce((query) => {
    console.log('Buscando:', query);
}, 300);

input.addEventListener('input', (e) => buscarQuinielas(e.target.value));
```

---

## 🚀 Cómo Usar los Módulos

### Paso 1: Incluir los scripts en HTML

Agrega los scripts en el `<head>` o antes de `</body>`:

```html
<!-- Cargar módulos -->
<script src="/assets/js/modules/validators.js"></script>
<script src="/assets/js/modules/calculator.js"></script>
<script src="/assets/js/modules/filters.js"></script>
<script src="/assets/js/modules/storage.js"></script>
<script src="/assets/js/modules/partidosManager.js"></script>
<script src="/assets/js/modules/formatters.js"></script>
<script src="/assets/js/modules/ui-helpers.js"></script>

<!-- Inicialización (opcional) -->
<script src="/assets/js/modules/index.js"></script>
```

### Paso 2: Usar los módulos

Todos los módulos están disponibles globalmente:

```javascript
// En tu código JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Validar un formulario
    const validation = Validators.required(document.getElementById('nombre').value);

    // Formatear una fecha
    document.getElementById('fecha').textContent = Formatters.fecha(new Date());

    // Mostrar notificación
    UIHelpers.mostrarNotificacion('Bienvenido', 'success');
});
```

---

## 📋 Ejemplos Completos

### Ejemplo 1: Crear Quiniela con Validación

```javascript
function crearQuiniela() {
    // Obtener datos del formulario
    const formData = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        deporte: document.getElementById('deporte').value,
        fechaInicio: document.getElementById('fechaInicio').value,
        fechaCierre: document.getElementById('fechaCierre').value,
        fechaFinalizacion: document.getElementById('fechaFinalizacion').value,
        precio: parseFloat(document.getElementById('precio').value),
        premios: obtenerPremios(),
        partidos: PartidosManager.obtenerTodos()
    };

    // Validar
    const validation = Validators.quinielaForm(formData);

    if (!validation.valid) {
        UIHelpers.mostrarErroresFormulario(validation.errors, 'form-crear-quiniela');
        UIHelpers.mostrarNotificacion('Por favor corrige los errores', 'error');
        return;
    }

    // Guardar (cuando haya API, aquí iría la llamada)
    // Por ahora, guardar en localStorage
    Storage.guardarBorradorQuiniela(formData);

    UIHelpers.mostrarNotificacion('Quiniela guardada como borrador', 'success');

    // Limpiar formulario
    document.getElementById('form-crear-quiniela').reset();
    PartidosManager.limpiar();
}
```

### Ejemplo 2: Calcular Ganadores

```javascript
function calcularYMostrarGanadores(quinielaId) {
    // Obtener datos (simulado, vendrá de API)
    const participaciones = obtenerParticipaciones(quinielaId);
    const resultados = obtenerResultadosReales(quinielaId);
    const premios = obtenerPremios(quinielaId);

    // Calcular ganadores
    const ganadores = Calculator.calcularGanadores(participaciones, resultados);

    // Distribuir premios
    const ganadoresConPremios = Calculator.distribuirPremios(ganadores, premios);

    // Renderizar resultados
    const container = document.getElementById('ganadores-container');
    container.innerHTML = '';

    ganadoresConPremios.forEach(ganador => {
        const html = `
            <div class="p-4 border rounded-lg ${ganador.esPremio ? 'bg-yellow-50' : ''}">
                <div class="flex justify-between">
                    <div>
                        <span class="font-bold">${ganador.posicion}°</span>
                        <span>${ganador.userName}</span>
                    </div>
                    <div>
                        <span class="text-green-600">${ganador.aciertos} aciertos</span>
                        ${ganador.premio ? `<span class="ml-4 font-bold">${Formatters.moneda(ganador.premio.monto)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}
```

### Ejemplo 3: Filtrar y Buscar Quinielas

```javascript
function inicializarFiltros() {
    const searchInput = document.getElementById('search');
    const filtroDeporte = document.getElementById('filtro-deporte');
    const filtroEstado = document.getElementById('filtro-estado');

    // Debounce para búsqueda
    const buscar = UIHelpers.debounce(() => {
        aplicarFiltros();
    }, 300);

    searchInput.addEventListener('input', buscar);
    filtroDeporte.addEventListener('change', aplicarFiltros);
    filtroEstado.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
    const quinielas = obtenerTodasLasQuinielas(); // De localStorage o API

    const resultado = Filters.procesarQuinielas(quinielas, {
        filtros: {
            deporte: document.getElementById('filtro-deporte').value,
            estado: document.getElementById('filtro-estado').value
        },
        busqueda: document.getElementById('search').value,
        orden: { campo: 'fechaInicio', direccion: 'desc' },
        pagina: 1,
        porPagina: 12
    });

    renderizarQuinielas(resultado.datos);
    renderizarPaginacion(resultado);
}
```

---

## 🎯 Casos de Uso por Página

### Panel Admin - Crear Quiniela
- `PartidosManager` - Gestionar partidos dinámicamente
- `Validators` - Validar formulario completo
- `Storage` - Guardar borradores
- `UIHelpers` - Notificaciones y errores
- `Formatters` - Formatear fechas en preview

### Panel Admin - Ingresar Resultados
- `Validators` - Validar marcadores
- `Calculator` - Calcular ganadores automáticamente
- `Formatters` - Formatear marcadores
- `UIHelpers` - Progress bars y notificaciones

### Panel Usuario - Quinielas Disponibles
- `Filters` - Filtrar, buscar y paginar
- `Formatters` - Formatear precios, fechas
- `Storage` - Favoritos y caché
- `UIHelpers` - Skeletons mientras carga

### Panel Usuario - Mis Quinielas
- `Calculator` - Calcular estadísticas del usuario
- `Formatters` - Formatear stats
- `Filters` - Filtrar por estado

---

## ✅ Características

- ✅ **100% Frontend** - No requieren backend
- ✅ **Modulares** - Cada archivo es independiente
- ✅ **Reutilizables** - Usa en cualquier página
- ✅ **Bien documentados** - JSDoc en cada función
- ✅ **Sin dependencias** - JavaScript vanilla puro
- ✅ **Fáciles de mantener** - Código organizado y limpio

---

## 🔄 Próximos Pasos

Cuando se implemente el backend:
1. Los módulos seguirán funcionando tal cual
2. Solo se agregará la capa de API calls
3. Los datos vendrán de la API en lugar de localStorage
4. La lógica de validación y cálculo permanece igual

---

## 📝 Notas

- Todos los módulos usan `localStorage` con prefijo `quinielapro_`
- Los módulos son compatibles con ES5+ (no requieren transpilación)
- Incluyen soporte para modo oscuro en los componentes UI
- Formatters usa `Intl` API para i18n (español-México por defecto)

---

**Autor:** QuinielaPro Team
**Versión:** 1.0
**Última actualización:** 2025-11-18
