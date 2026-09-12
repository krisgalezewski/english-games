/* ==========================================================================
   game-of-the-week.js
   Date-driven rotation. No manual edit needed each Monday.

   Usage in index.html:
     <a id="gotw" class="eg-tile eg-tile--teal-deep" href="#"> ... </a>
     <script src="game-of-the-week.js"><\/script>

   The rotation is deterministic: it depends only on the ISO week number, so
   every student sees the same game, and it repeats every 14 weeks.
   ========================================================================== */

const EG_GAMES = [
  { slug: 'wordsnake',        title: 'WordSnake',              tag: 'Vocabulary',           blurb: 'Steer your snake to collect scattered letters in order and spell real words. Bank a word to score and reset, or push your luck for something longer.' },
  { slug: 'worddrop',         title: 'WordDrop',               tag: 'Grammar',              blurb: 'Words fall from their sentences — steer each one into the correct part of speech before it lands. New categories unlock every 5 rounds.' },
  { slug: 'wordrunner',       title: 'Affix Runner',           tag: 'Affixes',              blurb: 'Jump to collect words with correct affixes, duck to dodge the wrong ones. Master prefixes and suffixes across 10 rounds.' },
  { slug: 'englishace',       title: 'English Ace',            tag: 'Action',               blurb: 'Fly your plane into correct answers, dodge the wrong ones. Collocations, spelling, phrasal verbs — under fire.' },
  { slug: 'conditionals',     title: 'Conditional Constructor',tag: 'Grammar',              blurb: 'Drag the correct THEN clause to complete conditional sentences — four levels from beginner to expert with inversion.' },
  { slug: 'verbsprint',       title: 'Irregular Verb Sprint',  tag: 'Verbs',                blurb: 'Type both forms of irregular verbs against the clock — three modes from structured drilling to full sentence completion.' },
  { slug: 'synonyms',         title: 'WordSpark',              tag: 'Vocabulary',           blurb: 'Find synonyms, find antonyms, or type them — three ways to build your vocabulary under pressure.' },
  { slug: 'phrasalblitz',     title: 'PhrasalBlitz',           tag: 'Phrasal verbs',        blurb: 'Pick particles, type them, or match pairs — three ways to master phrasal verbs under pressure.' },
  { slug: 'spellit',          title: 'SpellIt!',               tag: 'Spelling',             blurb: 'Read the definition, type the word. English spelling is famously tricky — how far can your streak go?' },
  { slug: 'collocationcrash', title: 'CollocationCrash',       tag: 'Collocations',         blurb: 'Which verb goes with which noun? Master the word partnerships that separate good English from great English.' },
  { slug: 'wordchain',        title: 'WordChain',              tag: 'Word chain',           blurb: 'Each word must start with the last letter of the previous one. Build the longest chain you can.' },
  { slug: 'anagram',          title: 'Anagram',                tag: 'Anagram',              blurb: 'Read the definition, then unscramble the letters to find the word. Race against the clock across 8 words.' },
  { slug: 'wordbuilder',      title: 'Word Builder',           tag: 'Word builder',         blurb: 'Given a set of letters, make as many words as you can before time runs out. Longer words score more.' },
  { slug: 'dictationdrill',   title: 'Dictation Drill',        tag: 'Listening',            blurb: 'Listen, then type exactly what you hear. Minimal pairs, tricky spelling, connected speech and full sentences — train your ear.' }
];

/** ISO-8601 week number (weeks start Monday). */
function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));       // shift to Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function gameOfTheWeek(date = new Date()) {
  const week = isoWeek(date);
  return { week, game: EG_GAMES[week % EG_GAMES.length] };
}

/** Fills the #gotw tile. Expects [data-gotw="title|tag|blurb|week"] inside it. */
function renderGameOfTheWeek(root = document.getElementById('gotw')) {
  if (!root) return;
  const { week, game } = gameOfTheWeek();
  root.href = game.slug + '.html';
  const set = (key, value) => {
    const el = root.querySelector('[data-gotw="' + key + '"]');
    if (el) el.textContent = value;
  };
  set('title', game.title);
  set('tag',   game.tag);
  set('blurb', game.blurb);
  set('week',  'Week ' + week);
  // Artwork: each game's motif lives in an inline <svg> with id "art-<slug>",
  // hidden by default. Show the one matching this week's game.
  // Note: use toggleAttribute rather than the `.hidden` IDL property — SVG
  // elements don't reliably reflect `.hidden` to the attribute in every
  // browser, which would silently leave every motif hidden (or all shown).
  root.querySelectorAll('[data-gotw-art]').forEach(el => {
    el.toggleAttribute('hidden', el.dataset.gotwArt !== game.slug);
  });
}

document.addEventListener('DOMContentLoaded', () => renderGameOfTheWeek());
