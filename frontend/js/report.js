/**
 * report.js — Report Generation & Visualization
 * Generates comprehensive assessment reports with Chart.js radar chart
 */
class ReportGenerator {
  constructor() { this.chart = null; }

  render(sessionData, finalScore, rubrics) {
    const { type, level, date, duration } = sessionData;
    const { overall, criteria, levelLabel, levelColor } = finalScore;
    const history = JSON.parse(localStorage.getItem('commai_history')||'[]');
    const criteriaEntries = Object.entries(criteria);
    const rubricsData = rubrics?.criteria || {};
    const recs = rubrics?.recommendations || {};

    return `
    <div class="report-page" id="report-page-content">
      <div class="report-hero">
        <div class="badge badge-violet" style="margin-bottom:16px;">📊 Assessment Report</div>
        <h2 style="font-family:var(--font-display);font-size:1.8rem;margin-bottom:4px;">${this._typeLabel(type)} Assessment</h2>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:20px;">
          ${new Date(date||Date.now()).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          &nbsp;·&nbsp; Level ${level} &nbsp;·&nbsp; ${this._fmtDur(duration)}
        </p>
        <div class="report-badge" style="margin:0 auto 32px;">
          <div class="report-score">${overall}<span style="font-size:2rem;">%</span></div>
          <div class="report-label" style="color:${levelColor};">${levelLabel}</div>
        </div>
        <div style="max-width:360px;margin:0 auto;">
          <div class="progress-bar" style="height:10px;border-radius:5px;"><div class="progress-fill" id="overall-score-bar" style="width:0%;transition:width 1.5s cubic-bezier(0.4,0,0.2,1);"></div></div>
        </div>
      </div>
      <div class="report-grid" style="margin-bottom:40px;">
        <div class="card" style="display:flex;flex-direction:column;align-items:center;gap:16px;">
          <div style="font-weight:700;color:var(--text-primary);align-self:flex-start;">Skills Radar</div>
          <div class="chart-container"><canvas id="radar-chart" width="320" height="320"></canvas></div>
        </div>
        <div class="card">
          <div style="font-weight:700;color:var(--text-primary);margin-bottom:20px;">Criteria Breakdown</div>
          <div class="criteria-bar">
            ${criteriaEntries.map(([k,s])=>{
              const info=rubricsData[k]||{};
              const pct=((s/5)*100).toFixed(0);
              const col=s>=4?'var(--accent-emerald)':s>=3?'var(--accent-violet)':'var(--accent-amber)';
              return `<div class="criteria-item"><div class="criteria-header"><span class="criteria-name">${info.icon||'📌'} ${info.name||k}</span><span class="criteria-score" style="color:${col};">${s}/5</span></div><div class="progress-bar" style="height:5px;"><div class="progress-fill crit-bar-fill" data-width="${pct}" style="width:0%;background:${col};"></div></div></div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="report-grid" style="margin-bottom:40px;">
        <div class="card">
          <div class="report-section-title">💪 Your Strengths</div>
          ${criteriaEntries.filter(([,s])=>s>=4).sort((a,b)=>b[1]-a[1]).map(([k,s])=>{
            const info=rubricsData[k]||{};
            return `<div style="display:flex;gap:12px;padding:10px;background:rgba(16,185,129,0.06);border-radius:10px;margin-bottom:10px;border:1px solid rgba(16,185,129,0.15);">
              <span style="font-size:1.2rem;">${info.icon||'✅'}</span>
              <div><div style="font-weight:600;color:var(--accent-emerald);font-size:0.9rem;">${info.name||k} — ${s}/5</div></div></div>`;
          }).join('')||'<p style="color:var(--text-muted);">Keep practicing!</p>'}
        </div>
        <div class="card">
          <div class="report-section-title">🎯 Areas to Improve</div>
          ${criteriaEntries.filter(([,s])=>s<4).sort((a,b)=>a[1]-b[1]).slice(0,4).map(([k,s])=>{
            const info=rubricsData[k]||{};
            return `<div style="display:flex;gap:12px;padding:10px;background:rgba(245,158,11,0.06);border-radius:10px;margin-bottom:10px;border:1px solid rgba(245,158,11,0.15);">
              <span style="font-size:1.2rem;">${info.icon||'⚠️'}</span>
              <div><div style="font-weight:600;color:var(--accent-amber);font-size:0.9rem;">${info.name||k} — ${s}/5</div></div></div>`;
          }).join('')||'<p style="color:var(--accent-emerald);">🎉 Excellent across all criteria!</p>'}
        </div>
      </div>
      <div class="card mb-32">
        <div class="report-section-title">📚 Personalized Recommendations</div>
        ${criteriaEntries.sort((a,b)=>a[1]-b[1]).slice(0,4).map(([k])=>{
          const rec=recs[k]; if(!rec)return '';
          return `<div class="recommendation-item"><span class="rec-icon">💡</span><div class="rec-text">${rec}</div></div>`;
        }).join('')||'<p style="color:var(--text-muted);">Great work!</p>'}
      </div>
      ${history.length>1?`
      <div class="card mb-32">
        <div class="report-section-title">📈 Your Assessment History</div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
            <thead><tr style="border-bottom:1px solid var(--border-subtle);">
              <th style="text-align:left;padding:8px 12px;color:var(--text-muted);font-weight:600;">Date</th>
              <th style="text-align:left;padding:8px 12px;color:var(--text-muted);font-weight:600;">Type</th>
              <th style="text-align:right;padding:8px 12px;color:var(--text-muted);font-weight:600;">Score</th>
            </tr></thead>
            <tbody>${history.slice(0,5).map(h=>`
              <tr style="border-bottom:1px solid var(--border-subtle);">
                <td style="padding:10px 12px;color:var(--text-secondary);">${new Date(h.date).toLocaleDateString()}</td>
                <td style="padding:10px 12px;color:var(--text-secondary);">${this._typeLabel(h.type)}</td>
                <td style="padding:10px 12px;text-align:right;"><span style="font-weight:700;color:${h.overall>=70?'var(--accent-emerald)':'var(--accent-amber)'};">${h.overall||'–'}%</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`:''}
      <div class="flex gap-12" style="justify-content:center;flex-wrap:wrap;padding-bottom:60px;">
        <button class="btn btn-secondary" onclick="app.navigateTo('dashboard')">🏠 Back to Dashboard</button>
        <button class="btn btn-primary" onclick="app.startNewAssessment()">🔄 Take Another Assessment</button>
      </div>
    </div>`;
  }

  initChart(criteria, rubricsData) {
    const canvas = document.getElementById('radar-chart');
    if (!canvas || !window.Chart) return;
    const labels = Object.keys(criteria).map(k => { const i=rubricsData?.[k]; return i?`${i.icon} ${i.name}`:k; });
    const values = Object.values(criteria);
    if (this.chart) this.chart.destroy();
    this.chart = new Chart(canvas, {
      type:'radar',
      data:{ labels, datasets:[{ label:'Your Score', data:values, backgroundColor:'rgba(124,58,237,0.2)', borderColor:'rgba(124,58,237,0.8)', borderWidth:2, pointBackgroundColor:'rgba(124,58,237,1)', pointBorderColor:'#fff', pointBorderWidth:2, pointRadius:5 }] },
      options:{ responsive:true, scales:{ r:{ min:0,max:5, ticks:{stepSize:1,color:'rgba(255,255,255,0.3)',font:{size:10},backdropColor:'transparent'}, grid:{color:'rgba(255,255,255,0.08)'}, pointLabels:{color:'rgba(255,255,255,0.7)',font:{size:11}}, angleLines:{color:'rgba(255,255,255,0.06)'} } }, plugins:{ legend:{display:false} }, animation:{duration:1200,easing:'easeInOutQuart'} }
    });
  }

  animateBars(overall) {
    setTimeout(()=>{
      const bar=document.getElementById('overall-score-bar'); if(bar) bar.style.width=`${overall}%`;
      document.querySelectorAll('.crit-bar-fill').forEach(el=>{ setTimeout(()=>{el.style.width=el.dataset.width+'%';},200); });
    },300);
  }

  _typeLabel(t) { return {oral:'Verbal Communication',written:'Written Communication',listening:'Active Listening',presentation:'Presentation Skills'}[t]||t; }
  _fmtDur(ms) { if(!ms)return'—'; const m=Math.floor(ms/60000); return m>0?`${m}m`:`${Math.floor(ms/1000)}s`; }
}

window.reportGenerator = new ReportGenerator();
