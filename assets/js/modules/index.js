/**
 * index.js
 * Archivo índice para importar todos los módulos de QuinielaPro
 * Facilita la carga de módulos en las páginas
 */

// Este archivo sirve como punto de entrada para todos los módulos
// Los módulos están disponibles globalmente como objetos individuales:
//
// - Validators: Validaciones de formularios y datos
// - Calculator: Cálculos de ganadores y estadísticas
// - Filters: Filtrado, búsqueda y ordenamiento
// - Storage: Gestión de localStorage
// - PartidosManager: Gestión dinámica de partidos
// - Formatters: Formateo de datos (fechas, monedas, etc.)
// - UIHelpers: Utilidades de UI (notificaciones, modales, etc.)

/**
 * Inicialización global de módulos
 * Ejecutar esta función al cargar la página para verificar que todos los módulos estén disponibles
 */
function initQuinielaProModules() {
    const modules = {
        Validators,
        Calculator,
        Filters,
        Storage,
        PartidosManager,
        Formatters,
        UIHelpers
    };

    console.log('✅ Módulos QuinielaPro cargados:');
    Object.keys(modules).forEach(moduleName => {
        console.log(`   - ${moduleName}`);
    });

    return modules;
}

/**
 * Verificar si un módulo está disponible
 * @param {string} moduleName - Nombre del módulo
 * @returns {boolean} true si está disponible
 */
function isModuleAvailable(moduleName) {
    const modules = ['Validators', 'Calculator', 'Filters', 'Storage', 'PartidosManager', 'Formatters', 'UIHelpers'];
    return modules.includes(moduleName) && typeof window[moduleName] !== 'undefined';
}

// Auto-inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuinielaProModules);
} else {
    initQuinielaProModules();
}
