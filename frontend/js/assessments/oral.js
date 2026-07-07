/**
 * oral.js — Verbal Assessment (redesigned)
 */
class OralAssessment {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.finalText   = '';
    this.timer       = null;
    this.timeLeft    = 0;
    this.question    = null;
    this.onComplete  = null;
    this.hasSpeech   = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  render(question, onComplete) {
    this.question   = question;
    this.onComplete = onComplete;
    this.finalText  = '';
    this.timeLeft   = question.duration || 90;

    return `
    <div id="oral-wrap">
      <div class="prompt-card" style="--accent-line:var(--indigo);">
        <div class="prompt-label">Prompt</div>
        <div class="prompt-text">${question.prompt}</div>
      </div>

      ${!this.hasSpeech ? `
      <div style="padding:12px 16px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:var(--radius);margin-bottom:16px;font-size:0.8rem;color:var(--amber-l);">
        Speech recognition not supported in this browser. Please type your response below.
      </div>` : `
      <div style="padding:11px 16px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:var(--radius);margin-bottom:16px;font-size:0.78rem;color:var(--text-3);">
        Click the microphone to begin recording. Speak clearly — Chrome or Edge recommended.
      </div>`}

      <div class="timer-bar-wrap">
        <div class="timer-digits" id="oral-timer">${this._fmt(this.timeLeft)}</div>
        <div class="timer-track"><div class="timer-fill" id="oral-fill" style="width:100%;"></div></div>
        ${this.hasSpeech ? `<span style="font-size:0.72rem;color:var(--text-3);" id="oral-rec-status">Ready</span>` : ''}
      </div>

      ${this.hasSpeech ? `
      <div class="mic-wrap">
        <button class="mic-btn" id="oral-mic" onclick="oralAssessment.toggle()" title="Start / Stop recording">◎</button>
        <div class="wave-bars" id="oral-wave">
          ${Array.from({length:10},(_,i)=>`<div class="wave-bar" style="height:4px;animation-delay:${i*0.08}s;"></div>`).join('')}
        </div>
        <span class="mic-label" id="oral-mic-label">Click to record</span>
      </div>
      ` : ''}

      <div id="oral-interim" style="min-height: 20px; font-style: italic; color: var(--indigo); font-size: 0.9rem; margin-bottom: 8px;"></div>

      <div style="margin-bottom:16px;">
        <div class="input-label">Your Response</div>
        <textarea id="oral-text-input" rows="8" placeholder="Type your response here or use the microphone to speak..." class="form-input" style="width:100%;resize:vertical;font-family:inherit;padding:12px;border-radius:var(--radius-sm);border:1px solid var(--border-strong);"></textarea>
      </div>

      <div class="flex justify-end gap-12">
        <button class="btn btn-ghost" onclick="oralAssessment.clear()">Clear</button>
        <button class="btn btn-primary" id="oral-submit" onclick="oralAssessment.submit()">Submit Response</button>
      </div>
    </div>`;
  }

  toggle() { this.isRecording ? this.stop() : this.start(); }

  start() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.onstart = () => {
      this.isRecording = true;
      document.getElementById('oral-mic')?.classList.add('recording');
      document.getElementById('oral-mic-label').textContent = 'Recording — click to stop';
      document.getElementById('oral-rec-status').textContent = 'Recording';
      document.querySelectorAll('#oral-wave .wave-bar').forEach(b => b.classList.add('active'));
      this._startTimer();
    };
    this.recognition.onresult = e => {
      let final = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      
      const interimEl = document.getElementById('oral-interim');
      if (interimEl) interimEl.textContent = interim;
      if (final) {
        const inp = document.getElementById('oral-text-input');
        if (inp) {
          const val = inp.value;
          inp.value = val ? val + ' ' + final.trim() : final.trim();
        }
      }
    };
    this.recognition.onend = () => { if (this.isRecording) { try { this.recognition.start(); } catch(e){} } };
    this.recognition.onerror = e => { 
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      console.warn('Speech error:', e.error);
      this.stop(); 
    };
    try { this.recognition.start(); } catch(e) { showToast('Microphone access denied.', 'error'); }
  }

  stop() {
    this.isRecording = false;
    this.recognition?.stop();
    clearInterval(this.timer); this.timer = null;
    document.getElementById('oral-mic')?.classList.remove('recording');
    document.getElementById('oral-mic').innerHTML = '◎';
    document.getElementById('oral-mic-label').textContent = 'Click to record again';
    document.getElementById('oral-rec-status').textContent = 'Stopped';
    document.querySelectorAll('#oral-wave .wave-bar').forEach(b => b.classList.remove('active'));
  }

  _startTimer() {
    const total = this.question.duration || 90;
    this.timer = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      const el   = document.getElementById('oral-timer');
      const fill = document.getElementById('oral-fill');
      if (el)   { el.textContent = this._fmt(this.timeLeft); el.className = 'timer-digits' + (this.timeLeft<=10?' danger':this.timeLeft<=30?' warn':''); }
      if (fill) { fill.style.width = `${(this.timeLeft/total)*100}%`; fill.className = 'timer-fill' + (this.timeLeft<=10?' danger':this.timeLeft<=30?' warn':''); }
      if (this.timeLeft <= 0) { this.stop(); showToast("Time's up — submitting...", 'warn'); setTimeout(() => this.submit(), 1000); }
    }, 1000);
  }

  clear() {
    this.finalText = '';
    const inp = document.getElementById('oral-text-input');
    if (inp) inp.value = '';
  }

  async submit() {
    const inp = document.getElementById('oral-text-input');
    let response = inp ? inp.value.trim() : '';
    if (!response || response.split(/\s+/).length < 5) { showToast('Please record or type a longer response first (min 5 words).', 'warn'); return; }
    this.stop();

    const btn = document.getElementById('oral-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Scoring...'; }

    const scoreData = await window.api.score('oral', response, this.question.criteria || [], this.question.keywords || []);
    const scores    = scoreData?.scores || {};
    const fbData    = await window.api.getFeedback('oral', this.question.prompt, response, scores);

    if (this.onComplete) this.onComplete({ response, scores, feedback: fbData?.feedback || '', aiPowered: fbData?.aiPowered });
  }

  _fmt(s) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`; }
  destroy() { this.stop(); }
}
window.oralAssessment = new OralAssessment();
