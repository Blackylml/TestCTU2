/**
 * Authentication Module - QuinielaPro Frontend
 * Maneja autenticación, Google OAuth y sesión de usuario
 */

class AuthManager {
  constructor(apiClient) {
    this.api = apiClient;
    this.currentUser = null;
    this.googleClientId = '548408750723-r8d4cb8i5vq5abgfl31f5b88k4ecuu8e.apps.googleusercontent.com';
    this.googleInitialized = false;
  }

  /**
   * Inicializar Google Sign-In
   */
  async initGoogleSignIn() {
    if (this.googleInitialized) return;

    return new Promise((resolve, reject) => {
      // Cargar script de Google
      if (!document.getElementById('google-signin-script')) {
        const script = document.createElement('script');
        script.id = 'google-signin-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          this.setupGoogleButton();
          this.googleInitialized = true;
          resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        this.setupGoogleButton();
        this.googleInitialized = true;
        resolve();
      }
    });
  }

  /**
   * Configurar botón de Google
   */
  setupGoogleButton() {
    if (!window.google) {
      console.error('Google API no cargada');
      return;
    }

    // Configurar callback global
    window.handleGoogleCallback = this.handleGoogleResponse.bind(this);

    // Inicializar Google Identity Services
    google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: window.handleGoogleCallback,
      auto_select: false,
    });
  }

  /**
   * Renderizar botón de Google
   */
  renderGoogleButton(elementId, options = {}) {
    if (!window.google) {
      console.error('Google API no cargada');
      return;
    }

    const defaultOptions = {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: '100%',
      ...options,
    };

    google.accounts.id.renderButton(
      document.getElementById(elementId),
      defaultOptions
    );
  }

  /**
   * Manejar respuesta de Google
   */
  async handleGoogleResponse(response) {
    try {
      // Mostrar loading
      this.showLoading('Iniciando sesión con Google...');

      // Enviar token a nuestro backend
      const result = await this.api.loginWithGoogle(response.credential);

      if (result.success) {
        this.currentUser = result.data.user;
        this.saveUserData(result.data.user);
        this.onLoginSuccess(result.data.user);
      } else {
        this.onLoginError(result.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error en Google Sign-In:', error);
      this.onLoginError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Login tradicional (email/password)
   */
  async login(email, password) {
    try {
      this.showLoading('Iniciando sesión...');

      const result = await this.api.login(email, password);

      if (result.success) {
        this.currentUser = result.data.user;
        this.saveUserData(result.data.user);
        this.onLoginSuccess(result.data.user);
        return result;
      } else {
        this.onLoginError(result.message || 'Error al iniciar sesión');
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error en login:', error);
      this.onLoginError(error.message);
      throw error;
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async register(userData) {
    try {
      this.showLoading('Registrando usuario...');

      const result = await this.api.register(userData);

      if (result.success) {
        this.currentUser = result.data.user;
        this.saveUserData(result.data.user);
        this.onLoginSuccess(result.data.user);
        return result;
      } else {
        this.onLoginError(result.message || 'Error al registrar');
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error en registro:', error);
      this.onLoginError(error.message);
      throw error;
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Cerrar sesión
   */
  logout() {
    this.api.logout();
    this.currentUser = null;
    this.clearUserData();

    // Revocar Google Sign-In si está activo
    if (window.google && this.googleInitialized) {
      google.accounts.id.disableAutoSelect();
    }

    // Redirigir a página principal
    window.location.href = '/index.html';
  }

  /**
   * Verificar si hay sesión activa
   */
  async checkSession() {
    if (!this.api.isAuthenticated()) {
      return false;
    }

    try {
      const result = await this.api.getProfile();

      if (result.success) {
        this.currentUser = result.data;
        this.saveUserData(result.data);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verificando sesión:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Intentar recuperar de localStorage
    const userData = localStorage.getItem('quinielaPro_user');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      } catch (error) {
        console.error('Error parseando usuario:', error);
      }
    }

    return null;
  }

  /**
   * Verificar si el usuario es admin
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated() {
    return this.api.isAuthenticated() && this.getCurrentUser() !== null;
  }

  /**
   * Guardar datos del usuario en localStorage
   */
  saveUserData(user) {
    localStorage.setItem('quinielaPro_user', JSON.stringify(user));
  }

  /**
   * Limpiar datos del usuario
   */
  clearUserData() {
    localStorage.removeItem('quinielaPro_user');
  }

  /**
   * Callback cuando login es exitoso
   */
  onLoginSuccess(user) {
    console.log('Login exitoso:', user);

    // Redirigir según rol
    if (user.role === 'admin') {
      window.location.href = '/admin/index.html';
    } else {
      window.location.href = '/user/index.html';
    }
  }

  /**
   * Callback cuando hay error en login
   */
  onLoginError(message) {
    console.error('Error en login:', message);

    // Mostrar mensaje de error
    this.showError(message);
  }

  /**
   * Mostrar loading
   */
  showLoading(message = 'Cargando...') {
    // Buscar elemento de loading o crear uno
    let loadingEl = document.getElementById('auth-loading');

    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.id = 'auth-loading';
      loadingEl.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      loadingEl.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
          <div class="flex items-center space-x-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span class="text-lg">${message}</span>
          </div>
        </div>
      `;
      document.body.appendChild(loadingEl);
    } else {
      loadingEl.querySelector('span').textContent = message;
      loadingEl.classList.remove('hidden');
    }
  }

  /**
   * Ocultar loading
   */
  hideLoading() {
    const loadingEl = document.getElementById('auth-loading');
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
  }

  /**
   * Mostrar mensaje de error
   */
  showError(message) {
    // Buscar elemento de error o crear uno
    let errorEl = document.getElementById('auth-error');

    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id = 'auth-error';
      errorEl.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl z-50 max-w-md';
      document.body.appendChild(errorEl);
    }

    errorEl.textContent = message;
    errorEl.classList.remove('hidden');

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      errorEl.classList.add('hidden');
    }, 5000);
  }

  /**
   * Proteger página (solo usuarios autenticados)
   */
  async requireAuth(redirectTo = '/index.html') {
    const isAuth = await this.checkSession();

    if (!isAuth) {
      window.location.href = redirectTo;
      return false;
    }

    return true;
  }

  /**
   * Proteger página de admin (solo administradores)
   */
  async requireAdmin(redirectTo = '/index.html') {
    const isAuth = await this.checkSession();

    if (!isAuth || !this.isAdmin()) {
      window.location.href = redirectTo;
      return false;
    }

    return true;
  }

  /**
   * Crear formulario de login
   */
  createLoginForm(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Contenedor ${containerId} no encontrado`);
      return;
    }

    const showRegister = options.showRegister !== false;
    const showGoogle = options.showGoogle !== false;

    container.innerHTML = `
      <div class="max-w-md mx-auto card p-8 rounded-xl shadow-xl">
        <h2 class="text-3xl font-bold mb-6 text-center">Iniciar Sesión</h2>

        ${showGoogle ? `
          <div id="google-signin-button" class="mb-6"></div>
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800">O continúa con email</span>
            </div>
          </div>
        ` : ''}

        <form id="login-form" class="space-y-4">
          <div>
            <label for="email" class="block mb-2 font-semibold">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              class="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label for="password" class="block mb-2 font-semibold">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              class="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            class="w-full btn-primary text-white py-3 rounded-lg font-semibold"
          >
            Iniciar Sesión
          </button>
        </form>

        ${showRegister ? `
          <p class="mt-6 text-center">
            ¿No tienes cuenta?
            <a href="#" id="register-link" class="text-primary font-semibold hover:underline">
              Regístrate aquí
            </a>
          </p>
        ` : ''}
      </div>
    `;

    // Configurar eventos
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        await this.login(email, password);
      } catch (error) {
        // Error ya manejado en login()
      }
    });

    // Inicializar Google Sign-In si está habilitado
    if (showGoogle) {
      this.initGoogleSignIn().then(() => {
        this.renderGoogleButton('google-signin-button');
      });
    }
  }
}

// Crear instancia global
const authManager = new AuthManager(api);

// Exportar para usar en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthManager, authManager };
}
