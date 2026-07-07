/**
 * written.js — Written Assessment (redesigned)
 */
class WrittenAssessment {
  constructor() {
    this.timer    = null;
    this.timeLeft = 0;
    this.question = null;
    this.onComplete = null;
  }

  render(question, onComplete) {
    this.question   = question;
    this.onComplete = onComplete;
    this.timeLeft   = question.duration || 600;

    const min = question.minWords || 80;
    const max = question.maxWords || 250;

    return `
    <div id="written-wrap">
      <div class="prompt-card" style="--accent-line:var(--cyan);">
        <div class="prompt-label">${question.title || 'Writing Prompt'}</div>
        <div class="prompt-text">${question.prompt}</div>
      </div>

      ${question.expectedElements?.length ? `
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
        ${question.expectedElements.map(e => `<span style="font-size:0.68rem;padding:3px 10px;border:1px solid rgba(6,182,212,0.2);border-radius:4px;color:var(--cyan-l);font-weight:600;">${e}</span>`).join('')}
      </div>` : ''}

      <div class="timer-bar-wrap">
        <div class="timer-digits" id="written-timer">${this._fmt(this.timeLeft)}</div>
        <div class="timer-track"><div class="timer-fill" id="written-fill" style="width:100%;"></div></div>
        <button class="btn btn-ghost btn-sm" id="written-start-btn" onclick="writtenAssessment.startTimer()">Start Timer</button>
      </div>

      <div style="margin-bottom:8px;">
        <div class="input-label">Your Response</div>
        <textarea id="written-response" rows="14" placeholder="Begin writing here..." oninput="writtenAssessment.updateStats()" style="min-height:280px;"></textarea>
        <div class="word-count-row">
          <span id="written-wc" style="font-weight:600;color:var(--text-2);">0 words</span>
          <span style="color:var(--text-3);">Target: ${min}–${max} words</span>
        </div>
        <div style="height:2px;background:var(--border);border-radius:1px;margin-top:6px;overflow:hidden;">
          <div id="written-wc-bar" style="height:100%;width:0%;background:var(--cyan);border-radius:1px;transition:width 0.3s;"></div>
        </div>
      </div>

      <div style="display:flex;gap:20px;margin-bottom:20px;font-size:0.72rem;color:var(--text-3);">
        <span id="wr-sentences">0 sentences</span>
        <span id="wr-paragraphs">0 paragraphs</span>
        <span id="wr-avglen">Avg word length: —</span>
      </div>

      <div class="flex justify-end gap-12">
        <button class="btn btn-ghost" onclick="document.getElementById('written-response').value='';writtenAssessment.updateStats();">Clear</button>
        <button class="btn btn-primary" id="written-submit" onclick="writtenAssessment.submit()">Submit Response</button>
      </div>
    </div>`;
  }

  startTimer() {
    document.getElementById('written-start-btn').disabled = true;
    document.getElementById('written-start-btn').textContent = 'Running';
    const total = this.question.duration || 600;
    this.timer = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      const el   = document.getElementById('written-timer');
      const fill = document.getElementById('written-fill');
      if (el)   { el.textContent = this._fmt(this.timeLeft); el.className = 'timer-digits' + (this.timeLeft<=30?' danger':this.timeLeft<=90?' warn':''); }
      if (fill) { fill.style.width = `${(this.timeLeft/total)*100}%`; fill.className = 'timer-fill' + (this.timeLeft<=30?' danger':this.timeLeft<=90?' warn':''); }
      if (this.timeLeft <= 0) { clearInterval(this.timer); showToast("Time's up!", 'warn'); setTimeout(() => this.submit(), 1000); }
    }, 1000);
  }

  updateStats() {
    const ta   = document.getElementById('written-response');
    const text = ta?.value?.trim() || '';
    const words = text ? text.split(/\s+/) : [];
    const wc   = words.length;
    const sent = text.split(/[.!?]+/).filter(s=>s.trim()).length;
    const para = (text.split(/\n\n+/).filter(p=>p.trim()).length) || (text ? 1 : 0);
    const avg  = words.length ? (words.reduce((s,w)=>s+w.replace(/[^a-zA-Z]/g,'').length,0)/words.length).toFixed(1) : '—';
    const min  = this.question.minWords || 80;
    const max  = this.question.maxWords || 250;
    const pct  = Math.min(100, Math.round((wc/max)*100));

    document.getElementById('written-wc').textContent = `${wc} word${wc!==1?'s':''}`;
    document.getElementById('written-wc').style.color = wc >= min && wc <= max ? 'var(--emerald-l)' : wc > max ? 'var(--rose-l)' : 'var(--text-2)';
    document.getElementById('written-wc-bar').style.width = pct + '%';
    document.getElementById('written-wc-bar').style.background = wc >= min && wc <= max ? 'var(--emerald)' : wc > max ? 'var(--rose)' : 'var(--cyan)';
    document.getElementById('wr-sentences').textContent = `${sent} sentence${sent!==1?'s':''}`;
    document.getElementById('wr-paragraphs').textContent = `${para} paragraph${para!==1?'s':''}`;
    document.getElementById('wr-avglen').textContent = `Avg word length: ${avg}`;
  }

  async submit() {
    const response = document.getElementById('written-response')?.value?.trim() || '';
    if (!response || response.split(/\s+/).length < 10) { showToast('Write at least 10 words.', 'warn'); return; }
    clearInterval(this.timer);

    const btn = document.getElementById('written-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Scoring...'; }

    const scoreData = await window.api.score('written', response, this.question.criteria || [], this.question.sampleKeywords || []);
    const scores    = scoreData?.scores || {};
    const fbData    = await window.api.getFeedback('written', this.question.prompt, response, scores);

    if (this.onComplete) this.onComplete({ response, scores, feedback: fbData?.feedback || '', aiPowered: fbData?.aiPowered });
  }

  _fmt(s) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`; }
  destroy() { clearInterval(this.timer); }
}
window.writtenAssessment = new WrittenAssessment();
