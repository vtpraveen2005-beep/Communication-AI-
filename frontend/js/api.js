/**
 * api.js — Frontend API client
 * All fetch calls to the Java backend REST endpoints
 */
class API {
  constructor() {
    this.base = window.location.origin;
  }

  headers() {
    const h = { 'Content-Type': 'application/json' };
    const tok = localStorage.getItem('commai_token');
    if (tok) h['Authorization'] = `Bearer ${tok}`;
    return h;
  }

  async login(email, password) {
    const res = await fetch(`${this.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  }

  async register(username, email, password) {
    const res = await fetch(`${this.base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    return await res.json();
  }

  async logout() {
    const res = await fetch(`${this.base}/api/auth/logout`, {
      method: 'POST',
      headers: this.headers()
    });
    localStorage.removeItem('commai_token');
    localStorage.removeItem('commai_user');
    return await res.json();
  }

  async me() {
    const res = await fetch(`${this.base}/api/auth/me`, {
      method: 'GET',
      headers: this.headers()
    });
    return await res.json();
  }

  async generateQuestion(type, level) {
    const res = await fetch(`${this.base}/api/generate-question`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ type, level })
    });
    const data = await res.json();
    return data.status === 'ok' ? data.data : null;
  }

  async getQuestions(type, level) {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (level) params.set('level', level);
    const res = await fetch(`${this.base}/api/questions?${params}`, {
      headers: this.headers()
    });
    const data = await res.json();
    return data.status === 'ok' ? data.data : null;
  }

  async getRubrics() {
    const res = await fetch(`${this.base}/api/rubrics`, {
      headers: this.headers()
    });
    const data = await res.json();
    return data.status === 'ok' ? data.data : null;
  }

  async score(type, text, criteria, keywords) {
    const res = await fetch(`${this.base}/api/score`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ type, text, criteria, keywords })
    });
    const data = await res.json();
    return data.status === 'ok' ? data.data : null;
  }

  async scoreListening(correct, total) {
    const res = await fetch(`${this.base}/api/score`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ type: 'listening', correct, total })
    });
    const data = await res.json();
    return data.status === 'ok' ? data.data : null;
  }

  async getFeedback(type, prompt, response, scores) {
    const res = await fetch(`${this.base}/api/feedback`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ type, prompt, response, scores: JSON.stringify(scores) })
    });
    const data = await res.json();
    return data.status === 'ok' ? data.data : null;
  }

  async getReport(type, level, overall) {
    const res = await fetch(`${this.base}/api/report`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ type, level, overall })
    });
    const data = await res.json();
    return data.status === 'ok' ? data.data : null;
  }

  async health() {
    const res = await fetch(`${this.base}/api/health`, {
      headers: this.headers()
    });
    return await res.json();
  }
}

window.api = new API();
