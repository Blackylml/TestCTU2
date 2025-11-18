/**
 * ui-helpers.js
 * Módulo de utilidades de UI para QuinielaPro
 * Funciones helper para manipulación del DOM, notificaciones, modales, etc.
 */

const UIHelpers = {
    /**
     * Muestra una notificación toast
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de notificación (success, error, warning, info)
     * @param {number} duracion - Duración en milisegundos
     */
    mostrarNotificacion(mensaje, tipo = 'info', duracion = 3000) {
        // Crear contenedor de notificaciones si no existe
        let container = document.getElementById('notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(container);
        }

        // Configuración de colores por tipo
        const tipos = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };

        const iconos = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `${tipos[tipo]} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3
                                  transform transition-all duration-300 translate-x-0 opacity-100`;

        notification.innerHTML = `
            <i class="fas ${iconos[tipo]}"></i>
            <span>${mensaje}</span>
            <button onclick="this.parentElement.remove()" class="ml-4 hover:opacity-80">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Auto-eliminar después de la duración
        if (duracion > 0) {
            setTimeout(() => {
                notification.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => notification.remove(), 300);
            }, duracion);
        }
    },

    /**
     * Muestra un modal de confirmación
     * @param {string} titulo - Título del modal
     * @param {string} mensaje - Mensaje del modal
     * @param {function} onConfirm - Callback al confirmar
     * @param {function} onCancel - Callback al cancelar
     */
    mostrarConfirmacion(titulo, mensaje, onConfirm, onCancel = null) {
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        overlay.id = 'modal-overlay';

        // Crear modal
        const modal = document.createElement('div');
        modal.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4';

        modal.innerHTML = `
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">${titulo}</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">${mensaje}</p>
            <div class="flex justify-end gap-3">
                <button id="modal-cancel"
                        class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200
                               rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    Cancelar
                </button>
                <button id="modal-confirm"
                        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                    Confirmar
                </button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Event listeners
        document.getElementById('modal-cancel').addEventListener('click', () => {
            overlay.remove();
            if (onCancel) onCancel();
        });

        document.getElementById('modal-confirm').addEventListener('click', () => {
            overlay.remove();
            if (onConfirm) onConfirm();
        });

        // Cerrar con click fuera del modal
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                if (onCancel) onCancel();
            }
        });
    },

    /**
     * Muestra un loader/spinner
     * @param {string} mensaje - Mensaje opcional
     */
    mostrarLoader(mensaje = 'Cargando...') {
        // Remover loader existente si hay
        this.ocultarLoader();

        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';

        loader.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p class="text-gray-900 dark:text-white">${mensaje}</p>
            </div>
        `;

        document.body.appendChild(loader);
    },

    /**
     * Oculta el loader
     */
    ocultarLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.remove();
        }
    },

    /**
     * Muestra errores de validación en un formulario
     * @param {object} errors - Objeto de errores {campo: mensaje}
     * @param {string} formId - ID del formulario
     */
    mostrarErroresFormulario(errors, formId = null) {
        // Limpiar errores previos
        this.limpiarErroresFormulario(formId);

        Object.entries(errors).forEach(([campo, mensaje]) => {
            const input = formId
                ? document.querySelector(`#${formId} [name="${campo}"]`)
                : document.querySelector(`[name="${campo}"]`);

            if (input) {
                // Agregar clase de error al input
                input.classList.add('border-red-500', 'focus:border-red-500');

                // Crear mensaje de error
                const errorDiv = document.createElement('div');
                errorDiv.className = 'text-red-500 text-sm mt-1 error-message';
                errorDiv.textContent = Array.isArray(mensaje) ? mensaje[0] : mensaje;

                // Insertar mensaje después del input
                input.parentElement.appendChild(errorDiv);
            }
        });
    },

    /**
     * Limpia errores de validación de un formulario
     * @param {string} formId - ID del formulario
     */
    limpiarErroresFormulario(formId = null) {
        const selector = formId ? `#${formId}` : '';

        // Remover clases de error
        document.querySelectorAll(`${selector} input.border-red-500, ${selector} select.border-red-500, ${selector} textarea.border-red-500`).forEach(input => {
            input.classList.remove('border-red-500', 'focus:border-red-500');
        });

        // Remover mensajes de error
        document.querySelectorAll(`${selector} .error-message`).forEach(msg => msg.remove());
    },

    /**
     * Actualiza un contador con animación
     * @param {HTMLElement|string} elemento - Elemento o ID del elemento
     * @param {number} valorFinal - Valor final
     * @param {number} duracion - Duración de la animación en ms
     */
    animarContador(elemento, valorFinal, duracion = 1000) {
        const el = typeof elemento === 'string' ? document.getElementById(elemento) : elemento;
        if (!el) return;

        const valorInicial = parseInt(el.textContent) || 0;
        const diferencia = valorFinal - valorInicial;
        const incremento = diferencia / (duracion / 16); // 60 FPS
        let valorActual = valorInicial;

        const animate = () => {
            valorActual += incremento;

            if ((incremento > 0 && valorActual >= valorFinal) ||
                (incremento < 0 && valorActual <= valorFinal)) {
                el.textContent = valorFinal;
                return;
            }

            el.textContent = Math.round(valorActual);
            requestAnimationFrame(animate);
        };

        animate();
    },

    /**
     * Actualiza una barra de progreso
     * @param {HTMLElement|string} elemento - Elemento o ID de la barra
     * @param {number} porcentaje - Porcentaje (0-100)
     * @param {boolean} animado - Si debe animarse
     */
    actualizarProgreso(elemento, porcentaje, animado = true) {
        const el = typeof elemento === 'string' ? document.getElementById(elemento) : elemento;
        if (!el) return;

        const valor = Math.min(100, Math.max(0, porcentaje));

        if (animado) {
            el.style.transition = 'width 0.3s ease-in-out';
        }

        el.style.width = `${valor}%`;
    },

    /**
     * Muestra/oculta un elemento con animación
     * @param {HTMLElement|string} elemento - Elemento o ID
     * @param {boolean} mostrar - true para mostrar, false para ocultar
     */
    toggleElemento(elemento, mostrar) {
        const el = typeof elemento === 'string' ? document.getElementById(elemento) : elemento;
        if (!el) return;

        if (mostrar) {
            el.classList.remove('hidden');
            setTimeout(() => el.classList.add('opacity-100'), 10);
        } else {
            el.classList.remove('opacity-100');
            setTimeout(() => el.classList.add('hidden'), 300);
        }
    },

    /**
     * Crea un badge HTML
     * @param {string} texto - Texto del badge
     * @param {string} color - Color (success, error, warning, info, gray)
     * @returns {string} HTML del badge
     */
    crearBadge(texto, color = 'gray') {
        const colores = {
            success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        };

        const clase = colores[color] || colores.gray;

        return `<span class="px-2 py-1 text-xs rounded-full ${clase}">${texto}</span>`;
    },

    /**
     * Crea un botón HTML
     * @param {object} opciones - {texto, icono, color, size, onclick}
     * @returns {string} HTML del botón
     */
    crearBoton(opciones = {}) {
        const {
            texto = 'Botón',
            icono = null,
            color = 'primary',
            size = 'md',
            onclick = '',
            disabled = false
        } = opciones;

        const colores = {
            primary: 'bg-primary-600 hover:bg-primary-700 text-white',
            secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white',
            success: 'bg-green-600 hover:bg-green-700 text-white',
            danger: 'bg-red-600 hover:bg-red-700 text-white',
            gray: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };

        const sizes = {
            sm: 'px-3 py-1 text-sm',
            md: 'px-4 py-2',
            lg: 'px-6 py-3 text-lg'
        };

        const claseColor = colores[color] || colores.primary;
        const claseSize = sizes[size] || sizes.md;
        const iconoHtml = icono ? `<i class="fas ${icono} mr-2"></i>` : '';
        const disabledAttr = disabled ? 'disabled' : '';
        const onclickAttr = onclick ? `onclick="${onclick}"` : '';

        return `
            <button type="button"
                    class="${claseColor} ${claseSize} rounded-lg transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${disabledAttr} ${onclickAttr}>
                ${iconoHtml}${texto}
            </button>
        `;
    },

    /**
     * Copia texto al portapapeles
     * @param {string} texto - Texto a copiar
     * @returns {Promise<boolean>} Promise que resuelve true si se copió
     */
    async copiarAlPortapapeles(texto) {
        try {
            await navigator.clipboard.writeText(texto);
            this.mostrarNotificacion('Copiado al portapapeles', 'success', 2000);
            return true;
        } catch (error) {
            console.error('Error al copiar:', error);
            this.mostrarNotificacion('Error al copiar', 'error', 2000);
            return false;
        }
    },

    /**
     * Descarga datos como archivo JSON
     * @param {object} datos - Datos a descargar
     * @param {string} nombreArchivo - Nombre del archivo
     */
    descargarJSON(datos, nombreArchivo = 'datos.json') {
        const json = JSON.stringify(datos, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.mostrarNotificacion('Archivo descargado', 'success', 2000);
    },

    /**
     * Desplaza suavemente hacia un elemento
     * @param {HTMLElement|string} elemento - Elemento o ID
     * @param {number} offset - Offset en píxeles
     */
    scrollTo(elemento, offset = 0) {
        const el = typeof elemento === 'string' ? document.getElementById(elemento) : elemento;
        if (!el) return;

        const y = el.getBoundingClientRect().top + window.pageYOffset + offset;

        window.scrollTo({
            top: y,
            behavior: 'smooth'
        });
    },

    /**
     * Debounce para funciones (útil para búsquedas)
     * @param {function} func - Función a ejecutar
     * @param {number} delay - Delay en ms
     * @returns {function} Función con debounce
     */
    debounce(func, delay = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Throttle para funciones (útil para scroll/resize)
     * @param {function} func - Función a ejecutar
     * @param {number} limit - Límite en ms
     * @returns {function} Función con throttle
     */
    throttle(func, limit = 100) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Crea un skeleton loader para carga de datos
     * @param {number} lineas - Número de líneas
     * @returns {string} HTML del skeleton
     */
    crearSkeleton(lineas = 3) {
        let html = '<div class="animate-pulse space-y-3">';

        for (let i = 0; i < lineas; i++) {
            html += `
                <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-${Math.floor(Math.random() * 3) + 3}/4"></div>
            `;
        }

        html += '</div>';
        return html;
    },

    /**
     * Renderiza un estado vacío
     * @param {object} opciones - {icono, titulo, mensaje, accion}
     * @returns {string} HTML del estado vacío
     */
    crearEstadoVacio(opciones = {}) {
        const {
            icono = 'fa-inbox',
            titulo = 'No hay datos',
            mensaje = 'No se encontraron resultados',
            accion = null
        } = opciones;

        const accionHtml = accion
            ? `<button onclick="${accion.onclick}" class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                ${accion.texto}
               </button>`
            : '';

        return `
            <div class="text-center py-12">
                <i class="fas ${icono} text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">${titulo}</h3>
                <p class="text-gray-500 dark:text-gray-400">${mensaje}</p>
                ${accionHtml}
            </div>
        `;
    },

    /**
     * Formatea y muestra errores en consola de manera legible
     * @param {Error} error - Error a mostrar
     * @param {string} contexto - Contexto del error
     */
    logError(error, contexto = '') {
        console.group(`❌ Error${contexto ? ` en ${contexto}` : ''}`);
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        console.groupEnd();
    },

    /**
     * Crea paginación HTML
     * @param {object} opciones - {paginaActual, totalPaginas, onChange}
     * @returns {string} HTML de paginación
     */
    crearPaginacion(opciones = {}) {
        const {
            paginaActual = 1,
            totalPaginas = 1,
            onChange = 'cambiarPagina'
        } = opciones;

        if (totalPaginas <= 1) {
            return '';
        }

        let html = '<div class="flex justify-center gap-2 mt-6">';

        // Botón anterior
        html += `
            <button onclick="${onChange}(${paginaActual - 1})"
                    class="px-3 py-2 rounded-lg ${paginaActual === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}"
                    ${paginaActual === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Páginas
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || (i >= paginaActual - 2 && i <= paginaActual + 2)) {
                html += `
                    <button onclick="${onChange}(${i})"
                            class="px-4 py-2 rounded-lg ${i === paginaActual ? 'bg-primary-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}">
                        ${i}
                    </button>
                `;
            } else if (i === paginaActual - 3 || i === paginaActual + 3) {
                html += '<span class="px-2 py-2">...</span>';
            }
        }

        // Botón siguiente
        html += `
            <button onclick="${onChange}(${paginaActual + 1})"
                    class="px-3 py-2 rounded-lg ${paginaActual === totalPaginas ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}"
                    ${paginaActual === totalPaginas ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        html += '</div>';
        return html;
    }
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIHelpers;
}
