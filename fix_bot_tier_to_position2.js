const fs = require('fs');
let code = fs.readFileSync('bot.js', 'utf8');

// Replace tier with position in peak command
code = code.replace(/peaks\[leaderboard\] = tier;/g, 'peaks[leaderboard] = position;');
code = code.replace(/peaks\[leaderboard\] = tier.toUpperCase\(\);/g, 'peaks[leaderboard] = position;');

fs.writeFileSync('bot.js', code);
console.log('Peak fixed!');
