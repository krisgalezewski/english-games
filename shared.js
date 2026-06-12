// shared supabase config — used by all games
const SUPABASE_URL = 'https://mumvnjyiupzvmcoatwye.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bXZuanlpdXB6dm1jb2F0d3llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODEzMDMsImV4cCI6MjA5Njg1NzMwM30.JgMQRDkIvGFUvKR_Iwoo91zaPdd5urNig8yc0g0oMRk';

async function submitScore(game, playerName, score) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ game, player_name: playerName, score })
  });
  return res.ok;
}

async function getLeaderboard(game, limit = 10) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/leaderboard?game=eq.${encodeURIComponent(game)}&order=score.desc&limit=${limit}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );
  if (!res.ok) return [];
  return res.json();
}

// Returns a stable number 0..max-1 for a given date — used for daily word selection
function dailyIndex(max) {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  // simple LCG
  return ((seed * 1664525 + 1013904223) & 0x7fffffff) % max;
}
