const fs = require('fs');
let code = fs.readFileSync('register-commands.js', 'utf8');

// Regex to match the tier option block
const regex = /\.addStringOption\(option =>\s*option\.setName\('tier'\)\s*\.setDescription\('[^']*'\)\s*\.setRequired\(true\)\s*\.addChoices\([\s\S]*?\)\)/g;

code = code.replace(regex, `.addIntegerOption(option => 
            option.setName('position')
                .setDescription('Rank Position (e.g. 1, 2, 3)')
                .setRequired(true)
                .setMinValue(1))`);

fs.writeFileSync('register-commands.js', code);
console.log('Done!');
