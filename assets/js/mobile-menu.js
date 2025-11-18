// Sistema de menú móvil (hamburguesa)
class MobileMenuManager {
  constructor() {
    this.init();
  }

  init() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.createHamburgerButton();
    this.createOverlay();
    this.setupSidebar();
    this.attachEventListeners();
  }

  createHamburgerButton() {
    // Solo crear en móviles (viewport < 768px)
    const button = document.createElement('button');
    button.className = 'hamburger-btn md:hidden';
    button.setAttribute('aria-label', 'Toggle menu');
    button.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;

    document.body.appendChild(button);
    this.hamburgerBtn = button;
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    this.overlay = overlay;
  }

  setupSidebar() {
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      // Agregar clase para móviles
      sidebar.classList.add('md:w-64');
      sidebar.classList.add('mobile-sidebar');
      this.sidebar = sidebar;
    }
  }

  attachEventListeners() {
    // Click en el botón hamburguesa
    if (this.hamburgerBtn) {
      this.hamburgerBtn.addEventListener('click', () => this.toggleMenu());
    }

    // Click en el overlay para cerrar
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.closeMenu());
    }

    // Cerrar menú al hacer clic en enlaces de navegación (solo en móvil)
    if (this.sidebar) {
      const navLinks = this.sidebar.querySelectorAll('a');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth < 768) {
            this.closeMenu();
          }
        });
      });
    }

    // Cerrar menú al cambiar tamaño de ventana a desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    const isOpen = this.sidebar?.classList.contains('active');
    if (isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    if (this.sidebar) {
      this.sidebar.classList.add('active');
      this.overlay?.classList.add('active');
      this.hamburgerBtn?.classList.add('active');
      document.body.classList.add('sidebar-open');
    }
  }

  closeMenu() {
    if (this.sidebar) {
      this.sidebar.classList.remove('active');
      this.overlay?.classList.remove('active');
      this.hamburgerBtn?.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    }
  }

  isMenuOpen() {
    return this.sidebar?.classList.contains('active') || false;
  }
}

// Inicializar el menú móvil
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mobileMenuManager = new MobileMenuManager();
  });
} else {
  window.mobileMenuManager = new MobileMenuManager();
}
