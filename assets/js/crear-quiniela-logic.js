/**
 * crear-quiniela-logic.js
 * Lógica integrada para la página de Crear Quiniela
 * Ejemplo de uso de todos los módulos QuinielaPro
 */

// Estado global de la aplicación
const AppState = {
    formId: 'form-crear-quiniela',
    autoGuardadoInterval: null,
    borradorActualId: null
};

/**
 * Inicialización de la página
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Crear Quiniela...');

    // Verificar que los módulos estén disponibles
    verificarModulos();

    // Inicializar componentes
    inicializarFormulario();
    inicializarPartidos();
    inicializarEventos();
    cargarBorradores();
    inicializarAutoGuardado();

    UIHelpers.mostrarNotificacion('Sistema listo para crear quiniela', 'info', 2000);
});

/**
 * Verifica que todos los módulos estén cargados
 */
function verificarModulos() {
    const modulosRequeridos = ['Validators', 'Calculator', 'Formatters', 'Storage', 'PartidosManager', 'UIHelpers'];
    const modulosFaltantes = [];

    modulosRequeridos.forEach(modulo => {
        if (typeof window[modulo] === 'undefined') {
            modulosFaltantes.push(modulo);
        }
    });

    if (modulosFaltantes.length > 0) {
        console.error('❌ Módulos faltantes:', modulosFaltantes);
        UIHelpers.mostrarNotificacion(
            'Error: Algunos módulos no están cargados. Recarga la página.',
            'error',
            5000
        );
        return false;
    }

    console.log('✅ Todos los módulos cargados correctamente');
    return true;
}

/**
 * Inicializa el formulario con valores por defecto
 */
function inicializarFormulario() {
    const form = document.querySelector('form');
    if (!form) {
        console.error('❌ Formulario no encontrado');
        return;
    }

    // Asignar IDs y names a los campos para facilitar acceso
    const campos = {
        nombre: form.querySelector('input[type="text"][placeholder*="Liga MX"]'),
        deporte: form.querySelector('select'),
        descripcion: form.querySelector('textarea'),
        precio: form.querySelector('input[placeholder="100"]'),
        premioTotal: form.querySelector('input[placeholder="5000"]'),
        maxParticipantes: form.querySelector('input[placeholder="100"]'),
        fechaInicio: form.querySelectorAll('input[type="datetime-local"]')[0],
        fechaCierre: form.querySelectorAll('input[type="datetime-local"]')[1],
        fechaFinalizacion: form.querySelectorAll('input[type="datetime-local"]')[2]
    };

    // Asignar IDs y names
    Object.keys(campos).forEach(key => {
        if (campos[key]) {
            campos[key].id = key;
            campos[key].name = key;
        }
    });

    // Agregar ID al formulario
    form.id = AppState.formId;

    console.log('✅ Formulario inicializado');
}

/**
 * Inicializa el gestor de partidos
 */
function inicializarPartidos() {
    // Crear contenedor para partidos dinámicos si no existe
    let container = document.getElementById('partidos-container');

    if (!container) {
        // Buscar la sección de partidos y reemplazar el contenido estático
        const partidosSection = document.querySelector('.mb-8:has(button:contains("Agregar Partido"))');
        if (partidosSection) {
            const existingMatches = partidosSection.querySelectorAll('.border.rounded-lg.p-6.mb-4');
            existingMatches.forEach(match => match.remove());

            container = document.createElement('div');
            container.id = 'partidos-container';
            container.className = 'space-y-4';

            const placeholder = partidosSection.querySelector('.text-center.p-6');
            if (placeholder) {
                placeholder.remove();
            }

            const heading = partidosSection.querySelector('.flex.items-center.justify-between');
            if (heading) {
                heading.after(container);
            }
        }
    }

    // Inicializar PartidosManager
    PartidosManager.init('partidos-container', {
        onChange: (partidos) => {
            console.log('📝 Partidos actualizados:', partidos.length);
            actualizarContadorPartidos(partidos.length);
        },
        onAdd: (partido) => {
            console.log('➕ Partido agregado:', partido.id);
            UIHelpers.mostrarNotificacion('Partido agregado', 'success', 2000);
        },
        onRemove: (partido) => {
            console.log('➖ Partido eliminado:', partido.id);
            UIHelpers.mostrarNotificacion('Partido eliminado', 'info', 2000);
        }
    });

    console.log('✅ Gestor de partidos inicializado');
}

/**
 * Inicializa los event listeners
 */
