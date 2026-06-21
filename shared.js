// ── Supabase config ──────────────────────────────────────────────
const SUPABASE_URL  = 'https://mumvnjyiupzvmcoatwye.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bXZuanlpdXB6dm1jb2F0d3llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODEzMDMsImV4cCI6MjA5Njg1NzMwM30.JgMQRDkIvGFUvKR_Iwoo91zaPdd5urNig8yc0g0oMRk';
const SB_HEADERS    = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

async function submitScore(game, playerName, score) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
      method: 'POST',
      headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ game, player_name: playerName, score })
    });
    return res.ok;
  } catch(e) { console.error('submitScore failed', e); return false; }
}

async function getLeaderboard(game, limit = 10) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/leaderboard?game=eq.${encodeURIComponent(game)}&order=score.desc&limit=${limit}`,
      { headers: SB_HEADERS }
    );
    if (!res.ok) { console.error('leaderboard fetch', res.status, await res.text()); return []; }
    return res.json();
  } catch(e) { console.error('getLeaderboard failed', e); return []; }
}

// ── Daily seed ────────────────────────────────────────────────────
function dailyIndex(max) {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return Math.abs((seed * 1664525 + 1013904223) | 0) % max;
}

// Seeded shuffle — same order every call on same day
function dailyShuffle(arr) {
  const a = [...arr];
  const d = new Date();
  let seed = d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ── Leaderboard renderer ──────────────────────────────────────────
async function renderLeaderboard(game, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="3" style="color:var(--muted)">Loading…</td></tr>`;
  const data = await getLeaderboard(game);
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="color:var(--muted);font-style:italic">No scores yet — be first!</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((r, i) => `<tr><td style="color:var(--muted)">${i+1}</td><td>${escHtml(r.player_name)}</td><td>${r.score}</td></tr>`).join('');
}

async function handleScoreSubmit(game, score, nameInputId, submitAreaId, lbTbodyId) {
  const input = document.getElementById(nameInputId);
  const name = input ? input.value.trim() : '';
  if (!name) { if(input) input.focus(); return; }
  const ok = await submitScore(game, name, score);
  const area = document.getElementById(submitAreaId);
  if (area) area.innerHTML = ok
    ? `<p class="eyebrow" style="color:var(--correct)">✓ Score submitted!</p>`
    : `<p class="eyebrow" style="color:var(--wrong)">✗ Submission failed — check your connection</p>`;
  renderLeaderboard(game, lbTbodyId);
}

// ── Hardcoded fallback definitions (for known game words) ────────────
const FALLBACK_DEFS = {
  'EMBARRASS':      {pos:'verb',        def:'To cause someone to feel awkward, self-conscious, or ashamed.', ex:'His comment embarrassed her in front of the whole class.'},
  'NECESSARY':      {pos:'adjective',   def:'Required to be done or achieved; essential.', ex:'It is necessary to bring your passport to the exam.'},
  'ACCOMMODATION':  {pos:'noun',        def:'A place where someone can live or stay, especially temporarily.', ex:'The hotel offers comfortable accommodation for travellers.'},
  'OCCURRENCE':     {pos:'noun',        def:'An event or incident that happens; the fact of something occurring.', ex:'Power cuts were a common occurrence during the storm.'},
  'PRIVILEGE':      {pos:'noun',        def:'A special right or advantage available only to a particular person or group.', ex:'Access to education should not be a privilege but a right.'},
  'SEPARATE':       {pos:'verb',        def:'To cause something to move or be apart; to divide.', ex:'The teacher asked them to separate into two groups.'},
  'COMMITMENT':     {pos:'noun',        def:'The state of being dedicated to a cause or activity; a promise.', ex:'She showed great commitment to improving her English.'},
  'EXAGGERATE':     {pos:'verb',        def:'To represent something as being larger, better, or worse than it really is.', ex:'He always exaggerates how difficult the exam was.'},
  'PARLIAMENT':     {pos:'noun',        def:'The highest legislature of a country, responsible for making laws.', ex:'The bill was passed by parliament last week.'},
  'INDEPENDENT':    {pos:'adjective',   def:'Free from outside control; not depending on another\'s authority.', ex:'She became financially independent after getting her first job.'},
  'CONSCIENTIOUS':  {pos:'adjective',   def:'Wishing to do what is right, especially in one\'s work; thorough and careful.', ex:'She is a conscientious student who always hands in work on time.'},
  'MILLENNIUM':     {pos:'noun',        def:'A period of one thousand years, especially as reckoned from the birth of Christ.', ex:'We celebrated the arrival of the new millennium in style.'},
  'LIAISON':        {pos:'noun',        def:'Communication or cooperation between people or organisations; a person who acts as a link.', ex:'She acts as a liaison between the two departments.'},
  'QUESTIONNAIRE':  {pos:'noun',        def:'A set of printed or written questions with a choice of answers used for gathering information.', ex:'Please fill in the questionnaire before your appointment.'},
  'SUPERSEDE':      {pos:'verb',        def:'To take the place of something that is outmoded or no longer valid.', ex:'Digital cameras have largely superseded film cameras.'},
  'BUREAUCRACY':    {pos:'noun',        def:'A system of government or management in which there are many complicated rules and processes.', ex:'Getting a visa can involve a lot of bureaucracy.'},
  'HIERARCHY':      {pos:'noun',        def:'A system in which members of an organisation are ranked according to their authority or status.', ex:'She quickly rose through the hierarchy of the company.'},
  'PARTICULARLY':   {pos:'adverb',      def:'To a higher degree than normal or average; especially.', ex:'I am not particularly fond of spicy food.'},
  'ENTREPRENEUR':   {pos:'noun',        def:'A person who sets up a business or businesses, taking on financial risks in the hope of profit.', ex:'She became a successful entrepreneur at the age of 25.'},
  'CONSCIOUSLY':    {pos:'adverb',      def:'In a deliberate and intentional way; with full awareness.', ex:'She consciously decided to speak more slowly in presentations.'},
};

