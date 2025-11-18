#!/usr/bin/env python3
"""Script para actualizar todas las páginas HTML con la nueva paleta de colores"""

import os
import re
from pathlib import Path

# Configuración de Tailwind para insertar
TAILWIND_CONFIG = '''    <link rel="stylesheet" href="../assets/styles.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#CF0A0A',
                        secondary: '#DC5F00',
                        dark: '#000000',
                        light: '#EEEEEE',
                    }
                }
            }
        }
    </script>'''

DARK_MODE_SCRIPT = '    <script src="../assets/js/dark-mode.js"></script>'

def update_html_file(file_path):
    """Actualiza un archivo HTML con la nueva configuración"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Verificar si ya tiene los estilos
    if '../assets/styles.css' in content or 'assets/styles.css' in content:
        print(f"  ⏭️  Ya actualizado: {file_path}")
        return False

    # Agregar CSS y configuración de Tailwind después de Font Awesome
    if 'font-awesome' in content and '<script>' not in re.search(r'font-awesome.*?\n', content).group():
        content = re.sub(
            r'(.*font-awesome.*?>\n)',
            r'\1' + TAILWIND_CONFIG + '\n',
            content,
            count=1
        )

    # Actualizar body para remover bg-gray-100 o backgrounds específicos
    content = re.sub(
        r'<body class="bg-gray-100 min-h-screen">',
        '<body class="min-h-screen">',
        content
    )
    content = re.sub(
        r'<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">',
        '<body class="min-h-screen">',
        content
    )

    # Agregar script de modo oscuro antes de </body>
    if '../assets/js/dark-mode.js' not in content:
        content = re.sub(
            r'(</body>)',
            DARK_MODE_SCRIPT + '\n\\1',
            content
        )

    # Guardar archivo actualizado
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    return True

def main():
    """Función principal"""
    base_dir = Path(__file__).parent

    # Directorios a procesar
    directories = [
        base_dir / 'user',
        base_dir / 'admin'
    ]

    updated_count = 0

    print("🎨 Actualizando páginas HTML con nueva paleta de colores...\n")

    for directory in directories:
        if not directory.exists():
            continue

        print(f"📁 Procesando directorio: {directory.name}/")

        # Obtener todos los archivos HTML
        html_files = list(directory.glob('*.html'))

        for html_file in html_files:
            # Saltar index.html ya que ya lo actualizamos
            if html_file.name == 'index.html':
                print(f"  ⏭️  Saltando (ya actualizado): {html_file.name}")
                continue

            if update_html_file(html_file):
                print(f"  ✅ Actualizado: {html_file.name}")
                updated_count += 1

    print(f"\n✨ Proceso completado. {updated_count} archivos actualizados.")

if __name__ == '__main__':
    main()