function inicializarEventos() {
    const form = document.getElementById(AppState.formId);
    if (!form) return;

    // Botón Agregar Partido
    const btnAgregarPartido = document.querySelector('button[type="button"]:has(i.fa-plus)');
    if (btnAgregarPartido) {
        btnAgregarPartido.onclick = (e) => {
            e.preventDefault();
            PartidosManager.agregarPartido();
        };
    }

    // Botón Guardar Borrador
    const btnBorrador = Array.from(document.querySelectorAll('button[type="button"]'))
        .find(btn => btn.textContent.includes('Guardar como Borrador'));
    if (btnBorrador) {
        btnBorrador.onclick = (e) => {
            e.preventDefault();
            guardarBorrador();
        };
    }

    // Botón Crear Quiniela
    form.onsubmit = (e) => {
        e.preventDefault();
        crearQuiniela();
    };

    // Validación en tiempo real de fechas
    ['fechaInicio', 'fechaCierre', 'fechaFinalizacion'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', validarFechas);
        }
    });

    // Validación de precio
    const precioInput = document.getElementById('precio');
    if (precioInput) {
        precioInput.addEventListener('blur', function() {
            const validation = Validators.positiveNumber(this.value);
            if (!validation.valid && this.value) {
                this.classList.add('border-red-500');
                UIHelpers.mostrarNotificacion(validation.message, 'error', 2000);
            } else {
                this.classList.remove('border-red-500');
            }
        });
    }

    console.log('✅ Eventos inicializados');
}

/**
 * Valida las fechas del formulario
 */
function validarFechas() {
    const fechaInicio = document.getElementById('fechaInicio')?.value;
    const fechaCierre = document.getElementById('fechaCierre')?.value;
    const fechaFinalizacion = document.getElementById('fechaFinalizacion')?.value;

    if (fechaInicio && fechaCierre && fechaFinalizacion) {
        const validation = Validators.quinielaDateRange({
            inicio: fechaInicio,
            cierre: fechaCierre,
            finalizacion: fechaFinalizacion
        });

        if (!validation.valid) {
            UIHelpers.mostrarNotificacion(validation.errors[0], 'error', 3000);
            return false;
        }
    }

    return true;
}

/**
 * Obtiene los datos del formulario
 */
function obtenerDatosFormulario() {
    return {
        nombre: document.getElementById('nombre')?.value || '',
        deporte: document.getElementById('deporte')?.value || '',
        descripcion: document.getElementById('descripcion')?.value || '',
        precio: parseFloat(document.getElementById('precio')?.value) || 0,
        premioTotal: parseFloat(document.getElementById('premioTotal')?.value) || 0,
        maxParticipantes: parseInt(document.getElementById('maxParticipantes')?.value) || 0,
        fechaInicio: document.getElementById('fechaInicio')?.value || '',
        fechaCierre: document.getElementById('fechaCierre')?.value || '',
        fechaFinalizacion: document.getElementById('fechaFinalizacion')?.value || '',
        partidos: PartidosManager.obtenerTodos()
    };
}

/**
 * Crea la quiniela (con validación completa)
 */
function crearQuiniela() {
    console.log('🎯 Intentando crear quiniela...');

    // Limpiar errores previos
    UIHelpers.limpiarErroresFormulario(AppState.formId);

    // Obtener datos del formulario
    const formData = obtenerDatosFormulario();

    // Preparar datos para validación (formato requerido por Validators)
    const datosParaValidar = {
        ...formData,
        premios: [
            { posicion: 1, monto: formData.premioTotal }
        ]
    };

    // Validar formulario completo
    const validation = Validators.quinielaForm(datosParaValidar);

    if (!validation.valid) {
        console.error('❌ Validación fallida:', validation.errors);
        UIHelpers.mostrarErroresFormulario(validation.errors, AppState.formId);
        UIHelpers.mostrarNotificacion('Por favor corrige los errores en el formulario', 'error', 4000);
        return;
    }

    // Si llegamos aquí, la validación pasó
    console.log('✅ Validación exitosa');
    UIHelpers.mostrarLoader('Creando quiniela...');

    // Simular creación (aquí iría la llamada a la API)
    setTimeout(() => {
        // Guardar en localStorage como quiniela creada
        const quinielaId = `quiniela_${Date.now()}`;
        const quiniela = {
            id: quinielaId,
            ...formData,
            estado: 'activa',
            fechaCreacion: new Date().toISOString(),
            participantes: 0
        };

        // Guardar en localStorage
        let quinielas = Storage.get('quinielas_creadas', []);
        quinielas.push(quiniela);
        Storage.set('quinielas_creadas', quinielas);

        // Eliminar borrador si existe
        if (AppState.borradorActualId) {
            Storage.eliminarBorradorQuiniela(AppState.borradorActualId);
            AppState.borradorActualId = null;
        }

        UIHelpers.ocultarLoader();
        UIHelpers.mostrarNotificacion('¡Quiniela creada exitosamente!', 'success', 3000);

        // Limpiar formulario
        document.getElementById(AppState.formId).reset();
        PartidosManager.limpiar();

        // Redirigir después de 2 segundos
        setTimeout(() => {
            window.location.href = 'gestionar-quinielas.html';
        }, 2000);
    }, 1500);
}

