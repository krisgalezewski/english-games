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

// ── Definition modal (uses Free Dictionary API) ───────────────────
function showDefinitionModal(word) {
  // Remove existing modal
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

  fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`)
    .then(r => r.json())
    .then(data => {
      const modal = overlay.querySelector('.def-modal');
      if (!Array.isArray(data) || !data[0]) {
        modal.querySelector('.pos').textContent = '';
        modal.querySelector('.definition').textContent = 'Definition not found.';
        return;
      }
      const entry  = data[0];
      const meaning = entry.meanings?.[0];
      const defObj  = meaning?.definitions?.[0];
      modal.querySelector('.pos').textContent = meaning?.partOfSpeech || '';
      modal.querySelector('.definition').textContent = defObj?.definition || 'No definition available.';
      if (defObj?.example) {
        const ex = document.createElement('div');
        ex.className = 'example';
        ex.textContent = `"${defObj.example}"`;
        modal.querySelector('.def-modal').appendChild(ex);
      }
    })
    .catch(() => {
      const modal = overlay.querySelector('.def-modal');
      modal.querySelector('.pos').textContent = '';
      modal.querySelector('.definition').textContent = 'Could not load definition.';
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

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
