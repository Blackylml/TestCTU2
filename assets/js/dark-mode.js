// Sistema de modo oscuro
class DarkModeManager {
  constructor() {
    this.darkModeKey = 'quinielaPro_darkMode';
    this.init();
  }

  init() {
    // Sincronizar con la clase aplicada por el script inline
    const savedMode = localStorage.getItem(this.darkModeKey);
    const isDarkFromInline = document.documentElement.classList.contains('dark-mode');

    // Si el script inline ya aplicó dark-mode, sincronizar con body
    if (isDarkFromInline && !document.body.classList.contains('dark-mode')) {
      document.body.classList.add('dark-mode');
    }

    // Si no hay clase aplicada, verificar preferencias
    if (!isDarkFromInline) {
      if (savedMode === 'dark') {
        this.enableDarkMode();
      } else if (savedMode === 'light') {
        this.disableDarkMode();
      } else {
        // Detectar preferencia del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          this.enableDarkMode();
        }
      }
    }

    // Crear botón toggle
    this.createToggleButton();

    // Escuchar cambios en la preferencia del sistema
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem(this.darkModeKey)) {
          e.matches ? this.enableDarkMode() : this.disableDarkMode();
        }
      });
    }
  }

  createToggleButton() {
    const button = document.createElement('button');
    button.className = 'dark-mode-toggle';
    button.setAttribute('aria-label', 'Toggle dark mode');
    button.innerHTML = '<i class="fas fa-moon"></i>';

    button.addEventListener('click', () => this.toggle());

    document.body.appendChild(button);
    this.updateToggleButton();
  }

  toggle() {
    if (document.body.classList.contains('dark-mode')) {
      this.disableDarkMode();
    } else {
      this.enableDarkMode();
    }
  }

  enableDarkMode() {
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
    localStorage.setItem(this.darkModeKey, 'dark');
    this.updateToggleButton();
    this.dispatchChangeEvent();
  }

  disableDarkMode() {
    document.documentElement.classList.remove('dark-mode');
    document.body.classList.remove('dark-mode');
    localStorage.setItem(this.darkModeKey, 'light');
    this.updateToggleButton();
    this.dispatchChangeEvent();
  }

  updateToggleButton() {
    const button = document.querySelector('.dark-mode-toggle');
    if (!button) return;

    const icon = button.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
      icon.className = 'fas fa-sun';
    } else {
      icon.className = 'fas fa-moon';
    }
  }

  dispatchChangeEvent() {
    const event = new CustomEvent('darkModeChange', {
      detail: { isDark: document.body.classList.contains('dark-mode') }
    });
    window.dispatchEvent(event);
  }

  isDarkMode() {
    return document.body.classList.contains('dark-mode');
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.darkModeManager = new DarkModeManager();
  });
} else {
  window.darkModeManager = new DarkModeManager();
}
