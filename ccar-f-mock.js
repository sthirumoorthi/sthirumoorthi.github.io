(() => {
  'use strict';
  const TOTAL = 60, LIMIT = 120 * 60, KEY = 'ccar-f-mock-v1';
  const domains = [
    'Agentic Architecture & Orchestration', 'Tool Design & MCP Integration',
    'Claude Code Configuration & Workflows', 'Prompt Engineering & Structured Output',
    'Context Management & Reliability'
  ];
  const quotas = [16, 11, 12, 12, 9];
  const names = ['Agentic Architecture & Orchestration', 'Tool Design & MCP Integration', 'Claude Code Configuration & Workflows', 'Prompt Engineering & Structured Output', 'Context Management & Reliability'];
  const $ = (s, root = document) => root.querySelector(s);
  const app = $('#mock-app');
  const safe = (value) => String(value ?? '');
  const shuffle = (items) => { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let bank = [], attempt, timerHandle, resultFilter = 'all';

  function save() { sessionStorage.setItem(KEY, JSON.stringify(attempt)); }
  function answeredCount() { return Object.values(attempt.answers).filter(v => Array.isArray(v) ? v.length : v).length; }
  function remaining() { return attempt.paused ? attempt.remaining : Math.max(0, Math.ceil((attempt.deadline - Date.now()) / 1000)); }
  function displayTime(seconds) { const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60; return [h,m,s].map(n => String(n).padStart(2, '0')).join(':'); }
  function startAttempt() {
    const picked = [];
    names.forEach((name, i) => picked.push(...shuffle(bank.filter(q => q.domain === name)).slice(0, quotas[i])));
    const questions = shuffle(picked);
    attempt = { ids: questions.map(q => q.id), index: 0, answers: {}, marked: [], deadline: Date.now() + LIMIT * 1000, remaining: LIMIT, paused: false, pausesLeft: 4, submitted: false, expired: false, filter: 'all' };
    save(); renderExam(); tick();
  }
  function loadAttempt() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY));
      if (saved && Array.isArray(saved.ids) && saved.ids.length === TOTAL && saved.ids.every(id => bank.some(q => q.id === id)) && typeof saved.answers === 'object') { attempt = saved; attempt.index = Math.max(0, Math.min(TOTAL - 1, attempt.index || 0)); }
      else startAttempt();
    } catch { startAttempt(); }
    if (!attempt.submitted) { renderExam(); tick(); }
    else renderResults();
  }
  function currentQuestion() { return bank.find(q => q.id === attempt.ids[attempt.index]); }
  function choicesFor(q) { return Array.isArray(q.choices) ? q.choices.map((text, i) => [String.fromCharCode(65 + i), text]) : Object.entries(q.choices || {}); }
  function answered(question) { const a = attempt.answers[question.id]; return Array.isArray(a) ? a.length > 0 : Boolean(a); }
  function renderMap() {
    const map = $('.question-map'); map.replaceChildren();
    attempt.ids.forEach((id, i) => {
      const q = bank.find(x => x.id === id), b = document.createElement('button');
      b.type = 'button'; b.className = 'map-item'; b.textContent = String(i + 1); b.setAttribute('aria-label', `Question ${i + 1}${answered(q) ? ', answered' : ', unanswered'}${attempt.marked.includes(id) ? ', marked for review' : ''}`);
      if (answered(q)) b.classList.add('is-answered'); if (attempt.marked.includes(id)) b.classList.add('is-marked'); if (i === attempt.index) b.classList.add('is-current');
      b.addEventListener('click', () => { attempt.index = i; save(); renderExam(); }); map.append(b);
    });
    $('.progress-count').textContent = `${answeredCount()} / ${TOTAL} answered`;
    $('.marked-count').textContent = `${attempt.marked.length} marked`;
  }
  function renderExam() {
    clearInterval(timerHandle); app.innerHTML = '';
    const shell = document.createElement('div'); shell.className = 'exam-shell';
    shell.innerHTML = `<header class="exam-bar"><a class="exam-brand" href="/certifications.html" aria-label="Exit exam to certifications"><span class="exam-monogram">CC</span><span><small>CCAR-F PRACTICE</small><b>Claude Architect Foundations</b></span></a><div class="exam-controls"><div class="time-box"><small>TIME LEFT</small><strong class="timer">02:00:00</strong></div><button class="pause-button" type="button">Pause · 4 left</button><button class="submit-button" type="button">Submit</button></div></header><main class="exam-stage"><aside class="progress-panel"><div class="progress-heading"><div><small>YOUR PROGRESS</small><strong class="progress-count">0 / 60 answered</strong></div><strong class="marked-count">0 marked</strong><button class="map-toggle" type="button" aria-expanded="false">Questions ▾</button></div><nav class="question-map" aria-label="Question navigator"></nav><div class="map-legend"><span><i class="legend-answered"></i>Answered</span><span><i class="legend-marked"></i>Marked</span><span><i class="legend-current"></i>Current</span></div></aside><section class="question-card" aria-live="polite"><div class="question-meta"><strong class="question-number"></strong><strong class="question-domain"></strong></div><div class="question-content"><h1 class="question-title"></h1><p class="question-instruction"></p><div class="answer-list"></div></div><footer class="question-footer"><button class="review-toggle" type="button">◇ Review later</button><div class="step-controls"><button class="prev-button" type="button">← Previous</button><button class="next-button" type="button">Next →</button></div></footer></section></main></div>`;
    app.append(shell);
    const q = currentQuestion(), domainIndex = names.indexOf(q.domain) + 1, isMulti = Array.isArray(q.correct), answers = attempt.answers[q.id] || [];
    $('.question-number').textContent = `QUESTION ${attempt.index + 1} OF ${TOTAL}`;
    $('.question-domain').textContent = `DOMAIN ${domainIndex} · ${q.domain}`;
    $('.question-title').textContent = q.question;
    $('.question-instruction').textContent = isMulti ? 'Select all that apply' : 'Select one answer';
    const list = $('.answer-list');
    choicesFor(q).forEach(([letter, choice]) => {
      const row = document.createElement('label'); row.className = 'answer-option';
      const input = document.createElement('input'); input.type = isMulti ? 'checkbox' : 'radio'; input.name = `answer-${q.id}`; input.value = letter; input.checked = isMulti ? answers.includes(letter) : answers === letter;
      const badge = document.createElement('span'); badge.className = 'choice-letter'; badge.textContent = letter;
      const text = document.createElement('span'); text.className = 'choice-text'; text.textContent = safe(choice);
      row.append(input, badge, text); list.append(row);
      input.addEventListener('change', () => { const selected = [...list.querySelectorAll('input:checked')].map(x => x.value); if (selected.length) attempt.answers[q.id] = isMulti ? selected : selected[0]; else delete attempt.answers[q.id]; save(); renderMap(); fitQuestion(); });
    });
    const marked = attempt.marked.includes(q.id); $('.review-toggle').classList.toggle('is-marked', marked); $('.review-toggle').textContent = marked ? '◆ Marked for review' : '◇ Review later';
    $('.review-toggle').addEventListener('click', () => { if (marked) attempt.marked = attempt.marked.filter(id => id !== q.id); else attempt.marked.push(q.id); save(); renderExam(); });
    $('.prev-button').disabled = attempt.index === 0; $('.next-button').disabled = attempt.index === TOTAL - 1;
    $('.prev-button').addEventListener('click', () => move(-1)); $('.next-button').addEventListener('click', () => move(1));
    $('.submit-button').addEventListener('click', requestSubmit);
    $('.pause-button').textContent = attempt.paused ? `Resume · ${attempt.pausesLeft} left` : `Pause · ${attempt.pausesLeft} left`;
    $('.pause-button').disabled = !attempt.paused && attempt.pausesLeft <= 0;
    $('.pause-button').addEventListener('click', togglePause);
    renderMap(); fitQuestion();
    $('.map-toggle').addEventListener('click', e => { const open = !$('.progress-panel').classList.contains('is-open'); $('.progress-panel').classList.toggle('is-open', open); e.currentTarget.setAttribute('aria-expanded', String(open)); e.currentTarget.textContent = open ? 'Close map ×' : 'Questions ▾'; });
  }
  function move(delta) { attempt.index = Math.max(0, Math.min(TOTAL - 1, attempt.index + delta)); save(); renderExam(); }
  function fitQuestion() {
    const content = $('.question-content'); if (!content) return;
    content.style.setProperty('--fit-scale', '1');
    requestAnimationFrame(() => { let scale = 1; while (content.scrollHeight > content.clientHeight + 2 && scale > .40) { scale -= .04; content.style.setProperty('--fit-scale', scale.toFixed(2)); } });
  }
  window.addEventListener('resize', fitQuestion);
  function togglePause() {
    if (attempt.paused) { attempt.deadline = Date.now() + attempt.remaining * 1000; attempt.paused = false; }
    else if (attempt.pausesLeft > 0) { attempt.remaining = remaining(); attempt.paused = true; attempt.pausesLeft--; }
    save(); renderExam(); tick();
  }
  function tick() {
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      if (!attempt || attempt.submitted || attempt.paused) return;
      const left = remaining(); const timer = $('.timer'); if (timer) timer.textContent = displayTime(left);
      if (left <= 0) submit(true);
    }, 250);
    const timer = $('.timer'); if (timer) timer.textContent = displayTime(remaining());
  }
  function requestSubmit() {
    const unanswered = TOTAL - answeredCount(); if (!unanswered) { submit(false); return; }
    const overlay = document.createElement('div'); overlay.className = 'confirm-overlay'; overlay.innerHTML = `<section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><p class="eyebrow">READY TO SUBMIT?</p><h2 id="confirm-title">${unanswered} question${unanswered === 1 ? '' : 's'} unanswered</h2><p>Unanswered questions count as incorrect. You can return to the exam or submit this attempt now.</p><div><button class="return-button" type="button">Return to exam</button><button class="confirm-submit" type="button">Submit anyway</button></div></section>`;
    app.append(overlay); $('.return-button', overlay).focus(); $('.return-button', overlay).addEventListener('click', () => overlay.remove()); $('.confirm-submit', overlay).addEventListener('click', () => submit(false)); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }
  function correctSet(q) { return Array.isArray(q.correct) ? q.correct : [q.correct]; }
  function selectedSet(q) { const value = attempt.answers[q.id]; return value ? (Array.isArray(value) ? value : [value]) : []; }
  function isCorrect(q) { const a = [...selectedSet(q)].sort(), b = [...correctSet(q)].sort(); return a.length === b.length && a.every((v, i) => v === b[i]); }
  function submit(expired) { clearInterval(timerHandle); attempt.submitted = true; attempt.expired = expired; attempt.submittedAt = Date.now(); save(); renderResults(); }
  function renderResults() {
    clearInterval(timerHandle); const correct = attempt.ids.map(id => bank.find(q => q.id === id)).filter(isCorrect).length, answered = answeredCount(), pct = (correct / TOTAL * 100).toFixed(1), benchmark = correct >= 44;
    app.innerHTML = `<main class="results-page"><section class="result-hero"><div class="score-ring" style="--score:${correct / TOTAL * 100}%"><div><strong>${pct}%</strong><small>${correct} of ${TOTAL}</small></div></div><div class="result-intro"><p class="eyebrow">${attempt.expired ? 'TIME EXPIRED · ATTEMPT SUBMITTED' : 'ATTEMPT SUBMITTED'}</p><h1>${benchmark ? 'A strong foundation.' : 'This attempt gave you a useful study map.'}</h1><p>${benchmark ? 'You reached this portfolio’s study benchmark. Review your domain results and reinforce any missed decision rules.' : 'Revisit the weaker domains, use the explanations to sharpen the underlying decision rules, and return for another timed attempt.'}</p><aside class="benchmark-note">This site uses a study benchmark of <strong>44/60 correct (about 73%)</strong>. The official certification exam reports a scaled passing score of 720/1000, so this result is not an official score prediction.</aside></div></section><section class="result-stats"><div><strong>${answered}</strong><b>completed</b><small>out of 60</small></div><div><strong>${correct}</strong><b>correct</b><small>exact-match scoring</small></div><div><strong>${TOTAL - answered}</strong><b>unanswered</b><small>counted incorrect</small></div><div><strong>${attempt.marked.length}</strong><b>marked</b><small>during the attempt</small></div></section><section class="domain-results"><p class="eyebrow">DOMAIN BREAKDOWN</p><h2>Where your score came from</h2><p class="domain-note">Multiple-response questions use exact-match scoring.</p><div class="domain-list"></div></section><section class="answer-review"><div class="review-heading"><div><p class="eyebrow">ANSWER REVIEW</p><h2>Understand every choice</h2></div><div class="review-filters" role="group" aria-label="Filter answer review"><button data-filter="all" class="active">All</button><button data-filter="incorrect">Incorrect</button><button data-filter="unanswered">Unanswered</button></div></div><div class="review-list"></div></section><div class="result-end"><button class="restart-button" type="button">Start a new exam</button><a href="/certifications.html">Back to certifications</a></div></main>`;
    const grouped = names.map((name, i) => { const qs = attempt.ids.map(id => bank.find(q => q.id === id)).filter(q => q.domain === name), n = qs.filter(isCorrect).length; return { name, i: i + 1, n, total: qs.length }; });
    $('.domain-list').innerHTML = grouped.map(d => `<div class="domain-row"><div><small>DOMAIN ${d.i}</small><strong>${safe(d.name)}</strong></div><div class="domain-track"><i style="width:${d.total ? d.n / d.total * 100 : 0}%"></i></div><b>${d.n}/${d.total}</b></div>`).join('');
    $('.review-filters').addEventListener('click', e => { const b = e.target.closest('button[data-filter]'); if (!b) return; resultFilter = b.dataset.filter; $('.review-filters .active').classList.remove('active'); b.classList.add('active'); renderReview(); });
    $('.restart-button').addEventListener('click', () => { sessionStorage.removeItem(KEY); startAttempt(); window.scrollTo(0, 0); }); renderReview();
  }
  function renderReview() {
    const list = $('.review-list'); list.replaceChildren();
    attempt.ids.forEach((id, i) => {
      const q = bank.find(x => x.id === id), right = isCorrect(q), unanswered = !answered(q);
      if (resultFilter === 'incorrect' && right || resultFilter === 'unanswered' && !unanswered) return;
      const card = document.createElement('article'); card.className = `review-card${right ? ' review-correct' : ' review-wrong'}`;
      const head = document.createElement('div'); head.className = 'review-question-meta'; const meta = document.createElement('span'); meta.textContent = `QUESTION ${i + 1} · DOMAIN ${names.indexOf(q.domain) + 1}`; const state = document.createElement('b'); state.textContent = unanswered ? 'UNANSWERED' : right ? 'CORRECT' : 'INCORRECT'; head.append(meta, state);
      const title = document.createElement('h3'); title.textContent = q.question; const choices = document.createElement('div'); choices.className = 'review-choices';
      choicesFor(q).forEach(([letter, text]) => { const row = document.createElement('div'); row.className = 'review-choice'; if (correctSet(q).includes(letter)) row.classList.add('choice-correct'); if (selectedSet(q).includes(letter) && !correctSet(q).includes(letter)) row.classList.add('choice-selected-wrong'); const badge = document.createElement('b'); badge.textContent = letter; const val = document.createElement('span'); val.textContent = safe(text); row.append(badge, val); if (correctSet(q).includes(letter)) { const label = document.createElement('small'); label.textContent = 'CORRECT ANSWER'; row.append(label); } else if (selectedSet(q).includes(letter)) { const label = document.createElement('small'); label.textContent = 'YOUR ANSWER'; row.append(label); } choices.append(row); });
      const explanation = safe(q.explanation), ix = explanation.toLowerCase().lastIndexOf('key point:'); const whyText = ix >= 0 ? explanation.slice(0, ix).trim() : explanation, tipText = ix >= 0 ? explanation.slice(ix + 10).trim() : 'Review the domain lesson and identify the decision rule behind the correct choice.';
      const notes = document.createElement('div'); notes.className = 'review-notes'; const why = document.createElement('p'), tip = document.createElement('p'); why.innerHTML = '<b>WHY</b>'; const wy = document.createElement('span'); wy.textContent = whyText || explanation; why.append(wy); tip.innerHTML = '<b>STUDY TIP</b>'; const tp = document.createElement('span'); tp.textContent = tipText; tip.append(tp); notes.append(why, tip); card.append(head, title, choices, notes); list.append(card);
    });
    if (!list.children.length) { const empty = document.createElement('p'); empty.className = 'empty-review'; empty.textContent = 'No questions match this filter.'; list.append(empty); }
  }
  fetch('/data/ccar-f-foundations-questions.json').then(r => { if (!r.ok) throw new Error('Question file could not be loaded'); return r.json(); }).then(data => { bank = data; if (!Array.isArray(bank)) throw new Error('Question file format is invalid'); loadAttempt(); }).catch(err => { app.innerHTML = `<section class="load-error"><h1>Exam unavailable</h1><p>${safe(err.message)}. Please refresh the page or return to Certifications.</p><a href="/certifications.html">Back to Certifications</a></section>`; });
})();