/**
 * Guarda el formulario como borrador
 */
function guardarBorrador() {
    console.log('💾 Guardando borrador...');

    const formData = obtenerDatosFormulario();

    // Guardar borrador
    const borradorId = Storage.guardarBorradorQuiniela({
        id: AppState.borradorActualId,
        ...formData
    });

    AppState.borradorActualId = borradorId;

    UIHelpers.mostrarNotificacion('Borrador guardado exitosamente', 'success', 2000);
    console.log('✅ Borrador guardado con ID:', borradorId);
}

/**
 * Auto-guardado cada 30 segundos
 */
function inicializarAutoGuardado() {
    const config = Storage.obtenerConfiguracion();

    if (config.autoGuardado !== false) {
        AppState.autoGuardadoInterval = setInterval(() => {
            const formData = obtenerDatosFormulario();

            // Solo auto-guardar si hay algo en el formulario
            if (formData.nombre || formData.partidos.length > 0) {
                Storage.guardarEstadoFormulario(AppState.formId, formData);
                console.log('💾 Auto-guardado realizado');
            }
        }, 30000); // 30 segundos

        console.log('✅ Auto-guardado activado (cada 30 segundos)');
    }
}

/**
 * Carga borradores existentes
 */
function cargarBorradores() {
    const borradores = Storage.obtenerBorradoresQuinielas();

    if (borradores.length > 0) {
        console.log('📋 Borradores encontrados:', borradores.length);

        // Mostrar opción de cargar borrador
        const ultimoBorrador = borradores[borradores.length - 1];

        UIHelpers.mostrarConfirmacion(
            'Borrador Encontrado',
            `Se encontró un borrador guardado: "${ultimoBorrador.nombre || 'Sin nombre'}". ¿Deseas cargarlo?`,
            () => {
                cargarBorrador(ultimoBorrador);
            }
        );
    }
}

/**
 * Carga un borrador en el formulario
 */
function cargarBorrador(borrador) {
    console.log('📥 Cargando borrador:', borrador.id);

    // Cargar datos básicos
    if (borrador.nombre) document.getElementById('nombre').value = borrador.nombre;
    if (borrador.deporte) document.getElementById('deporte').value = borrador.deporte;
    if (borrador.descripcion) document.getElementById('descripcion').value = borrador.descripcion;
    if (borrador.precio) document.getElementById('precio').value = borrador.precio;
    if (borrador.premioTotal) document.getElementById('premioTotal').value = borrador.premioTotal;
    if (borrador.maxParticipantes) document.getElementById('maxParticipantes').value = borrador.maxParticipantes;
    if (borrador.fechaInicio) document.getElementById('fechaInicio').value = borrador.fechaInicio;
    if (borrador.fechaCierre) document.getElementById('fechaCierre').value = borrador.fechaCierre;
    if (borrador.fechaFinalizacion) document.getElementById('fechaFinalizacion').value = borrador.fechaFinalizacion;

    // Cargar partidos
    if (borrador.partidos && borrador.partidos.length > 0) {
        PartidosManager.cargar(borrador.partidos);
    }

    AppState.borradorActualId = borrador.id;

    UIHelpers.mostrarNotificacion('Borrador cargado exitosamente', 'success', 2000);
}

/**
 * Actualiza el contador de partidos
 */
function actualizarContadorPartidos(cantidad) {
    // Actualizar UI si existe un contador
    const contador = document.getElementById('contador-partidos');
    if (contador) {
        UIHelpers.animarContador(contador, cantidad);
    }
}

/**
 * Limpiar al salir de la página
 */
window.addEventListener('beforeunload', function() {
    if (AppState.autoGuardadoInterval) {
        clearInterval(AppState.autoGuardadoInterval);
    }
});

// Exponer funciones globalmente para debugging
window.QuinielaCreator = {
    obtenerDatos: obtenerDatosFormulario,
    validar: () => {
        const datos = obtenerDatosFormulario();
        return Validators.quinielaForm({
            ...datos,
            premios: [{ posicion: 1, monto: datos.premioTotal }]
        });
    },
    guardarBorrador: guardarBorrador,
    cargarBorrador: cargarBorrador,
    state: AppState
};

console.log('✅ Crear Quiniela Logic inicializado');
console.log('💡 Debug: window.QuinielaCreator disponible');
