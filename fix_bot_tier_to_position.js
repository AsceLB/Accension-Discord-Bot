const fs = require('fs');
let code = fs.readFileSync('bot.js', 'utf8');

// Replace tier definitions with position
code = code.replace(/const tier = options\.getString\('tier'\)\.toUpperCase\(\);/g, 'const position = options.getInteger(\'position\');');
code = code.replace(/const tier = options\.getString\('tier'\);/g, 'const position = options.getInteger(\'position\');');

// Replace usages
code = code.replace(/stats: \{ \[leaderboard\]: tier \}/g, 'stats: { [leaderboard]: position }');
code = code.replace(/players\[playerIndex\]\.stats\[leaderboard\] = tier;/g, 'players[playerIndex].stats[leaderboard] = position;');
code = code.replace(/New Tier/g, 'New Rank');
code = code.replace(/\*\*`\$\{tier\}`\*\*/g, '**#${position}**');
code = code.replace(/\*\*\$\{tier\}\*\*/g, '**#${position}**');
code = code.replace(/Tier: \*\*\$\{tier\}\*\*/g, 'Rank: **#${position}**');

fs.writeFileSync('bot.js', code);
console.log('Bot fixed!');
