/**
 * auth.js — Handles Login and Register Views/Logic
 */
class Auth {
  constructor() {
    this.container = null;
  }

  init() {
    this.container = document.getElementById('page-login');
  }

  showLogin() {
    app.go('login');
    this.renderLogin();
  }

  showRegister() {
    app.go('login');
    this.renderRegister();
  }

  renderLogin() {
    this.container.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <div style="display:inline-flex;align-items:center;gap:12px;margin-bottom:16px;">
              <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 68,26 C 73,16 63,12 55,20" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <path d="M 55,20 L 60,22 M 55,20 L 58,15" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <path d="M 32,74 C 27,84 37,88 45,80" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <path d="M 45,80 L 40,78 M 45,80 L 42,85" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <path d="M 42,16 C 28.2,16 17,27.2 17,41 C 17,47.5 19.5,53.4 23.6,57.9 L 18,69 L 30.5,64.4 C 34,65.4 37.9,66 42,66 C 55.8,66 67,54.8 67,41 C 67,27.2 55.8,16 42,16 Z" fill="url(#logo-bubble-1)" />
                <path d="M 58,34 C 44.2,34 33,45.2 33,59 C 33,72.8 44.2,84 58,84 C 62.1,84 66,83.4 69.5,82.4 L 82,87 L 76.4,75.9 C 80.5,71.4 83,65.5 83,59 C 83,45.2 71.8,34 58,34 Z" fill="url(#logo-bubble-2)" />
                <text x="25" y="47" font-family="'Sora', sans-serif" font-weight="800" font-size="16" fill="white">Ai</text>
                <circle cx="52" cy="33" r="2.5" fill="white"/>
                <line x1="39" y1="41" x2="50" y2="35" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <line x1="48" y1="52" x2="68" y2="52" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="45" y1="59" x2="71" y2="59" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="52" y1="66" x2="64" y2="66" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
              <span style="font-family:'Sora',sans-serif;font-size:2.2rem;font-weight:800;background:linear-gradient(135deg,var(--indigo),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">CommAI</span>
            </div>
            <h2 class="auth-title">Welcome Back</h2>
            <p class="auth-subtitle">Sign in to assess and improve your skills</p>
          </div>
          <form id="login-form" onsubmit="auth.handleLogin(event)">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="login-email" class="form-input" placeholder="you@example.com" required autocomplete="email" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="login-password" class="form-input" placeholder="••••••••" required autocomplete="current-password" />
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px;" id="login-btn">
              Sign In
            </button>
          </form>
          <div class="auth-switch">
            Don't have an account? <span class="auth-link" onclick="auth.showRegister()">Sign Up</span>
          </div>
        </div>
      </div>
    `;
  }

  renderRegister() {
    this.container.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <div style="display:inline-flex;align-items:center;gap:12px;margin-bottom:16px;">
              <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 68,26 C 73,16 63,12 55,20" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <path d="M 55,20 L 60,22 M 55,20 L 58,15" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <path d="M 32,74 C 27,84 37,88 45,80" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <path d="M 45,80 L 40,78 M 45,80 L 42,85" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <path d="M 42,16 C 28.2,16 17,27.2 17,41 C 17,47.5 19.5,53.4 23.6,57.9 L 18,69 L 30.5,64.4 C 34,65.4 37.9,66 42,66 C 55.8,66 67,54.8 67,41 C 67,27.2 55.8,16 42,16 Z" fill="url(#logo-bubble-1)" />
                <path d="M 58,34 C 44.2,34 33,45.2 33,59 C 33,72.8 44.2,84 58,84 C 62.1,84 66,83.4 69.5,82.4 L 82,87 L 76.4,75.9 C 80.5,71.4 83,65.5 83,59 C 83,45.2 71.8,34 58,34 Z" fill="url(#logo-bubble-2)" />
                <text x="25" y="47" font-family="'Sora', sans-serif" font-weight="800" font-size="16" fill="white">Ai</text>
                <circle cx="52" cy="33" r="2.5" fill="white"/>
                <line x1="39" y1="41" x2="50" y2="35" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <line x1="48" y1="52" x2="68" y2="52" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="45" y1="59" x2="71" y2="59" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="52" y1="66" x2="64" y2="66" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
              <span style="font-family:'Sora',sans-serif;font-size:2.2rem;font-weight:800;background:linear-gradient(135deg,var(--indigo),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">CommAI</span>
            </div>
            <h2 class="auth-title">Create Account</h2>
            <p class="auth-subtitle">Start your communication assessment journey</p>
          </div>
          <form id="register-form" onsubmit="auth.handleRegister(event)">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="reg-name" class="form-input" placeholder="John Doe" required autocomplete="name" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="reg-email" class="form-input" placeholder="you@example.com" required autocomplete="email" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="reg-password" class="form-input" placeholder="••••••••" required autocomplete="new-password" minlength="6" />
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px;" id="register-btn">
              Create Account
            </button>
          </form>
          <div class="auth-switch">
            Already have an account? <span class="auth-link" onclick="auth.showLogin()">Sign In</span>
          </div>
        </div>
      </div>
    `;
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in...';

    try {
      const res = await window.api.login(email, pass);
      if (res.status === 'ok') {
        localStorage.setItem('commai_token', res.token);
        localStorage.setItem('commai_user', JSON.stringify(res.user));
        showToast('Successfully signed in!', 'success');
        app.init();
      } else {
        showToast(res.message || 'Login failed', 'error');
      }
    } catch (err) {
      showToast('Network error during login', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-password').value;
    const btn = document.getElementById('register-btn');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating account...';

    try {
      const res = await window.api.register(name, email, pass);
      if (res.status === 'ok') {
        localStorage.setItem('commai_token', res.token);
        localStorage.setItem('commai_user', JSON.stringify(res.user));
        showToast('Account created successfully!', 'success');
        app.init();
      } else {
        showToast(res.message || 'Registration failed', 'error');
      }
    } catch (err) {
      showToast('Network error during registration', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  }

  async logout() {
    try {
      await window.api.logout();
      showToast('Successfully logged out', 'info');
    } catch (err) {
      // Just clear local state anyway if network fails
      localStorage.removeItem('commai_token');
      localStorage.removeItem('commai_user');
    }
    this.showLogin();
  }
}

window.auth = new Auth();
document.addEventListener('DOMContentLoaded', () => window.auth.init());
