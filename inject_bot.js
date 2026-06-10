const fs = require('fs');
let botJs = fs.readFileSync('bot.js', 'utf8');

const injectionCode = `
    if (commandName === 'roster') {
        const subcommand = options.getSubcommand();
        const tier = options.getString('tier').toUpperCase();
        const name = options.getString('name');

        if (subcommand === 'add') {
            await set(ref(db, \`roster/\${tier}/\${name}\`), true);
            await interaction.reply({ content: \`✅ Added **\${name}** to **\${tier}**.\`, ephemeral: true });
        } else if (subcommand === 'remove') {
            await set(ref(db, \`roster/\${tier}/\${name}\`), null);
            await interaction.reply({ content: \`✅ Removed **\${name}** from **\${tier}**.\`, ephemeral: true });
        }
    }

    if (commandName === 'leadership') {
        const subcommand = options.getSubcommand();
        const name = options.getString('name');

        if (subcommand === 'add') {
            const role = options.getString('role');
            await set(ref(db, \`leadership/\${name}\`), { role });
            await interaction.reply({ content: \`✅ Added **\${name}** as **\${role}** to Leadership.\`, ephemeral: true });
        } else if (subcommand === 'remove') {
            await set(ref(db, \`leadership/\${name}\`), null);
            await interaction.reply({ content: \`✅ Removed **\${name}** from Leadership.\`, ephemeral: true });
        }
    }
});`;

botJs = botJs.replace(/}\s*\}\s*\n\}\);\s*\nclient\.login\(process\.env\.DISCORD_TOKEN\);/, `}
    }
${injectionCode}

client.login(process.env.DISCORD_TOKEN);`);

fs.writeFileSync('bot.js', botJs);
console.log('Injected bot.js successfully.');
