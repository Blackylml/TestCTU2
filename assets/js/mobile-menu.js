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
    console.log('MobileMenuManager: setup called');
    this.createHamburgerButton();
    this.createOverlay();
    this.setupSidebar();
    this.attachEventListeners();
    console.log('MobileMenuManager: setup complete');
    console.log('Hamburger button:', this.hamburgerBtn);
    console.log('Overlay:', this.overlay);
    console.log('Sidebar:', this.sidebar);
  }

  createHamburgerButton() {
    // Buscar el botón hamburguesa inline en el navbar
    const button = document.querySelector('.hamburger-btn-inline');
    if (button) {
      this.hamburgerBtn = button;
      console.log('Hamburger button found:', button);
    } else {
      console.warn('Hamburger button not found!');
    }
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
    console.log('toggleMenu called');
    console.log('Sidebar:', this.sidebar);
    const isOpen = this.sidebar?.classList.contains('active');
    console.log('Is open:', isOpen);
    if (isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    console.log('openMenu called');
    if (this.sidebar) {
      console.log('Adding active class to sidebar');
      this.sidebar.classList.add('active');
      this.overlay?.classList.add('active');
      this.hamburgerBtn?.classList.add('active');
      document.body.classList.add('sidebar-open');
      console.log('Sidebar classes:', this.sidebar.className);
      console.log('Sidebar computed left:', window.getComputedStyle(this.sidebar).left);
    }
  }

  closeMenu() {
    console.log('closeMenu called');
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
