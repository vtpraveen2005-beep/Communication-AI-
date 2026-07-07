/**
 * presentation.js — Presentation Assessment (redesigned)
 */
class PresentationAssessment {
  constructor() {
    this.question   = null;
    this.onComplete = null;
    this.slide      = 0;
    this.responses  = {};
    this.timer      = null;
    this.elapsed    = 0;
  }

  render(question, onComplete) {
    this.question   = question;
    this.onComplete = onComplete;
    this.slide      = 0;
    this.responses  = {};
    this.elapsed    = 0;

    return `
    <div id="presentation-wrap">
      <div class="prompt-card" style="--accent-line:var(--amber);">
        <div class="prompt-label">Scenario</div>
        <div class="prompt-text">${question.context}</div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div class="slide-tabs" id="slide-tabs" style="flex:1;margin-right:16px;">
          ${question.slides.map((_,i) => `
          <button class="slide-tab ${i===0?'active':''}" id="slide-tab-${i}" onclick="presentationAssessment.goTo(${i})">
            ${i+1}. ${question.slides[i].label}
          </button>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
          <span style="font-size:0.72rem;color:var(--text-3);">Elapsed:</span>
          <span id="pres-elapsed" style="font-size:0.82rem;font-weight:600;color:var(--text-1);font-family:Sora,sans-serif;">0:00</span>
          <button class="btn btn-ghost btn-sm" id="pres-start-timer" onclick="presentationAssessment.startTimer()">Start Timer</button>
        </div>
      </div>

      <div id="slides-area">
        ${question.slides.map((s,i) => `
        <div id="slide-${i}" class="${i===0?'':'hidden'}">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
            <div style="width:28px;height:28px;border-radius:7px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:var(--amber-l);">${i+1}</div>
            <div>
              <div style="font-size:0.88rem;font-weight:600;color:var(--text-1);">${s.label}</div>
              <div style="font-size:0.72rem;color:var(--text-3);">Minimum ${s.minWords} words</div>
            </div>
            <div id="slide-done-${i}" style="margin-left:auto;font-size:0.75rem;color:var(--emerald-l);display:none;">Saved ✓</div>
          </div>
          <div style="padding:12px 16px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:12px;font-size:0.82rem;color:var(--text-3);line-height:1.6;">${s.prompt}</div>
          <textarea id="slide-text-${i}" rows="8" placeholder="${s.placeholder}" oninput="presentationAssessment.updateWC(${i})" style="min-height:180px;"></textarea>
          <div class="word-count-row">
            <span id="slide-wc-${i}" style="font-weight:600;">0 words</span>
            <span style="color:var(--text-3);">Min: ${s.minWords} words</span>
          </div>
          <div style="height:2px;background:var(--border);border-radius:1px;margin-top:6px;overflow:hidden;">
            <div id="slide-wc-bar-${i}" style="height:100%;width:0%;background:var(--amber);border-radius:1px;transition:width 0.3s;"></div>
          </div>
        </div>`).join('')}
      </div>

      <div class="flex justify-between gap-12" style="margin-top:20px;">
        <button class="btn btn-ghost" id="pres-prev" onclick="presentationAssessment.prev()" style="display:none;">← Previous</button>
        <div style="flex:1;"></div>
        <button class="btn btn-ghost" onclick="presentationAssessment.save()">Save Slide</button>
        <button class="btn btn-primary" id="pres-next" onclick="presentationAssessment.next()">Next Slide →</button>
        <button class="btn btn-primary hidden" id="pres-submit" onclick="presentationAssessment.submit()">Submit Presentation</button>
      </div>
    </div>`;
  }

  goTo(i) {
    this.save();
    document.getElementById(`slide-${this.slide}`).classList.add('hidden');
    document.getElementById(`slide-tab-${this.slide}`)?.classList.remove('active');
    this.slide = i;
    document.getElementById(`slide-${i}`).classList.remove('hidden');
    document.getElementById(`slide-tab-${i}`)?.classList.add('active');
    this._updateNav();
  }

  prev() { if (this.slide > 0) this.goTo(this.slide - 1); }
  next() {
    this.save();
    if (this.slide < this.question.slides.length - 1) this.goTo(this.slide + 1);
  }

  save() {
    const ta = document.getElementById(`slide-text-${this.slide}`);
    this.responses[this.slide] = ta?.value?.trim() || '';
    if (this.responses[this.slide]) {
      document.getElementById(`slide-tab-${this.slide}`)?.classList.add('done');
      document.getElementById(`slide-done-${this.slide}`).style.display = 'block';
    }
  }

  _updateNav() {
    const last = this.slide === this.question.slides.length - 1;
    const prev = document.getElementById('pres-prev');
    const next = document.getElementById('pres-next');
    const sub  = document.getElementById('pres-submit');
    if (prev) prev.style.display = this.slide > 0 ? '' : 'none';
    next.classList.toggle('hidden', last);
    sub.classList.toggle('hidden', !last);
  }

  updateWC(i) {
    const ta   = document.getElementById(`slide-text-${i}`);
    const text = ta?.value?.trim() || '';
    const wc   = text ? text.split(/\s+/).length : 0;
    const min  = this.question.slides[i].minWords || 50;
    const pct  = Math.min(100, Math.round((wc/min)*100));
    const col  = wc >= min ? 'var(--emerald)' : 'var(--amber)';
    const wcEl = document.getElementById(`slide-wc-${i}`);
    const bar  = document.getElementById(`slide-wc-bar-${i}`);
    if (wcEl) { wcEl.textContent = `${wc} words`; wcEl.style.color = wc >= min ? 'var(--emerald-l)' : 'var(--text-2)'; }
    if (bar)  { bar.style.width = pct + '%'; bar.style.background = col; }
  }

  startTimer() {
    document.getElementById('pres-start-timer').disabled = true;
    this.timer = setInterval(() => {
      this.elapsed++;
      const el = document.getElementById('pres-elapsed');
      if (el) el.textContent = `${Math.floor(this.elapsed/60)}:${(this.elapsed%60).toString().padStart(2,'0')}`;
    }, 1000);
  }

  async submit() {
    this.save();
    clearInterval(this.timer);
    const allText = Object.values(this.responses).join(' ').trim();
    if (allText.split(/\s+/).length < 40) { showToast('Add more content to your slides.', 'warn'); return; }

    const btn = document.getElementById('pres-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Scoring...'; }

    const criteria = this.question.criteria || ['structure','clarity','vocabulary','persuasion','completeness'];
    const scoreData = await window.api.score('presentation', allText, criteria, []);
    const scores    = scoreData?.scores || {};
    const fbData    = await window.api.getFeedback('presentation', this.question.context, allText, scores);

    if (this.onComplete) this.onComplete({ responses: this.responses, scores, feedback: fbData?.feedback || '', elapsed: this.elapsed, aiPowered: fbData?.aiPowered });
  }

  destroy() { clearInterval(this.timer); }
}
window.presentationAssessment = new PresentationAssessment();
