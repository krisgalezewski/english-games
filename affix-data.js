// Affix Climber content — edit the word lists freely, no game-code changes needed.
//
// real:  finished words, uppercase.
// fake:  "affix|root" — the game builds the word (un- + big = UNBIG) and uses the
//        pair for the after-slip hint ("un- doesn't attach to big").
window.AFFIX_LEVELS = [
  {
    name: "Level 1",
    affixes: ["un-", "re-", "-ful", "-less"],
    real: ["UNKIND", "UNFAIR", "UNLOCK", "UNHAPPY", "UNABLE", "UNPACK",
           "REHEAT", "REBUILD", "REPLAY", "RETURN", "REWRITE", "REFILL",
           "HELPFUL", "HOPEFUL", "CAREFUL", "PAINFUL", "USEFUL", "PLAYFUL",
           "HARMLESS", "CARELESS", "ENDLESS", "HOPELESS", "RESTLESS", "PAINLESS"],
    fake: ["un-|big", "un-|sad", "un-|fast", "un-|strong", "un-|green", "un-|loud",
           "re-|happy", "re-|kind", "re-|tall", "re-|green", "re-|sad", "re-|small",
           "-ful|book", "-ful|tree", "-ful|run", "-ful|chair", "-ful|table", "-ful|road",
           "-less|eat", "-less|big", "-less|green", "-less|walk", "-less|chair", "-less|loud"]
  },
  {
    name: "Level 2",
    affixes: ["dis-", "mis-", "-ness", "-ly"],
    real: ["DISLIKE", "DISAGREE", "DISHONEST", "DISAPPEAR", "DISOBEY", "DISCOVER",
           "MISREAD", "MISLEAD", "MISTAKE", "MISPLACE", "MISJUDGE", "MISSPELL",
           "KINDNESS", "DARKNESS", "SADNESS", "WEAKNESS", "ILLNESS", "FITNESS",
           "QUICKLY", "SLOWLY", "BADLY", "LOUDLY", "SAFELY", "RARELY"],
    fake: ["dis-|big", "dis-|walk", "dis-|fast", "dis-|happy", "dis-|green", "dis-|table",
           "mis-|big", "mis-|happy", "mis-|small", "mis-|green", "mis-|loud", "mis-|chair",
           "-ness|run", "-ness|eat", "-ness|table", "-ness|book", "-ness|walk", "-ness|chair",
           "-ly|tree", "-ly|book", "-ly|chair", "-ly|apple", "-ly|road", "-ly|window"]
  },
  {
    name: "Level 3",
    affixes: ["pre-", "over-", "-able", "-ment"],
    real: ["PREVIEW", "PREPAY", "PREHEAT", "PREPARE", "PRESCHOOL", "PREDICT",
           "OVERCOOK", "OVERLOAD", "OVERSLEEP", "OVERHEAR", "OVERTAKE", "OVERFLOW",
           "READABLE", "BREAKABLE", "WASHABLE", "ENJOYABLE", "AFFORDABLE", "REMARKABLE",
           "MOVEMENT", "PAYMENT", "STATEMENT", "AGREEMENT", "ARGUMENT", "TREATMENT"],
    fake: ["pre-|big", "pre-|sad", "pre-|walk", "pre-|green", "pre-|table", "pre-|loud",
           "over-|big", "over-|sad", "over-|green", "over-|table", "over-|chair", "over-|road",
           "-able|tree", "-able|chair", "-able|road", "-able|green", "-able|window", "-able|apple",
           "-ment|eat", "-ment|big", "-ment|green", "-ment|chair", "-ment|walk", "-ment|loud"]
  }
];
