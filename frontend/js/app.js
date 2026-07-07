/**
 * app.js — CommAI Application Controller
 * Professional dashboard with sidebar layout.
 */
class App {
  constructor() {
    this.page         = 'dashboard';
    this.currentType  = null;
    this.currentLevel = 1;
    this.allScores    = [];
    this.allResponses = [];
    this.questions    = null;
    this.rubrics      = null;
    this.sessionQs    = [];
    this.qIndex       = 0;
    this.sessionStart = null;
    this.geminiOn     = false;
  }

  async init() {
    const token = localStorage.getItem('commai_token');
    if (!token) {
      window.auth.showLogin();
      return;
    }
    try {
      // Validate session with server
      const meRes = await window.api.me();
      if (meRes.status !== 'ok') {
        localStorage.removeItem('commai_token');
        localStorage.removeItem('commai_user');
        window.auth.showLogin();
        return;
      }
      localStorage.setItem('commai_user', JSON.stringify(meRes.user));

      const [qRes, rRes, health] = await Promise.all([
        window.api.getQuestions(),
        window.api.getRubrics(),
        window.api.health()
      ]);
      this.questions = typeof qRes === 'string' ? JSON.parse(qRes) : qRes;
      this.rubrics   = typeof rRes === 'string' ? JSON.parse(rRes) : rRes;
      this.geminiOn  = health?.geminiConfigured === true;
    } catch (e) {
      showToast('Cannot reach server. Is run.bat running?', 'error');
    }
    this.renderDashboard();
  }

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION
  ═══════════════════════════════════════════════════════════ */
  go(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId)?.classList.add('active');
    this.page = pageId;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* ═══════════════════════════════════════════════════════════
     SIDEBAR
  ═══════════════════════════════════════════════════════════ */
  sidebar(active) {
    const hist = this._history();
    const inAssessment = (active === '');
    const navDash = inAssessment ? `app.confirmExit()` : `app.renderDashboard()`;
    const navHist = inAssessment ? `app.confirmExit()` : `app.renderHistory()`;

    const userStr = localStorage.getItem('commai_user');
    let username = 'User';
    if (userStr) {
      try {
        username = JSON.parse(userStr).username || 'User';
      } catch (e) {}
    }

    return `
    <aside class="sidebar">
      <div class="sidebar-logo" style="display:flex;align-items:center;gap:10px;padding:4px 0;margin-bottom:28px;">
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
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
        <span class="logo-text" style="font-size:1.25rem;">CommAI</span>
      </div>

      <div class="sidebar-section-label">Platform</div>
      <div class="sidebar-item ${active==='dashboard'?'active':''}" onclick="${navDash}">
        <span class="s-icon">⊞</span> Dashboard
      </div>
      <div class="sidebar-item ${active==='history'?'active':''}" onclick="${navHist}">
        <span class="s-icon">↻</span> History
        ${hist.length ? `<span class="s-badge">${hist.length}</span>` : ''}
      </div>

      <div class="sidebar-section-label">Assessments</div>
      ${[
        {id:'oral',         icon:'◎', label:'Verbal'},
        {id:'written',      icon:'≡', label:'Written'},
        {id:'listening',    icon:'◑', label:'Listening'},
        {id:'presentation', icon:'▦', label:'Presentation'}
      ].map(t => `
        <div class="sidebar-item" onclick="${inAssessment ? 'app.confirmExit()' : `app.openAssessment('${t.id}')`}">
          <span class="s-icon">${t.icon}</span> ${t.label}
        </div>`).join('')}

      <div style="margin-top: auto; padding: 12px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.8rem; color: var(--text-2); font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 110px;">${username}</span>
          <span onclick="window.auth.logout()" style="font-size: 0.72rem; color: var(--rose-l); cursor: pointer; font-weight: 600; text-decoration: underline;">Logout</span>
        </div>
        <div class="ai-status-pill">
          <div class="ai-dot"></div>
          ${this.geminiOn ? 'Groq AI · Llama 3.3' : 'Built-in Engine'}
        </div>
      </div>
    </aside>`;
  }