// ── Definition modal — three-level fallback ───────────────────────
// 1. Free Dictionary API  2. Datamuse API  3. Hardcoded fallback
async function fetchDefinition(word) {
  const key = word.toUpperCase();

  // Level 1: Free Dictionary API
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data) && data[0]) {
        const meaning = data[0].meanings?.[0];
        const defObj  = meaning?.definitions?.[0];
        if (defObj?.definition) {
          return { pos: meaning?.partOfSpeech || '', def: defObj.definition, ex: defObj.example || '' };
        }
      }
    }
  } catch(e) { /* fall through */ }

  // Level 2: Datamuse API
  try {
    const r = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word.toLowerCase())}&md=d&max=1`);
    if (r.ok) {
      const data = await r.json();
      const defs = data?.[0]?.defs;
      if (defs?.length) {
        // Datamuse format: "n\tA definition here"
        const parts = defs[0].split('\t');
        const posMap = {n:'noun', v:'verb', adj:'adjective', adv:'adverb', prep:'preposition'};
        return { pos: posMap[parts[0]] || parts[0] || '', def: parts[1] || '', ex: '' };
      }
    }
  } catch(e) { /* fall through */ }

  // Level 3: Hardcoded fallback
  if (FALLBACK_DEFS[key]) return FALLBACK_DEFS[key];

  return null;
}

function showDefinitionModal(word) {
  document.querySelector('.def-modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'def-modal-overlay';
  overlay.innerHTML = `
    <div class="def-modal fade-in">
      <button class="close-btn" onclick="this.closest('.def-modal-overlay').remove()">✕</button>
      <h3>${escHtml(word)}</h3>
      <div class="pos">Loading definition…</div>
      <div class="definition"></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });

  fetchDefinition(word).then(result => {
    const modal = overlay.querySelector('.def-modal');
    if (!modal) return; // modal was closed
    if (!result) {
      modal.querySelector('.pos').textContent = '';
      modal.querySelector('.definition').textContent = 'Definition not available.';
      return;
    }
    modal.querySelector('.pos').textContent = result.pos;
    modal.querySelector('.definition').textContent = result.def;
    if (result.ex) {
      const ex = document.createElement('div');
      ex.className = 'example';
      ex.textContent = `"${result.ex}"`;
      modal.appendChild(ex);
    }
  });
}

