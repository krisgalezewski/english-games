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

// ── Welcome-screen "more instructions" inline expander ──────────────
// Shared by every game's welcome-screen hero tile. Expects the standard
// #instrToggle / #instrToggleLabel / #instrWrap ids (see styles.css for
// the .instr-toggle/.instr-wrap/.instr-inner rules it drives).
function toggleInstructions() {
  const wrap = document.getElementById('instrWrap');
  const btn = document.getElementById('instrToggle');
  const label = document.getElementById('instrToggleLabel');
  if (!wrap || !btn) return;
  const open = wrap.classList.toggle('open');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (label) label.textContent = open ? 'Less instructions' : 'More instructions';
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

// True random shuffle — produces a different order every single call,
// unlike dailyShuffle which is seeded by date and stays fixed all day.
// Use this for anything that should look different every time the player
// plays, even within the same day (e.g. answer option ordering).
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
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
  const area = document.getElementById(submitAreaId);
  // Guard against double-submission (rapid double-click/double-tap firing
  // this twice before the first request resolves, which would otherwise
  // post the same score to the leaderboard more than once).
  const controls = area ? [...area.querySelectorAll('button, input')] : [];
  if (controls.some(el => el.disabled)) return; // a submit is already in flight
  controls.forEach(el => el.disabled = true);
  const ok = await submitScore(game, name, score);
  if (area) {
    if (ok) {
      area.innerHTML = `<p class="eg-eyebrow" style="color:var(--correct)">✓ Score submitted!</p>`;
    } else {
      // Keep the name + button so the player can retry instead of losing
      // their input on a transient network failure.
      controls.forEach(el => el.disabled = false);
      let msg = area.querySelector('.submit-error-msg');
      if (!msg) {
        msg = document.createElement('p');
        msg.className = 'eg-eyebrow submit-error-msg';
        msg.style.cssText = 'color:var(--wrong);width:100%;margin-top:6px;';
        area.appendChild(msg);
      }
      msg.textContent = '✗ Submission failed — check your connection';
    }
  }
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
  let exampleHtml = '';
  if (example) {
    const lines = String(example).split('\n').filter(l => l.trim());
    exampleHtml = lines.map(l => `<div class="example">"${escHtml(l)}"</div>`).join('');
  }
  overlay.innerHTML = `
    <div class="def-modal fade-in">
      <button class="close-btn" onclick="this.closest('.def-modal-overlay').remove()">✕</button>
      <h3>${escHtml(word)}</h3>
      ${pos ? `<div class="pos">${escHtml(pos)}</div>` : ''}
      <div class="definition">${escHtml(definition)}</div>
      ${exampleHtml}
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

// ── Arcade touch gestures ──────────────────────────────────────────
// Shared swipe/tap handler for the motion games (WordSnake, WordDrop,
// English Ace). Two things it does that a naive touchstart/touchend swipe
// doesn't:
//  1. Direction is evaluated continuously as the finger moves, not just once
//     on release, so a single unbroken drag that changes direction (e.g. up
//     then right) fires onDirection more than once — no need to lift and
//     re-swipe — and each segment reports the moment it crosses the
//     threshold, which is what makes steering feel immediate.
//  2. Tap vs double-tap is disambiguated with a short timer, the same way a
//     browser tells a click from a dblclick: a lone tap fires onTap after
//     `doubleTapMs` (only if onDoubleTap is registered — otherwise it fires
//     immediately, since there's nothing to disambiguate against), while a
//     second tap inside that window near the first fires onDoubleTap and
//     cancels the pending onTap.
// Pointer Events cover mouse, touch and pen in one listener; onDirection is
// harmless to also receive from a mouse drag, and games that only want
// touch behaviour can ignore the callback when e.pointerType === 'mouse'.
function bindArcadeTouch(el, opts) {
  if (!el) return;
  const {
    onDirection,       // (dx, dy) — one of dx/dy is 0, the other is -1 or 1
    onTap,              // () => void
    onDoubleTap,        // () => void
    threshold = 24,     // px of drag per direction segment (small = snappier)
    tapSlop = 14,        // px — total movement still small enough to count as a tap
    doubleTapMs = 320,
  } = opts || {};

  let active = false, moved = false;
  let startX = 0, startY = 0, lastX = 0, lastY = 0;
  let lastTapTime = 0, lastTapX = 0, lastTapY = 0, tapTimer = null;

  el.addEventListener('pointerdown', e => {
    active = true; moved = false;
    startX = lastX = e.clientX; startY = lastY = e.clientY;
  });

  el.addEventListener('pointermove', e => {
    if (!active || !onDirection) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
    moved = true;
    if (Math.abs(dx) > Math.abs(dy)) onDirection(dx > 0 ? 1 : -1, 0);
    else onDirection(0, dy > 0 ? 1 : -1);
    // Reset the baseline to the current point (not the gesture start) so a
    // long continuous drag keeps firing one direction call per threshold
    // crossed, in whichever direction the finger is currently moving.
    lastX = e.clientX; lastY = e.clientY;
  });

  const end = e => {
    if (!active) return;
    active = false;
    const totalDx = e.clientX - startX, totalDy = e.clientY - startY;
    if (moved || Math.abs(totalDx) > tapSlop || Math.abs(totalDy) > tapSlop) return;
    if (!onTap && !onDoubleTap) return;
    const now = performance.now();
    if (onDoubleTap && now - lastTapTime < doubleTapMs &&
        Math.abs(e.clientX - lastTapX) < 40 && Math.abs(e.clientY - lastTapY) < 40) {
      clearTimeout(tapTimer); tapTimer = null;
      lastTapTime = 0;
      onDoubleTap();
      return;
    }
    lastTapTime = now; lastTapX = e.clientX; lastTapY = e.clientY;
    if (onDoubleTap) {
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { tapTimer = null; onTap && onTap(); }, doubleTapMs);
    } else {
      onTap();
    }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', () => { active = false; });
}

// ── Rotate-to-landscape hint ───────────────────────────────────────
// Non-blocking suggestion (never a hard gate) for the two motion games that
// most benefit from landscape width on a phone (WordSnake, English Ace).
// Inserts a dismissible .eg-rotate-hint strip into `container` while the
// device is a portrait touch screen, and hides it automatically once the
// player rotates (CSS also hides it outright on hover-capable/fine-pointer
// devices, i.e. desktop, so this only ever shows on a phone/tablet).
function initRotateHint(container) {
  if (!container || !window.matchMedia) return;
  const coarse = window.matchMedia('(pointer:coarse)');
  const portrait = window.matchMedia('(orientation:portrait)');
  if (!coarse.matches) return;
  let dismissed = false;
  const el = document.createElement('div');
  el.className = 'eg-rotate-hint';
  el.innerHTML = `<span class="eg-rotate-hint__icon" aria-hidden="true">🔄</span><span class="eg-rotate-hint__text">Turn your phone sideways — the full board needs the extra width!</span><button type="button" class="eg-rotate-hint__close" aria-label="Dismiss">✕</button>`;
  el.querySelector('.eg-rotate-hint__close').onclick = () => { dismissed = true; sync(); };
  container.prepend(el);
  function sync() { el.style.display = (!dismissed && portrait.matches) ? 'flex' : 'none'; }
  portrait.addEventListener ? portrait.addEventListener('change', sync) : portrait.addListener(sync);
  sync();
}

// ── Best-effort fullscreen + landscape lock ────────────────────────
// Tries to take the game fullscreen and lock the screen to landscape when
// the player rotates their phone. Many mobile browsers refuse this outside
// a direct user-gesture handler (orientationchange doesn't always count),
// so every step is wrapped so a refusal is silent — the game must stay
// fully playable in landscape even when fullscreen/lock never happens.
function tryEnterLandscapeFullscreen(el) {
  el = el || document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  const already = document.fullscreenElement || document.webkitFullscreenElement;
  const lockLandscape = () => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch(e) {}
  };
  if (already) { lockLandscape(); return; }
  if (!req) return;
  try {
    const p = req.call(el);
    if (p && p.then) p.then(lockLandscape).catch(() => {});
    else lockLandscape();
  } catch(e) {}
}

// Wires the above to fire once, best-effort, whenever this phone is rotated
// into landscape while `isActive()` says the game is actually in play.
function bindAutoLandscapeFullscreen(isActive) {
  if (!window.matchMedia) return;
  const landscape = window.matchMedia('(orientation:landscape)');
  const coarse = window.matchMedia('(pointer:coarse)');
  const attempt = () => {
    if (coarse.matches && landscape.matches && (!isActive || isActive())) tryEnterLandscapeFullscreen();
  };
  landscape.addEventListener ? landscape.addEventListener('change', attempt) : landscape.addListener(attempt);
}

// ── Ready gate: "tap / press any key to start" ─────────────────────
// Games used to start moving the instant the player left the intro screen,
// which meant they had to rotate/scroll/settle the viewport *while* the
// snake was already crawling or the plane already flying. This gates the
// actual start of motion behind one more beat: it drops a dismiss-by-any-
// input overlay onto `hostEl` (which must already be position:relative or
// position:absolute so the overlay can cover it), scrolls `hostEl` to the
// center of the viewport so the whole board/field is on screen without the
// player having to scroll, and calls `onReady()` exactly once — on tap/
// click of the overlay (mobile) or the first keydown anywhere (desktop).
// Call this AFTER all one-time per-run setup (state reset, first draw) but
// BEFORE anything that starts a timer/rAF loop/spawn cadence — `onReady`
// is where that motion-starting code belongs.
//
// If a player backs out to the intro screen (or otherwise starts a new run)
// without ever dismissing a previous gate, that old overlay/listener would
// otherwise be orphaned — still in the DOM, still listening — and a second
// call would stack a duplicate on top of it. A single module-level handle
// tracks the one outstanding gate so a new call always tears down any
// undismissed previous one first.
let __readyGateActive = null;
function armReadyGate(hostEl, onReady) {
  if (__readyGateActive) {
    try { __readyGateActive.overlay.remove(); } catch(e) {}
    document.removeEventListener('keydown', __readyGateActive.onKey, true);
    __readyGateActive = null;
  }
  if (!hostEl || !onReady) { onReady && onReady(); return; }
  const overlay = document.createElement('div');
  overlay.className = 'eg-ready-gate';
  overlay.innerHTML =
    '<div class="eg-ready-gate__card">' +
      '<span class="eg-ready-gate__tap">Tap to start</span>' +
      '<span class="eg-ready-gate__key">Press any key to start</span>' +
    '</div>';
  hostEl.appendChild(overlay);

  // Let the now-visible game phase lay out for a frame first — scrolling
  // while it (or an ancestor) is still display:none/mid-transition no-ops.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try { hostEl.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' }); } catch(e) {}
    });
  });

  function fire() {
    if (__readyGateActive !== state) return; // already torn down/superseded
    __readyGateActive = null;
    overlay.remove();
    document.removeEventListener('keydown', onKey, true);
    onReady();
  }
  function onKey(e) {
    // Ignore bare modifier presses so e.g. a stray Shift doesn't start it.
    if (['Shift','Control','Alt','Meta','CapsLock','Tab'].indexOf(e.key) !== -1) return;
    fire();
  }
  overlay.addEventListener('click', fire);
  document.addEventListener('keydown', onKey, true);
  const state = { overlay, onKey };
  __readyGateActive = state;
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
