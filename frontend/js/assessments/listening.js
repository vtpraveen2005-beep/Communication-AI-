/**
 * listening.js — Active Listening Assessment (redesigned)
 */
class ListeningAssessment {
  constructor() {
    this.question   = null;
    this.onComplete = null;
    this.answers    = [];
    this.timer      = null;
    this.timeLeft   = 0;
    this.submitted  = false;
  }

  render(question, onComplete) {
    this.question   = question;
    this.onComplete = onComplete;
    this.answers    = new Array(question.questions.length).fill(null);
    this.submitted  = false;
    this.timeLeft   = question.duration || 120;
    const L         = ['A','B','C','D'];

    return `
    <div id="listening-wrap">
      <div class="prompt-card" style="--accent-line:var(--emerald);">
        <div class="prompt-label">Scenario — ${question.scenario}</div>
        <div class="prompt-text" style="font-style:italic;">"${question.content}"</div>
      </div>

      <div id="listening-reading-phase">
        <div style="padding:11px 16px;background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.12);border-radius:var(--radius);margin-bottom:16px;font-size:0.78rem;color:var(--text-3);">
          Read the passage carefully. The text will be hidden when you move to questions. Questions test comprehension and recall.
        </div>
        <div class="timer-bar-wrap">
          <div class="timer-digits" id="lst-timer">${this._fmt(this.timeLeft)}</div>
          <div class="timer-track"><div class="timer-fill" id="lst-fill" style="width:100%;"></div></div>
          <button class="btn btn-ghost btn-sm" id="lst-start-btn" onclick="listeningAssessment.startReading()">Start Timer</button>
        </div>
        <div class="flex justify-end">
          <button class="btn btn-primary" onclick="listeningAssessment.doneReading()">Done Reading — Answer Questions →</button>
        </div>
      </div>

      <div id="listening-questions-phase" class="hidden">
        <div style="padding:11px 16px;background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.12);border-radius:var(--radius);margin-bottom:20px;font-size:0.78rem;color:var(--text-3);">
          The passage has been removed. Answer from memory — choose the best option for each question.
        </div>
        ${question.questions.map((q, qi) => `
        <div style="margin-bottom:24px;" id="lst-q-${qi}">
          <div style="font-size:0.88rem;font-weight:600;color:var(--text-1);margin-bottom:12px;line-height:1.6;">
            <span style="color:var(--indigo-l);font-weight:700;margin-right:6px;">${qi+1}.</span>${q.q}
          </div>
          <div class="mcq-grid">
            ${q.options.map((opt, oi) => `
            <div class="mcq-opt" id="lst-opt-${qi}-${oi}" onclick="listeningAssessment.pick(${qi},${oi})">
              <div class="mcq-letter">${L[oi]}</div>
              <span>${opt}</span>
            </div>`).join('')}
          </div>
        </div>`).join('')}
        <div class="flex justify-end">
          <button class="btn btn-primary" id="lst-submit" onclick="listeningAssessment.submit()">Submit Answers</button>
        </div>
      </div>
    </div>`;
  }

  startReading() {
    document.getElementById('lst-start-btn').disabled = true;
    const total = this.question.duration || 120;
    this.timer = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      const el   = document.getElementById('lst-timer');
      const fill = document.getElementById('lst-fill');
      if (el)   { el.textContent = this._fmt(this.timeLeft); el.className = 'timer-digits' + (this.timeLeft<=15?' danger':this.timeLeft<=30?' warn':''); }
      if (fill) { fill.style.width = `${(this.timeLeft/total)*100}%`; }
      if (this.timeLeft <= 0) { clearInterval(this.timer); this.doneReading(); }
    }, 1000);
  }

  doneReading() {
    clearInterval(this.timer);
    document.getElementById('listening-reading-phase').classList.add('hidden');
    document.getElementById('listening-questions-phase').classList.remove('hidden');
    showToast('Passage hidden — answer from memory.', 'info');
  }

  pick(qi, oi) {
    if (this.submitted) return;
    this.question.questions[qi].options.forEach((_,j) => {
      document.getElementById(`lst-opt-${qi}-${j}`)?.classList.remove('selected');
    });
    document.getElementById(`lst-opt-${qi}-${oi}`)?.classList.add('selected');
    this.answers[qi] = oi;
  }

  async submit() {
    const unanswered = this.answers.indexOf(null);
    if (unanswered !== -1) { showToast(`Please answer question ${unanswered+1}.`, 'warn'); return; }
    this.submitted = true;

    const btn = document.getElementById('lst-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Scoring...'; }

    // Reveal answers
    const { questions } = this.question;
    const correct = this.answers.filter((a,i) => a === questions[i].answer).length;
    questions.forEach((q,qi) => {
      q.options.forEach((_,oi) => {
        const el = document.getElementById(`lst-opt-${qi}-${oi}`);
        if (!el) return;
        el.classList.remove('selected');
        if (oi === q.answer) el.classList.add('correct');
        else if (oi === this.answers[qi]) el.classList.add('wrong');
      });
    });

    const summary = document.createElement('div');
    summary.style.cssText = 'margin-top:16px;padding:16px 20px;background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.15);border-radius:var(--radius);display:flex;align-items:center;gap:16px;';
    summary.innerHTML = `
      <div style="font-family:Sora,sans-serif;font-size:2rem;font-weight:800;color:${correct===questions.length?'var(--emerald-l)':'var(--indigo-l)'};">${correct}/${questions.length}</div>
      <div style="font-size:0.82rem;color:var(--text-2);">Questions answered correctly</div>`;
    document.getElementById('listening-questions-phase').appendChild(summary);

    const scoreData = await window.api.scoreListening(correct, questions.length);
    const scores    = scoreData?.scores || {};
    const fbData    = await window.api.getFeedback('listening', this.question.scenario, `Answered ${correct}/${questions.length} correctly.`, scores);

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Continue →';
      btn.onclick = () => {
        if (this.onComplete) this.onComplete({ answers: this.answers, scores, feedback: fbData?.feedback || '', correctCount: correct, aiPowered: fbData?.aiPowered });
      };
    }
  }

  _fmt(s) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`; }
  destroy() { clearInterval(this.timer); }
}
window.listeningAssessment = new ListeningAssessment();