// For phrasal verbs — custom definitions stored in game data
function showPhrasalModal(phrasalVerb, definition, example) {
  document.querySelector('.def-modal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'def-modal-overlay';
  overlay.innerHTML = `
    <div class="def-modal fade-in">
      <button class="close-btn" onclick="this.closest('.def-modal-overlay').remove()">✕</button>
      <h3>${escHtml(phrasalVerb)}</h3>
      <div class="pos">phrasal verb</div>
      <div class="definition">${escHtml(definition)}</div>
      ${example ? `<div class="example">"${escHtml(example)}"</div>` : ''}
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
}

// For any game with its own verified local definitions (e.g. Anagram).
// Unlike showPhrasalModal, this does NOT hardcode a part-of-speech label —
// pass it in (or leave blank) since these are ordinary words, not phrasal verbs.
function showLocalDefModal(word, definition, example, pos) {
  document.querySelector('.def-modal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'def-modal-overlay';
  overlay.innerHTML = `
    <div class="def-modal fade-in">
      <button class="close-btn" onclick="this.closest('.def-modal-overlay').remove()">✕</button>
      <h3>${escHtml(word)}</h3>
      ${pos ? `<div class="pos">${escHtml(pos)}</div>` : ''}
      <div class="definition">${escHtml(definition)}</div>
      ${example ? `<div class="example">"${escHtml(example)}"</div>` : ''}
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


// ── 10-day word/question repetition tracker ──────────────────────
// Stores seen items per game with timestamps; filters them out for
// at least 10 days before allowing them to appear again.
const REPEAT_KEY_PREFIX = 'seen_';
const REPEAT_DAYS = 10;

function markSeen(game, item) {
  const key  = REPEAT_KEY_PREFIX + game;
  const now  = Date.now();
  let data;
  try { data = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) { data = {}; }
  data[String(item)] = now;
  // Prune old entries (> 30 days) to keep storage small
  for (const k in data) {
    if (now - data[k] > 30 * 86400000) delete data[k];
  }
  try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
}

function wasSeen(game, item) {
  const key  = REPEAT_KEY_PREFIX + game;
  const now  = Date.now();
  let data;
  try { data = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) { return false; }
  const ts = data[String(item)];
  return ts && (now - ts < REPEAT_DAYS * 86400000);
}

// Returns a fresh daily index that avoids recently seen items.
// Falls back to pure dailyIndex if everything has been seen recently.
function freshDailyIndex(game, max) {
  const base = dailyIndex(max);
  for (let offset = 0; offset < max; offset++) {
    const idx = (base + offset) % max;
    if (!wasSeen(game, idx)) return idx;
  }
  return base; // all seen — just use today's
}

// Pick N unique fresh indices for a round
function freshIndices(game, bank, count) {
  const base  = dailyIndex(bank.length);
  const fresh = [];
  const fallback = [];
  for (let offset = 0; offset < bank.length; offset++) {
    const idx = (base + offset) % bank.length;
    if (!wasSeen(game, idx)) fresh.push(idx);
    else fallback.push(idx);
  }
  const pool = [...fresh, ...fallback];
  return pool.slice(0, count);
}


// ── True random helpers (not daily-seeded) ────────────────────────
// Use these when the request is "different every time the game is played"
// rather than "same all day, changes at midnight".
function randomIndex(max) {
  return Math.floor(Math.random() * max);
}

// Pick N unique random indices, avoiding recently-seen items (10-day rule)
// where possible, falling back to allow repeats only when the bank is small
// relative to count.
function freshRandomIndices(game, bank, count) {
  const all = bank.map((_, i) => i);
  // Shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const fresh = all.filter(i => !wasSeen(game, i));
  const seen  = all.filter(i => wasSeen(game, i));
  const pool  = [...fresh, ...seen];
  return pool.slice(0, count);
}

// Single fresh random index (avoids recently seen, falls back if all seen)
function freshRandomIndex(game, max) {
  const all = Array.from({length: max}, (_, i) => i);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  for (const idx of all) {
    if (!wasSeen(game, idx)) return idx;
  }
  return all[0]; // everything seen recently — just pick any
}

// ── Compact end-card pattern (non-blocking, like CollocationCrash/WordChain) ──
// Renders an inline summary card that does NOT cover the nav bar.
// Call this instead of building a full-screen overlay end card.
function renderCompactEndCard(containerEl, opts) {
  // opts: { title, scoreText, message, reviewItemsHtml, onPlayAgain, onSwitchMode, extraButtonsHtml }
  containerEl.innerHTML = `
    <div class="compact-end-card">
      <div class="eyebrow">${escHtml(opts.title || 'Round complete')}</div>
      <div class="compact-end-score">${escHtml(opts.scoreText || '')}</div>
      ${opts.message ? `<p class="compact-end-msg">${escHtml(opts.message)}</p>` : ''}
      ${opts.reviewItemsHtml ? `<div class="compact-review-grid">${opts.reviewItemsHtml}</div>` : ''}
      <div class="compact-submit-row">
        <input class="text-input compact-name-input" placeholder="Your name" maxlength="24"/>
        <button class="btn-primary compact-submit-btn">Add to leaderboard</button>
      </div>
      <div class="compact-end-actions">
        <button class="btn-ghost compact-play-again">Play again</button>
        ${opts.extraButtonsHtml || ''}
      </div>
    </div>`;
}
