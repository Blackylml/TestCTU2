#!/bin/bash

# Script para actualizar las clases comunes en todas las páginas de usuario

# Definir las páginas a actualizar
USER_PAGES=(
    "/home/user/TestCTU2/user/mis-quinielas.html"
    "/home/user/TestCTU2/user/resultados.html"
    "/home/user/TestCTU2/user/historial.html"
)

# Función para agregar el script de tema al head
add_theme_script() {
    local file=$1

    # Verificar si ya tiene el script
    if grep -q "localStorage.getItem('theme')" "$file"; then
        echo "✓ $file ya tiene el script de tema"
        return
    fi

    # Insertar el script después del título
    sed -i '/<title>/a\    <!-- Script para evitar el flash blanco - se carga ANTES que todo -->\
    <script>\
        (function() {\
            const theme = localStorage.getItem('\''theme'\'') || '\''light'\'';\
            if (theme === '\''dark'\'') {\
                document.documentElement.classList.add('\''dark'\'');\
            }\
        })();\
    </script>' "$file"

    echo "✓ Script de tema agregado a $file"
}

# Aplicar a cada página
for page in "${USER_PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "Procesando: $page"
        add_theme_script "$page"
    fi
done

echo "¡Listo!"