  /* ═══════════════════════════════════════════════════════════
     DASHBOARD
  ═══════════════════════════════════════════════════════════ */
  renderDashboard() {
    const hist  = this._history();
    const last  = hist.length ? hist[0].overall : null;
    const best  = hist.length ? Math.max(...hist.map(h => h.overall)) : null;
    const types = { oral:'Verbal Communication', written:'Written Communication', listening:'Active Listening', presentation:'Presentation Skills' };

    const assessments = [
      { id:'oral',         icon:'◎', iconBg:'rgba(99,102,241,0.12)',  iconCol:'#818CF8', title:'Verbal Communication',  desc:'Speak naturally and receive instant analysis on clarity, fluency, vocabulary, confidence, and delivery.', tags:[{text:'SPEECH API',bg:'rgba(99,102,241,0.1)',col:'#818CF8'},{text:'3 LEVELS',bg:'rgba(255,255,255,0.05)',col:'var(--text-3)'}] },
      { id:'written',      icon:'≡', iconBg:'rgba(6,182,212,0.12)',   iconCol:'#22D3EE', title:'Written Communication', desc:'Timed writing exercises — professional emails, essays, proposals — scored on grammar, tone, structure, and coherence.', tags:[{text:'TIMED',bg:'rgba(6,182,212,0.1)',col:'#22D3EE'},{text:'3 LEVELS',bg:'rgba(255,255,255,0.05)',col:'var(--text-3)'}] },
      { id:'listening',    icon:'◑', iconBg:'rgba(16,185,129,0.12)',  iconCol:'#34D399', title:'Active Listening',      desc:'Read real-world workplace scenarios then answer comprehension questions. Evaluates retention, accuracy, and critical listening.', tags:[{text:'COMPREHENSION',bg:'rgba(16,185,129,0.1)',col:'#34D399'},{text:'5 QUESTIONS',bg:'rgba(255,255,255,0.05)',col:'var(--text-3)'}] },
      { id:'presentation', icon:'▦', iconBg:'rgba(245,158,11,0.12)', iconCol:'#FCD34D', title:'Presentation Skills',   desc:'Build multi-slide presentations — product pitches, project proposals, crisis communications — evaluated on structure and persuasion.', tags:[{text:'MULTI-SLIDE',bg:'rgba(245,158,11,0.1)',col:'#FCD34D'},{text:'3 LEVELS',bg:'rgba(255,255,255,0.05)',col:'var(--text-3)'}] }
    ];

    document.getElementById('page-dashboard').innerHTML = `
    <div class="layout">
      ${this.sidebar('dashboard')}
      <main class="main-content">
        <div class="page-header">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Track your communication skills across all dimensions</p>
        </div>

        <!-- Stats strip -->
        <div class="stats-strip">
          <div class="stat-card">
            <div class="stat-label">Assessments Taken</div>
            <div class="stat-value" style="color:var(--indigo-l);">${hist.length}</div>
            <div class="stat-sub">${hist.length ? 'Keep it up!' : 'None yet'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Last Score</div>
            <div class="stat-value" style="color:${last!==null?(last>=80?'var(--emerald-l)':last>=60?'var(--cyan-l)':last>=40?'var(--amber-l)':'var(--rose-l)'):'var(--text-3)'};">${last!==null?last+'%':'—'}</div>
            <div class="stat-sub">${last!==null?types[hist[0].type]||'':'No data'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Best Score</div>
            <div class="stat-value" style="color:${best!==null?'var(--emerald-l)':'var(--text-3)'};">${best!==null?best+'%':'—'}</div>
            <div class="stat-sub">${best!==null?'Personal best':''}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">AI Engine</div>
            <div class="stat-value" style="color:var(--emerald-l);font-size:1rem;">${this.geminiOn?'Groq Active':'Built-in'}</div>
            <div class="stat-sub">${this.geminiOn?'Llama 3.3 70B':'Heuristic scoring'}</div>
          </div>
        </div>

        <!-- Assessment modules -->
        <div class="section-header">
          <span class="section-title">Assessment Modules</span>
        </div>
        <div class="assessment-grid">
          ${assessments.map(a => `
          <div class="acard" onclick="app.openAssessment('${a.id}')">
            <div class="acard-arrow">→</div>
            <div class="acard-icon" style="background:${a.iconBg};color:${a.iconCol};">${a.icon}</div>
            <div class="acard-title">${a.title}</div>
            <div class="acard-desc">${a.desc}</div>
            <div class="acard-tags">
              ${a.tags.map(t => `<span class="tag" style="background:${t.bg};color:${t.col};">${t.text}</span>`).join('')}
            </div>
            <div class="acard-divider"></div>
            <div style="font-size:0.7rem;color:var(--text-3);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Select Level</div>
            <div class="acard-levels">
              ${['Beginner','Intermediate','Advanced'].map((l,i) => `
              <button class="level-btn" onclick="event.stopPropagation();app.startAssessment('${a.id}',${i+1})">${l}</button>`).join('')}
            </div>
          </div>`).join('')}
        </div>

        <!-- Recent + Tips -->
        <div class="two-col">
          <div class="card">
            <div class="section-header" style="margin-bottom:4px;">
              <span class="section-title">Recent Activity</span>
              ${hist.length > 3 ? `<button class="section-action" onclick="app.renderHistory()">View all</button>` : ''}
            </div>
            ${hist.length === 0 ? `
            <div class="empty-state">
              <div class="es-icon">◎</div>
              <p>No assessments yet. Pick a module above to begin.</p>
            </div>` : hist.slice(0,5).map(h => {
              const col = h.overall>=80?'var(--emerald)':h.overall>=60?'var(--cyan)':h.overall>=40?'var(--amber)':'var(--rose)';
              const icons={oral:'◎',written:'≡',listening:'◑',presentation:'▦'};
              const iconBgs={oral:'rgba(99,102,241,0.1)',written:'rgba(6,182,212,0.1)',listening:'rgba(16,185,129,0.1)',presentation:'rgba(245,158,11,0.1)'};
              const iconCols={oral:'#818CF8',written:'#22D3EE',listening:'#34D399',presentation:'#FCD34D'};
              return `
              <div class="history-item">
                <div class="history-icon" style="background:${iconBgs[h.type]||'rgba(255,255,255,0.05)'};color:${iconCols[h.type]||'var(--text-2)'};">${icons[h.type]||'◎'}</div>
                <div class="history-info">
                  <div class="history-name">${types[h.type]||h.type}</div>
                  <div class="history-meta">Level ${h.level} · ${new Date(h.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                </div>
                <div class="score-chip" style="background:${col}18;color:${col};">${h.overall}%</div>
              </div>`;
            }).join('')}
          </div>

          <div>
            <div class="tip-card">
              <div class="tip-label">Pro Tip</div>
              <div class="tip-text">Start with <strong style="color:var(--text-1);">Written Communication</strong> — it builds foundational structure skills that carry across all other assessment types.</div>
            </div>
            <div class="card">
              <div class="section-title" style="margin-bottom:16px;">Skill Areas</div>
              ${[
                { label:'Verbal Fluency',   val:this._avgByType('oral'),         col:'var(--indigo-l)' },
                { label:'Written Clarity',  val:this._avgByType('written'),      col:'var(--cyan-l)' },
                { label:'Active Listening', val:this._avgByType('listening'),    col:'var(--emerald-l)' },
                { label:'Presentation',     val:this._avgByType('presentation'), col:'var(--amber-l)' }
              ].map(s => `
              <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                  <span style="font-size:0.78rem;color:var(--text-2);">${s.label}</span>
                  <span style="font-size:0.78rem;font-weight:600;color:${s.col};">${s.val !== null ? s.val+'%' : 'N/A'}</span>
                </div>
                <div style="height:3px;background:var(--border);border-radius:2px;overflow:hidden;">
                  <div style="height:100%;width:${s.val||0}%;background:${s.col};border-radius:2px;transition:width 1s ease;"></div>
                </div>
              </div>`).join('')}
            </div>
          </div>
        </div>
      </main>
    </div>`;
    this.go('dashboard');
  }

  /* ═══════════════════════════════════════════════════════════
     OPEN ASSESSMENT MODAL
  ═══════════════════════════════════════════════════════════ */
  openAssessment(type) {
    const meta = {
      oral:         { title:'Verbal Communication',  icon:'◎', color:'#6366F1' },
      written:      { title:'Written Communication', icon:'≡', color:'#06B6D4' },
      listening:    { title:'Active Listening',      icon:'◑', color:'#10B981' },
      presentation: { title:'Presentation Skills',   icon:'▦', color:'#F59E0B' }
    };
    const m = meta[type];
    document.getElementById('modal-content').innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="width:40px;height:40px;border-radius:10px;background:${m.color}18;display:flex;align-items:center;justify-content:center;font-size:18px;color:${m.color};">${m.icon}</div>
        <div>
          <div style="font-size:1rem;font-weight:700;color:var(--text-1);">${m.title}</div>
          <div style="font-size:0.75rem;color:var(--text-3);">Select difficulty level</div>
        </div>
      </div>
      ${[
        { level:1, label:'Beginner',     desc:'Straightforward prompts, foundational vocabulary, guided structure.' },
        { level:2, label:'Intermediate', desc:'Multi-part scenarios requiring structured arguments and clear reasoning.' },
        { level:3, label:'Advanced',     desc:'Complex, time-pressured tasks — impromptu speeches, analytical writing, crisis comms.' }
      ].map(l => `
      <div onclick="app.closeModal();app.startAssessment('${type}',${l.level})"
           style="padding:14px 16px;border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;margin-bottom:8px;transition:all 0.15s;display:flex;align-items:center;gap:14px;"
           onmouseover="this.style.borderColor='${m.color}55';this.style.background='${m.color}08'"
           onmouseout="this.style.borderColor='var(--border)';this.style.background='transparent'">
        <div style="font-size:1.5rem;font-weight:700;color:${m.color};font-family:Sora,sans-serif;min-width:28px;">${l.level}</div>
        <div>
          <div style="font-size:0.88rem;font-weight:600;color:var(--text-1);">${l.label}</div>
          <div style="font-size:0.72rem;color:var(--text-3);">${l.desc}</div>
        </div>
      </div>`).join('')}`;
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  /* ═══════════════════════════════════════════════════════════
     START ASSESSMENT
  ═══════════════════════════════════════════════════════════ */
  async startAssessment(type, level) {
    this.currentType  = type;
    this.currentLevel = level;
    this.allScores    = [];
    this.allResponses = [];
    this.qIndex       = 0;
    this.sessionStart = Date.now();

    // Show loading spinner
    document.getElementById('page-assessment').innerHTML = `
      <div class="layout">
        ${this.sidebar('')}
        <main class="main-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 80vh; gap: 16px;">
          <div class="spinner" style="width: 36px; height: 36px; border-width: 3px;"></div>
          <p style="color: var(--text-2); font-weight: 500;">AI is generating a unique question for you...</p>
        </main>
      </div>
    `;
    this.go('assessment');

    try {
      const q = await window.api.generateQuestion(type, level);
      if (q) {
        // Wrap the generated question object
        const qObj = typeof q === 'string' ? JSON.parse(q) : q;
        this.sessionQs = [qObj];
      } else {
        // fallback
        const pool = this.questions?.[type] || [];
        this.sessionQs = pool.filter(x => (x.level||1) <= level).slice(0, 1);
        if (!this.sessionQs.length && pool.length) this.sessionQs = [pool[0]];
      }
    } catch (e) {
      showToast('Error generating dynamic question. Using fallback.', 'warn');
      const pool = this.questions?.[type] || [];
      this.sessionQs = pool.filter(x => (x.level||1) <= level).slice(0, 1);
      if (!this.sessionQs.length && pool.length) this.sessionQs = [pool[0]];
    }

    this._buildAssessmentShell();
    this._loadQuestion();
  }

  _buildAssessmentShell() {
    const labels = { oral:'Verbal Communication', written:'Written Communication', listening:'Active Listening', presentation:'Presentation Skills' };
    document.getElementById('page-assessment').innerHTML = `
    <div class="layout">
      ${this.sidebar('')}
      <main class="main-content">
        <div class="q-shell">
          <div class="q-header">
            <div class="q-breadcrumb">
              <span onclick="app.confirmExit()" style="cursor:pointer;color:var(--text-3);">Dashboard</span>
              <span style="color:var(--text-3);">›</span>
              <span>${labels[this.currentType]}</span>
              <span style="color:var(--text-3);">›</span>
              <span>Level ${this.currentLevel}</span>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <span class="q-step-counter" id="q-step-label">Question 1 / ${this.sessionQs.length}</span>
              <button class="btn btn-ghost btn-sm" onclick="app.confirmExit()">Exit</button>
            </div>
          </div>
          <div class="progress-track"><div class="progress-thumb" id="q-prog-bar" style="width:0%;"></div></div>
          <div id="question-area"></div>
          <div class="hidden" id="feedback-panel"></div>
        </div>
      </main>
    </div>`;
  }

  _loadQuestion() {
    if (this.qIndex >= this.sessionQs.length) { this.finishAssessment(); return; }
    const q     = this.sessionQs[this.qIndex];
    const total = this.sessionQs.length;
    const pct   = Math.round((this.qIndex / total) * 100);

    document.getElementById('q-step-label').textContent = `Question ${this.qIndex + 1} / ${total}`;
    document.getElementById('q-prog-bar').style.width   = pct + '%';
    document.getElementById('feedback-panel').classList.add('hidden');
    document.getElementById('feedback-panel').innerHTML  = '';

    const area = document.getElementById('question-area');
    const cb   = r => this._onSubmit(r);
    const handlers = {
      oral:         () => { area.innerHTML = window.oralAssessment.render(q, cb); },
      written:      () => { area.innerHTML = window.writtenAssessment.render(q, cb); },
      listening:    () => { area.innerHTML = window.listeningAssessment.render(q, cb); },
      presentation: () => { area.innerHTML = window.presentationAssessment.render(q, cb); }
    };
    if (handlers[this.currentType]) handlers[this.currentType]();
  }

  /* ═══════════════════════════════════════════════════════════
     ON SUBMIT — show inline feedback
  ═══════════════════════════════════════════════════════════ */
  _onSubmit(result) {
    const { scores = {}, feedback = '', aiPowered } = result;
    const vals    = Object.values(scores).map(v => parseFloat(v)||0);
    const avg     = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
    const overall = Math.round(avg * 20);
    const col     = overall>=80?'#10B981':overall>=60?'#6366F1':overall>=40?'#F59E0B':'#F43F5E';

    this.allScores.push(scores);
    this.allResponses.push(result.response || result.responses || '');

    const isLast  = (this.qIndex + 1) >= this.sessionQs.length;
    const rubs    = this.rubrics?.criteria || {};

    // Parse AI feedback into sections
    let fbImpression = '', fbStrength = '', fbImprove = '';
    if (feedback) {
      const lines = feedback.split(/\n/).map(l=>l.trim()).filter(Boolean);
      let section = '';
      lines.forEach(line => {
        const low = line.toLowerCase();
        if (low.startsWith('impression') || low.startsWith('overall'))       section = 'impression';
        else if (low.startsWith('strength') || low.startsWith('what you did well')) section = 'strength';
        else if (low.startsWith('improve') || low.startsWith('to improve') || low.startsWith('suggestion')) section = 'improve';
        else {
          if (section==='impression') fbImpression += line + ' ';
          else if (section==='strength') fbStrength += line + ' ';
          else if (section==='improve') fbImprove  += line + ' ';
          else fbImpression += line + ' ';
        }
      });
    }

    const panel = document.getElementById('feedback-panel');
    if (!panel) return;
    panel.innerHTML = `
    <div style="margin-top:32px;padding-top:28px;border-top:1px solid var(--border);">
      <!-- Score header -->
      <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;">
        <div style="font-family:Sora,sans-serif;font-size:3rem;font-weight:800;color:${col};line-height:1;">${overall}<span style="font-size:1.2rem;font-weight:600;color:var(--text-3);">%</span></div>
        <div>
          <div style="font-size:0.9rem;font-weight:600;color:var(--text-1);">Question Score</div>
          <div style="font-size:0.75rem;color:var(--text-3);">${aiPowered?'Groq AI · Llama 3.3':'Heuristic engine'}</div>
        </div>
      </div>

      <!-- Criteria bars -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:24px;">
        ${Object.entries(scores).map(([k,v]) => {
          const info = rubs[k]||{};
          const name = info.name||(k.charAt(0).toUpperCase()+k.slice(1));
          const pf   = parseFloat(v)||0;
          const c    = pf>=4?'#10B981':pf>=3?'#6366F1':pf>=2?'#F59E0B':'#F43F5E';
          return `
          <div style="padding:12px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:0.75rem;color:var(--text-2);">${name}</span>
              <span style="font-size:0.78rem;font-weight:700;color:${c};">${pf}/5</span>
            </div>
            <div style="height:3px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;">
              <div style="height:100%;width:${Math.round((pf/5)*100)}%;background:${c};border-radius:2px;"></div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <!-- AI Feedback cards -->
      ${feedback ? `
      <div class="feedback-sections">
        ${[
          { label:'Overall Impression', text: fbImpression || feedback.split('.').slice(0,2).join('.')+'.', col:'#6366F1', bg:'rgba(99,102,241,0.06)', border:'rgba(99,102,241,0.15)' },
          { label:'Strengths',          text: fbStrength   || 'Your response demonstrated engagement with the topic.', col:'#10B981', bg:'rgba(16,185,129,0.06)', border:'rgba(16,185,129,0.15)' },
          { label:'To Improve',         text: fbImprove    || 'Review the criteria above and focus on lower-scored areas.', col:'#F59E0B', bg:'rgba(245,158,11,0.06)', border:'rgba(245,158,11,0.15)' }
        ].map(s => `
        <div style="padding:16px;background:${s.bg};border:1px solid ${s.border};border-radius:var(--radius);">
          <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:${s.col};margin-bottom:8px;">${s.label}</div>
          <p style="font-size:0.82rem;color:var(--text-2);line-height:1.65;margin:0;">${s.text.trim()}</p>
        </div>`).join('')}
      </div>` : ''}

      <!-- Next / Finish -->
      <div class="flex justify-end gap-12" style="margin-top:20px;">
        ${isLast
          ? `<button class="btn btn-primary btn-lg" onclick="app.nextQuestion()">View Full Report →</button>`
          : `<button class="btn btn-primary btn-lg" onclick="app.nextQuestion()">Next Question →</button>`}
      </div>
    </div>`;

    panel.classList.remove('hidden');
    this.qIndex++;
    panel.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  nextQuestion() {
    if (this.qIndex >= this.sessionQs.length) this.finishAssessment();
    else { window.scrollTo({top:0,behavior:'smooth'}); this._loadQuestion(); }
  }

  /* ═══════════════════════════════════════════════════════════
     EXIT CONFIRMATION (custom modal — no window.confirm)
  ═══════════════════════════════════════════════════════════ */
  confirmExit() {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay || !content) { this.renderDashboard(); return; }

    content.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="width:48px;height:48px;border-radius:12px;background:rgba(225,29,72,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:24px;color:#BE123C;">⚠</div>
        <div style="font-size:1rem;font-weight:700;color:var(--text-1);margin-bottom:6px;">Exit Assessment?</div>
        <div style="font-size:0.82rem;color:var(--text-3);">Your current progress will not be saved.</div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-ghost" style="flex:1;" onclick="app.closeModal()">Keep Going</button>
        <button class="btn btn-danger" style="flex:1;" onclick="app.closeModal();app.renderDashboard();">Exit</button>
      </div>`;
    overlay.classList.remove('hidden');
  }

  /* ═══════════════════════════════════════════════════════════
     FINISH & REPORT
  ═══════════════════════════════════════════════════════════ */
  finishAssessment() {
    // Aggregate scores
    const agg = {};
    this.allScores.forEach(s => Object.entries(s).forEach(([k,v]) => {
      (agg[k] = agg[k]||[]).push(parseFloat(v)||0);
    }));
    const criteria = {};
    Object.entries(agg).forEach(([k,arr]) => {
      criteria[k] = Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10;
    });
    const vals    = Object.values(criteria);
    const overall = vals.length ? Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*20) : 0;
    const col     = overall>=80?'#10B981':overall>=60?'#6366F1':overall>=40?'#F59E0B':'#F43F5E';
    const label   = overall>=80?'Excellent Communicator':overall>=60?'Proficient Communicator':overall>=40?'Developing Communicator':'Needs More Practice';

    // Save history
    const rec = { date:new Date().toISOString(), type:this.currentType, level:this.currentLevel, overall, duration:Date.now()-this.sessionStart };
    const h   = this._history();
    h.unshift(rec);
    localStorage.setItem('commai_history', JSON.stringify(h.slice(0,20)));

    const typeLabels = { oral:'Verbal Communication', written:'Written Communication', listening:'Active Listening', presentation:'Presentation Skills' };
    const rubs = this.rubrics?.criteria || {};
    const recs = this.rubrics?.recommendations || {};

    const sorted     = Object.entries(criteria).sort((a,b) => b[1]-a[1]);
    const strengths  = sorted.filter(([,s]) => s >= 3.5);
    const weaknesses = sorted.filter(([,s]) => s <  3.5);

    // Per-criterion action plans (3 steps each)
    const actionPlans = {
      clarity:           ['Practice the PREP method: Point → Reason → Example → Point before every response.', 'After writing, read it aloud. If you pause to re-read a sentence, rewrite it simpler.', 'Summarise your key idea in one sentence before expanding — this forces clarity of thought.'],
      fluency:           ['Record yourself speaking for 3 minutes daily and listen back for filler words.', 'Practice "thought groups" — pause at commas and periods, not mid-sentence.', 'Read a paragraph aloud, then retell it from memory without looking — builds smooth recall.'],
      vocabulary:        ['Keep a word journal: write 3 new words daily with their context and use them next day.', 'Read editorials or quality journalism for 15 minutes daily — notice word choices.', 'When drafting, avoid repeating the same noun — force yourself to find a synonym each time.'],
      confidence:        ['Use power poses for 2 minutes before speaking — research-backed confidence boost.', 'Replace "I think maybe…" with assertive openers: "My view is…", "I recommend…".', 'Record 30-second voice notes on any topic daily — confidence builds with repetition.'],
      structure:         ['Use the classic 3-part structure: Opening → Body (3 points) → Close (action/summary).', 'Before writing, draft a 3-bullet outline — never skip this step even for short responses.', 'Add explicit signpost phrases: "First… Secondly… Finally…" to guide readers through your logic.'],
      grammar:           ['After drafting, do a "grammar pass" — read only for grammar, not content.', 'Study your most common error type (subject-verb, tense, article) and focus one week on it.', 'Read your text backwards sentence by sentence — it breaks the flow illusion and surfaces errors.'],
      tone:              ['Before writing, identify: Who is the reader? What do they need to feel? Let that drive word choice.', 'Write the same paragraph in 3 tones (formal, neutral, casual) to train tone-switching.', 'Avoid overly emotional words in professional contexts; replace with precise, measured language.'],
      persuasion:        ['Use the "Because" technique: every claim needs a "because" followed by evidence.', 'Learn the 3 persuasion pillars — Ethos (credibility), Pathos (emotion), Logos (logic) — use all three.', 'End with a clear call-to-action. Persuasion without a next step is incomplete.'],
      reasoning:         ['Use the Toulmin model: Claim → Evidence → Warrant. Never state a claim without these three.', 'Practice "steel-manning" — argue the opposite side as strongly as possible before writing your own view.', 'Ask "So what?" after every point you make — if you cannot answer it, the point lacks depth.'],
      storytelling:      ['Every story needs: a Character + a Challenge + a Change. Check yours has all three.', 'Use the "but/therefore" rule — avoid "and then…and then…". Use conflict and consequence instead.', 'Open with a specific scene or moment, not a general statement — hooks are concrete, not abstract.'],
      completeness:      ['Re-read the prompt after writing. Check every keyword in the prompt is addressed in your response.', 'Use a self-checklist: Introduction ✓ · All points addressed ✓ · Conclusion ✓ · Word target met ✓', 'Compare response length to the prompt complexity — a 5-part question needs at least 5 distinct answers.'],
      descriptiveness:   ['For each scene or idea, ask: What does it look like? Sound like? Feel like? Use at least 2 senses.', 'Replace vague adjectives (nice, big, good) with precise ones (immaculate, towering, meticulously crafted).', 'Practice "show, do not tell" — instead of "She was nervous", write "Her hands would not stay still."'],
      argumentation:     ['Use the PEEL method: Point → Evidence → Explanation → Link back to main argument.', 'Anticipate the strongest counterargument and address it directly — this makes your argument bulletproof.', 'Every argument needs at least one concrete example or statistic. Abstractions alone do not persuade.'],
      formality:         ['Eliminate contractions (do not, it is) in formal writing immediately.', 'Replace colloquial phrases: "sort of" → "somewhat", "a lot" → "considerably", "get" → "obtain".', 'Study 5 formal email templates and analyse their vocabulary and sentence structure weekly.'],
      coherence:         ['Use linking phrases between paragraphs: "Building on this…", "In contrast…", "Consequently…"', 'Read only your first and last sentence of each paragraph — they should connect logically without the middle.', 'Create a "flow map" — bullet your paragraphs in order and draw arrows showing how each leads to the next.'],
      creativity:        ['Start with the most obvious idea, then deliberately discard it and find a less predictable angle.', 'Use analogies: find an unexpected comparison for your topic to make it fresh.', 'Free-write for 10 minutes on the topic without editing — your raw ideas are often the freshest.'],
      analysis:          ['After stating any fact, ask "Why?" twice — this forces you to go below surface level.', 'Compare and contrast: every analysis becomes richer when you examine at least two sides or options.', 'Use the SOAR framework: Situation → Observations → Analysis → Recommendations.'],
      'narrative-flow':  ['Read your work aloud — any point where you stumble is a flow problem to fix.', 'Vary sentence length deliberately: short sentences create tension; longer ones build rhythm.', 'Check transitions: the last word/idea of one paragraph should connect to the first of the next.'],
      originality:       ['Ask "What would most people say here?" — then say something else.', 'Combine two unrelated ideas or domains to create a fresh perspective on your topic.', 'Find one surprising statistic or counterintuitive insight to anchor your piece around.'],
      'critical-thinking':['Question every assumption in the prompt — write them down before responding.', 'Practice the "5 Whys" technique: keep asking why for any conclusion to find the root cause.', 'Deliberately argue against your own conclusion to identify weaknesses and strengthen your stance.'],
    };

    const practiceEx = {
      clarity:           '5-min daily: Explain a complex topic to an imaginary 12-year-old in 3 sentences.',
      fluency:           '3-min daily: Record yourself speaking on any topic, no stopping or editing.',
      vocabulary:        '10-min daily: Read editorial content and underline 3 unfamiliar words.',
      confidence:        '5-min daily: State 3 strong opinions out loud — no hedging language allowed.',
      structure:         '5-min daily: Write a 3-bullet outline for any topic before you expand it.',
      grammar:           '10-min daily: Edit a paragraph of your old writing purely for grammar.',
      tone:              '10-min weekly: Rewrite the same message in 3 different tones (formal, casual, urgent).',
      persuasion:        '15-min weekly: Write a 150-word argument for something you disagree with.',
      reasoning:         '10-min daily: Practice the "claim + evidence + so what?" structure on news headlines.',
      storytelling:      '5-min daily: Tell a story from your day using the 3-part arc: setup, conflict, resolution.',
      completeness:      'After writing: read the prompt again and tick off every requirement in your response.',
      descriptiveness:   '5-min daily: Describe your surroundings using 5 senses — one sentence each.',
      argumentation:     '10-min weekly: Find the strongest counterargument to your own position and rebut it.',
      formality:         '10-min weekly: Rewrite 5 casual sentences into formal professional language.',
      coherence:         '5-min daily: Write 3 paragraphs where the last word of each leads into the next.',
      creativity:        '10-min daily: Free-write on a random topic — no backspace, no stopping.',
      analysis:          '10-min daily: Pick a news headline and apply the "5 Whys" to find root causes.',
      'narrative-flow':  '5-min daily: Read your last piece of writing aloud — fix every place you stumble.',
      originality:       '10-min weekly: List 10 obvious responses to a topic, then write about the 11th.',
      'critical-thinking':'10-min daily: Find a popular opinion and write a reasoned rebuttal.',
    };

    document.getElementById('page-report').innerHTML = `
    <div class="layout">
      ${this.sidebar('')}
      <main class="main-content">
        <div class="page-header">
          <h1 class="page-title">Assessment Report</h1>
          <p class="page-subtitle">${typeLabels[this.currentType]} · Level ${this.currentLevel} · ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>
        </div>

        <!-- Hero score -->
        <div class="report-hero" style="margin-bottom:24px;">
          <div class="report-pct" style="color:${col};">${overall}<span style="font-size:2.5rem;color:var(--text-2);">%</span></div>
          <div class="report-level">${label}</div>
          <div style="width:280px;margin:20px auto 0;">
            <div style="height:4px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;">
              <div id="report-main-bar" style="height:100%;width:0%;background:${col};border-radius:2px;transition:width 1.4s cubic-bezier(0.4,0,0.2,1);"></div>
            </div>
          </div>
        </div>

        <!-- Radar + Criteria grid -->
        <div class="report-grid">
          <div class="card">
            <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--text-3);margin-bottom:16px;">Skills Radar</div>
            <div class="chart-wrap"><canvas id="radar-chart" width="260" height="260"></canvas></div>
          </div>
          <div class="card">
            <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--text-3);margin-bottom:16px;">Criteria Scores</div>
            ${Object.entries(criteria).map(([k,v]) => {
              const info = rubs[k]||{};
              const name = info.name||(k.charAt(0).toUpperCase()+k.slice(1));
              const p    = Math.round((v/5)*100);
              const c    = v>=4?'#10B981':v>=3?'#6366F1':v>=2?'#F59E0B':'#F43F5E';
              const tag  = v>=4?'Strong':v>=3?'Good':v>=2?'Developing':'Needs Work';
              return `
              <div style="margin-bottom:13px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                  <span style="font-size:0.78rem;color:var(--text-2);">${name}</span>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:0.6rem;padding:2px 6px;border-radius:4px;background:${c}18;color:${c};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${tag}</span>
                    <span style="font-size:0.82rem;font-weight:700;color:${c};">${v}/5</span>
                  </div>
                </div>
                <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;">
                  <div class="rep-bar" data-w="${p}" style="height:100%;width:0%;background:${c};border-radius:2px;transition:width 1s ease;"></div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- What You Did Well -->
        ${strengths.length ? `
        <div class="card" style="margin-top:20px;">
          <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--emerald-l);margin-bottom:16px;">What You Did Well</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">
            ${strengths.map(([k,v]) => {
              const info = rubs[k]||{};
              const name = info.name||(k.charAt(0).toUpperCase()+k.slice(1));
              const desc = info.levels?.[String(Math.round(v))] || info.description || '';
              const c    = v>=4?'#10B981':'#6366F1';
              return `
              <div style="padding:14px;background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.12);border-radius:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <span style="font-size:0.82rem;font-weight:600;color:var(--text-1);">${name}</span>
                  <span style="font-size:0.82rem;font-weight:700;color:${c};">${v}/5</span>
                </div>
                <p style="font-size:0.72rem;color:var(--text-3);margin:0;line-height:1.5;">${desc}</p>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        <!-- Personalised Improvement Plan -->
        ${weaknesses.length ? `
        <div style="margin-top:28px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="flex:1;height:1px;background:var(--border);"></div>
            <span style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--text-3);white-space:nowrap;">Personalised Improvement Plan</span>
            <div style="flex:1;height:1px;background:var(--border);"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:16px;">
            ${weaknesses.map(([k,v]) => {
              const info     = rubs[k]||{};
              const name     = info.name||(k.charAt(0).toUpperCase()+k.slice(1));
              const desc     = info.description||'';
              const levelTxt = info.levels?.[String(Math.round(v))]||'';
              const steps    = actionPlans[k] || [recs[k]||'Practice this skill regularly with focused exercises.'];
              const ex       = practiceEx[k]  || '';
              const sev      = v<2 ? { col:'#F43F5E', bg:'rgba(244,63,94,0.06)',   border:'rgba(244,63,94,0.18)',   badge:'Critical',   badgeBg:'rgba(244,63,94,0.15)' }
                             : v<3 ? { col:'#F59E0B', bg:'rgba(245,158,11,0.06)',  border:'rgba(245,158,11,0.18)',  badge:'Needs Work', badgeBg:'rgba(245,158,11,0.15)' }
                             :       { col:'#6366F1', bg:'rgba(99,102,241,0.06)', border:'rgba(99,102,241,0.18)', badge:'Developing', badgeBg:'rgba(99,102,241,0.12)' };
              return `
              <div style="background:${sev.bg};border:1px solid ${sev.border};border-radius:16px;padding:22px 24px;">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px;">
                  <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
                      <span style="font-size:0.95rem;font-weight:700;color:var(--text-1);">${name}</span>
                      <span style="font-size:0.62rem;padding:2px 8px;border-radius:4px;background:${sev.badgeBg};color:${sev.col};font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">${sev.badge}</span>
                    </div>
                    <p style="font-size:0.75rem;color:var(--text-3);margin:0;">${desc}</p>
                  </div>
                  <div style="text-align:right;flex-shrink:0;">
                    <div style="font-family:Sora,sans-serif;font-size:1.6rem;font-weight:800;color:${sev.col};line-height:1;">${v}<span style="font-size:0.9rem;font-weight:600;">/5</span></div>
                    <div style="font-size:0.65rem;color:var(--text-3);margin-top:2px;">Your score</div>
                  </div>
                </div>
                ${levelTxt ? `
                <div style="padding:10px 14px;background:rgba(0,0,0,0.2);border-radius:8px;margin-bottom:14px;border-left:2px solid ${sev.col};">
                  <span style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${sev.col};margin-right:6px;">Current level:</span>
                  <span style="font-size:0.78rem;color:var(--text-2);">${levelTxt}</span>
                </div>` : ''}
                <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--text-3);margin-bottom:10px;">Action Steps</div>
                <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:${ex?'14px':'0'};">
                  ${steps.map((step,i) => `
                  <div style="display:flex;align-items:flex-start;gap:12px;">
                    <div style="width:22px;height:22px;border-radius:50%;background:${sev.col}22;border:1px solid ${sev.col}55;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;color:${sev.col};flex-shrink:0;margin-top:2px;">${i+1}</div>
                    <span style="font-size:0.82rem;color:var(--text-2);line-height:1.65;">${step}</span>
                  </div>`).join('')}
                </div>
                ${ex ? `
                <div style="display:flex;align-items:flex-start;gap:10px;padding:11px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;">
                  <span style="font-size:0.68rem;font-weight:700;color:${sev.col};text-transform:uppercase;letter-spacing:1px;white-space:nowrap;margin-top:2px;">Practice</span>
                  <span style="font-size:0.78rem;color:var(--text-3);line-height:1.55;">${ex}</span>
                </div>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>` : `
        <div class="card" style="margin-top:20px;text-align:center;padding:32px;">
          <div style="font-size:1.5rem;margin-bottom:8px;">★</div>
          <div style="font-size:0.9rem;font-weight:600;color:var(--text-1);margin-bottom:4px;">All criteria above threshold</div>
          <p style="font-size:0.78rem;color:var(--text-3);">Great performance across the board. Challenge yourself with a higher level.</p>
        </div>`}

        <div class="flex gap-12 justify-end" style="margin-top:28px;padding-bottom:60px;">
          <button class="btn btn-ghost" onclick="app.renderDashboard()">Back to Dashboard</button>
          <button class="btn btn-primary" onclick="app.openAssessment('${this.currentType}')">Retake Assessment</button>
        </div>
      </main>
    </div>`;

    this.go('report');
    setTimeout(() => {
      document.getElementById('report-main-bar').style.width = overall + '%';
      document.querySelectorAll('.rep-bar[data-w]').forEach(el => { el.style.width = el.dataset.w + '%'; });
      this._initRadar(criteria);
    }, 150);
  }

  _initRadar(criteria) {
    const canvas = document.getElementById('radar-chart');
    if (!canvas || !window.Chart) return;
    const rubs   = this.rubrics?.criteria || {};
    const labels = Object.keys(criteria).map(k => (rubs[k]?.name||k).slice(0,12));
    const values = Object.values(criteria);
    new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Score',
          data: values,
          backgroundColor: 'rgba(99,102,241,0.15)',
          borderColor: 'rgba(99,102,241,0.7)',
          borderWidth: 1.5,
          pointBackgroundColor: '#6366F1',
          pointBorderColor: 'transparent',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0, max: 5,
            ticks: { stepSize:1, color:'rgba(0,0,0,0.3)', font:{size:9}, backdropColor:'transparent' },
            grid:        { color:'rgba(0,0,0,0.08)' },
            angleLines:  { color:'rgba(0,0,0,0.06)' },
            pointLabels: { color:'rgba(0,0,0,0.6)', font:{size:10,family:'Inter'} }
          }
        },
        plugins: { legend:{ display:false } },
        animation: { duration:1000, easing:'easeInOutQuart' }
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     HISTORY PAGE
  ═══════════════════════════════════════════════════════════ */
  renderHistory() {
    const hist   = this._history();
    const labels = { oral:'Verbal', written:'Written', listening:'Listening', presentation:'Presentation' };
    const icons  = { oral:'◎', written:'≡', listening:'◑', presentation:'▦' };
    const ibgs   = { oral:'rgba(99,102,241,0.1)', written:'rgba(6,182,212,0.1)', listening:'rgba(16,185,129,0.1)', presentation:'rgba(245,158,11,0.1)' };
    const icols  = { oral:'#818CF8', written:'#22D3EE', listening:'#34D399', presentation:'#FCD34D' };

    document.getElementById('page-dashboard').innerHTML = `
    <div class="layout">
      ${this.sidebar('history')}
      <main class="main-content">
        <div class="page-header">
          <h1 class="page-title">Assessment History</h1>
          <p class="page-subtitle">${hist.length} completed assessment${hist.length!==1?'s':''}</p>
        </div>
        ${hist.length === 0 ? `
        <div class="empty-state" style="padding:80px 20px;">
          <div class="es-icon" style="font-size:3rem;">◎</div>
          <p style="font-size:1rem;margin-top:12px;">No assessments yet</p>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="app.renderDashboard()">Start Your First Assessment</button>
        </div>` : `
        <div class="card">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid var(--border);">
                <th style="text-align:left;padding:10px 14px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);">Type</th>
                <th style="text-align:left;padding:10px 14px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);">Level</th>
                <th style="text-align:left;padding:10px 14px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);">Date</th>
                <th style="text-align:right;padding:10px 14px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);">Score</th>
              </tr>
            </thead>
            <tbody>
              ${hist.map(h => {
                const c = h.overall>=80?'#10B981':h.overall>=60?'#6366F1':h.overall>=40?'#F59E0B':'#F43F5E';
                return `
                <tr style="border-bottom:1px solid var(--border);">
                  <td style="padding:14px;"><div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:8px;background:${ibgs[h.type]||'rgba(255,255,255,0.05)'};display:flex;align-items:center;justify-content:center;font-size:14px;color:${icols[h.type]||'var(--text-2)'};">${icons[h.type]||'◎'}</div>
                    <span style="font-size:0.85rem;font-weight:500;color:var(--text-1);">${labels[h.type]||h.type}</span>
                  </div></td>
                  <td style="padding:14px;font-size:0.82rem;color:var(--text-3);">Level ${h.level}</td>
                  <td style="padding:14px;font-size:0.82rem;color:var(--text-3);">${new Date(h.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                  <td style="padding:14px;text-align:right;"><span style="font-size:0.9rem;font-weight:700;color:${c};">${h.overall}%</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="flex gap-12 justify-end" style="margin-top:16px;">
          <button class="btn btn-ghost btn-sm" onclick="app.clearHistory()">Clear History</button>
          <button class="btn btn-ghost btn-sm" onclick="app.renderDashboard()">← Back to Dashboard</button>
        </div>`}
      </main>
    </div>`;
    this.go('dashboard');
  }

  clearHistory() {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:1rem;font-weight:700;color:var(--text-1);margin-bottom:6px;">Clear all history?</div>
        <div style="font-size:0.82rem;color:var(--text-3);">This cannot be undone.</div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-ghost" style="flex:1;" onclick="app.closeModal()">Cancel</button>
        <button class="btn btn-danger" style="flex:1;" onclick="app.closeModal();localStorage.removeItem('commai_history');app.renderDashboard();">Clear</button>
      </div>`;
    overlay.classList.remove('hidden');
  }

  /* ═══════════════════════════════════════════════════════════
     MODAL
  ═══════════════════════════════════════════════════════════ */
  closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }

  /* ═══════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════ */
  _history() { try { return JSON.parse(localStorage.getItem('commai_history')||'[]'); } catch { return []; } }
  _avgByType(type) {
    const h = this._history().filter(x=>x.type===type);
    if (!h.length) return null;
    return Math.round(h.reduce((a,x)=>a+x.overall,0)/h.length);
  }
}

/* ── Toast ─────────────────────────────────────────────── */
function showToast(msg, type='info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
window.showToast = showToast;

const app = new App();
window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());
