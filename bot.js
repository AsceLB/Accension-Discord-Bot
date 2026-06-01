require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set } = require('firebase/database');
const { getAuth, signInAnonymously } = require('firebase/auth');
const http = require('http');

// Auto-register slash commands on startup
require('./register-commands.js');

// Keep-alive server for Render.com
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Discord Bot is alive!');
}).listen(process.env.PORT || 3000);

// Firebase Setup
const firebaseConfig = {
    apiKey: 'AIzaSyDOJq7SNRIMDHY8p1R8wbmjjj89-FpP4GE',
    databaseURL: 'https://accension-leaderboard-default-rtdb.asia-southeast1.firebasedatabase.app/'
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Discord Bot Setup
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`Bot is online as ${client.user.tag}!`);
    try {
        await signInAnonymously(auth);
        console.log("Connected to Firebase Database!");
    } catch (error) {
        console.error("Firebase connection error:", error);
    }
});

// Function to calculate title based on points
function getTitle(points) {
    if (points >= 80) return 'Combat Grandmaster';
    if (points >= 50) return 'Combat Master';
    if (points >= 30) return 'Combat Ace';
    if (points >= 15) return 'Combat Specialist';
    if (points >= 10) return 'Combat Cadet';
    if (points >= 5) return 'Combat Novice';
    return 'Rookie';
}

const POSITION_POINTS = { 1: 10, 2: 7, 3: 5, 4: 3, 5: 1 };

function getPlayerTotalPoints(player) {
    let total = 0;
    for (const [lb, rank] of Object.entries(player.stats || {})) {
        if (typeof rank === 'number' && lb !== 'overall' && POSITION_POINTS[rank]) {
            total += POSITION_POINTS[rank];
        }
    }
    return total;
}

// Function to build multiple leaderboard Embeds
async function buildLeaderboardMessage() {
    const playersRef = ref(db, 'players');
    const snapshot = await get(playersRef);
    let players = [];
    if (snapshot.exists()) {
        const data = snapshot.val();
        players = Array.isArray(data) ? data : Object.values(data);
    }
    players = players.filter(p => p && p.name && p.stats);

    const categories = [
        { id: 'sword', name: 'Sword', color: '#55FFFF', icon: 'sword.png' },
        { id: 'nethop', name: 'Netherite Potion', color: '#1a051d', icon: 'nethop.png' },
        { id: 'pot', name: 'Potion', color: '#ff7f7f', icon: 'pot.png' },
        { id: 'uhc', name: 'UHC', color: '#cc0000', icon: 'uhc.png' },
        { id: 'axe', name: 'Axe', color: '#c19a6b', icon: 'axe.png' },
        { id: 'mace', name: 'Mace', color: '#7f96a3', icon: 'mace.png' },
        { id: 'vanilla', name: 'Vanilla', color: '#9b59b6', icon: 'vanilla.png' },
        { id: 'smp', name: 'SMP', color: '#0b666a', icon: 'smp.png' }
    ];

    const embeds = [];
    const files = [];

    for (const cat of categories) {
        let sortedPlayers = players
            .filter(p => typeof p.stats[cat.id] === 'number')
            .sort((a, b) => a.stats[cat.id] - b.stats[cat.id]);

        const iconPath = path.join(__dirname, 'icons', cat.icon);
        const attachment = new AttachmentBuilder(iconPath, { name: cat.icon });
        files.push(attachment);

        const embed = new EmbedBuilder()
            .setColor(cat.color)
            .setTitle(cat.name)
            .setThumbnail(`attachment://${cat.icon}`);

        let desc = '';
        for (let i = 1; i <= 5; i++) {
            const player = sortedPlayers.find(p => p.stats[cat.id] === i);
            if (player) {
                desc += `- **#${i}** **${player.name}**\n`;
            } else {
                desc += `- **#${i}** **N/A**\n`;
            }
        }
        embed.setDescription(desc);
        embeds.push(embed);
    }
    
    return { content: '🏆 **Leaderboard Of Ascension** 🏆', embeds: embeds, files: files, components: [] };
}

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const ADMIN_IDS = ['760539503211053057', '1406613103499677746', '1243137908613840958'];
    const { commandName, options } = interaction;

    // All commands require admin
    if (!ADMIN_IDS.includes(interaction.user.id)) {
        return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này.', ephemeral: true });
    }

    if (commandName === 'leaderboard') {
        await interaction.deferReply();
        try {
            const messagePayload = await buildLeaderboardMessage('overall');
            await interaction.editReply(messagePayload);
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Error fetching leaderboard.');
        }
        return;
    }

    if (commandName === 'add') {
        const ign = options.getString('ign');
        const leaderboard = options.getString('leaderboard');
        const position = options.getInteger('position');
        const region = options.getString('region') || 'AS'; // Mặc định là AS nếu không điền

        await interaction.deferReply();

        try {
            const playersRef = ref(db, 'players');
            const snapshot = await get(playersRef);
            let players = [];
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                players = Array.isArray(data) ? data : Object.values(data);
                players = players.filter(p => p && p.name && p.stats);
            }

            let playerIndex = players.findIndex(p => p.name.toLowerCase() === ign.toLowerCase());
            let oldRank = (playerIndex !== -1 && typeof players[playerIndex].stats[leaderboard] === 'number') 
                          ? players[playerIndex].stats[leaderboard] : 999;
            
            players.forEach(p => {
                let r = p.stats[leaderboard];
                if (typeof r === 'number') {
                    if (r >= position && r < oldRank) {
                        if (r < 5) p.stats[leaderboard] = r + 1;
                        else delete p.stats[leaderboard];
                    }
                }
            });
            players = players.filter(p => Object.keys(p.stats).length > 0);
            
            playerIndex = players.findIndex(p => p.name.toLowerCase() === ign.toLowerCase());
            if (playerIndex !== -1) {
                players[playerIndex].stats[leaderboard] = position;
                if (options.getString('region')) players[playerIndex].region = region;
            } else {
                players.push({ name: ign, region: region, stats: { [leaderboard]: position } });
            }

            await set(playersRef, players);
            
            const avatarUrl = `https://mc-heads.net/avatar/${ign}/200`;
            const addEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Player Updated')
                .setThumbnail(avatarUrl)
                .addFields(
                    { name: 'IGN', value: `**${ign}**`, inline: true },
                    { name: 'Region', value: `${region}`, inline: true },
                    { name: 'Leaderboard', value: `**${leaderboard.toUpperCase()}**`, inline: true },
                    { name: 'New Rank', value: `**#${position}**`, inline: true }
                )
                .setTimestamp();
                
            await interaction.editReply({ content: '', embeds: [addEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Error saving to Database.');
        }
    }

    if (commandName === 'delete') {
        const ign = options.getString('ign');

        await interaction.deferReply();

        try {
            const playersRef = ref(db, 'players');
            const snapshot = await get(playersRef);
            
            if (!snapshot.exists()) {
                return interaction.editReply('❌ Database is empty.');
            }

            const data = snapshot.val();
            let players = Array.isArray(data) ? data : Object.values(data);
            players = players.filter(p => p && p.name && p.stats);

            const initialLength = players.length;
            players = players.filter(p => p.name.toLowerCase() !== ign.toLowerCase());

            if (players.length === initialLength) {
                return interaction.editReply(`⚠️ Could not find a player named **${ign}** in the system.`);
            }

            await set(playersRef, players);
            
            const delEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setAuthor({ name: 'Accension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                .setTitle('🗑️ Player Deleted')
                .setDescription(`The player **\`${ign}\`** has been completely removed from all leaderboards.`)
                .setThumbnail(`https://mc-heads.net/avatar/${ign}/200`)
                .setFooter({ text: 'Accension Bot • System Update' })
                .setTimestamp();
                
            await interaction.editReply({ content: '', embeds: [delEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Error deleting from Database.');
        }
    }
    if (commandName === 'removerank') {
        const ign = options.getString('ign');
        const leaderboard = options.getString('leaderboard');
        
        await interaction.deferReply();
        try {
            const playersRef = ref(db, 'players');
            const snapshot = await get(playersRef);
            if (!snapshot.exists()) return interaction.editReply('❌ Database is empty.');
            
            let players = snapshot.val();
            players = Array.isArray(players) ? players : Object.values(players);
            players = players.filter(p => p && p.name && p.stats);

            let playerIndex = players.findIndex(p => p.name.toLowerCase() === ign.toLowerCase());
            if (playerIndex === -1) {
                return interaction.editReply(`⚠️ Player **${ign}** not found.`);
            }

            if (players[playerIndex].stats[leaderboard]) {
                delete players[playerIndex].stats[leaderboard];
                if (Object.keys(players[playerIndex].stats).length === 0) {
                    players.splice(playerIndex, 1);
                }
                await set(playersRef, players);
                interaction.editReply(`✅ Removed **${leaderboard}** rank from **${ign}**.`);
            } else {
                interaction.editReply(`⚠️ Player **${ign}** doesn't have a rank in **${leaderboard}**.`);
            }
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
    }

    if (commandName === 'retire') {
        const ign = options.getString('ign');
        const leaderboard = options.getString('leaderboard');
        
        await interaction.deferReply();
        try {
            const playersRef = ref(db, 'players');
            const snapshot = await get(playersRef);
            if (!snapshot.exists()) return interaction.editReply('❌ Database is empty.');
            
            let players = snapshot.val();
            players = Array.isArray(players) ? players : Object.values(players);
            players = players.filter(p => p && p.name && p.stats);

            let playerIndex = players.findIndex(p => p.name.toLowerCase() === ign.toLowerCase());
            if (playerIndex !== -1 && players[playerIndex].stats[leaderboard]) {
                let currentRank = players[playerIndex].stats[leaderboard];
                if (typeof currentRank === 'number') {
                    players[playerIndex].stats[leaderboard] = 'r' + currentRank;
                    await set(playersRef, players);
                    interaction.editReply(`✅ **${ign}** is now RETIRED in **${leaderboard}** at rank #r${currentRank}.`);
                } else {
                    interaction.editReply(`⚠️ Player is already retired in this mode.`);
                }
            } else {
                interaction.editReply(`⚠️ Player **${ign}** not found or no active rank in **${leaderboard}**.`);
            }
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
    }

    if (commandName === 'promote') {
        const ign = options.getString('ign');
        const leaderboard = options.getString('leaderboard');
        const newRank = options.getInteger('rank');
        
        await interaction.deferReply();
        try {
            const playersRef = ref(db, 'players');
            const snapshot = await get(playersRef);
            let players = snapshot.exists() ? snapshot.val() : [];
            players = Array.isArray(players) ? players : Object.values(players);
            players = players.filter(p => p && p.name && p.stats);

            let pIndex = players.findIndex(p => p.name.toLowerCase() === ign.toLowerCase());
            let oldRank = (pIndex !== -1 && typeof players[pIndex].stats[leaderboard] === 'number') 
                          ? players[pIndex].stats[leaderboard] : 999;

            // Shift active players down
            players.forEach(p => {
                let r = p.stats[leaderboard];
                if (typeof r === 'number') {
                    if (r >= newRank && r < oldRank) {
                        if (r < 5) {
                            p.stats[leaderboard] = r + 1;
                        } else {
                            delete p.stats[leaderboard];
                        }
                    }
                }
            });

            // Clean up players with empty stats
            players = players.filter(p => Object.keys(p.stats).length > 0);

            // Assign new rank
            pIndex = players.findIndex(p => p.name.toLowerCase() === ign.toLowerCase());
            if (pIndex !== -1) {
                players[pIndex].stats[leaderboard] = newRank;
            } else {
                players.push({ name: ign, region: 'AS', stats: { [leaderboard]: newRank } });
            }

            await set(playersRef, players);
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('⬆️ Player Promoted')
                .setDescription(`**${ign}** was PROMOTED to **#${newRank}** in **${leaderboard}**. Existing players shifted down!`);
            interaction.editReply({ content: '', embeds: [embed] });
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
    }

    if (commandName === 'demote') {
        const ign = options.getString('ign');
        const leaderboard = options.getString('leaderboard');
        const newRank = options.getInteger('rank');
        
        await interaction.deferReply();
        try {
            const playersRef = ref(db, 'players');
            const snapshot = await get(playersRef);
            let players = snapshot.exists() ? snapshot.val() : [];
            players = Array.isArray(players) ? players : Object.values(players);
            players = players.filter(p => p && p.name && p.stats);

            let pIndex = players.findIndex(p => p.name.toLowerCase() === ign.toLowerCase());
            if (pIndex !== -1 && typeof players[pIndex].stats[leaderboard] === 'number') {
                let oldRank = players[pIndex].stats[leaderboard];
                
                // Shift active players up
                players.forEach(p => {
                    let r = p.stats[leaderboard];
                    if (typeof r === 'number') {
                        if (r > oldRank && r <= newRank) {
                            p.stats[leaderboard] = r - 1;
                        }
                    }
                });

                players[pIndex].stats[leaderboard] = newRank;
                
                await set(playersRef, players);
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('⬇️ Player Demoted')
                    .setDescription(`**${ign}** was DEMOTED to **#${newRank}** in **${leaderboard}**. Existing players shifted up!`);
                interaction.editReply({ content: '', embeds: [embed] });
            } else {
                interaction.editReply(`⚠️ **${ign}** is not active in **${leaderboard}** or does not exist.`);
            }
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
    }
    if (commandName === 'results') {
        const player = options.getString('player');
        const opponent = options.getString('opponent');
        const playerScore = options.getInteger('player_score');
        const opponentScore = options.getInteger('opponent_score');
        const leaderboard = options.getString('leaderboard');
        const status = options.getString('status');
        const rank = options.getInteger('rank');
        const region = options.getString('region') || 'AS';

        await interaction.deferReply();

        let embedColor = '#F1C40F'; // Maintained - Yellow
        let statusEmoji = '➖';
        if (status.includes('Promoted')) { embedColor = '#2ECC71'; statusEmoji = '📈'; }
        else if (status.includes('Demoted')) { embedColor = '#E74C3C'; statusEmoji = '📉'; }

        // Update player in database if Promoted or Demoted
        try {
            if (status.includes('Promoted') || status.includes('Demoted')) {
                const playersRef = ref(db, 'players');
                const snapshot = await get(playersRef);
                let players = [];
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    players = Array.isArray(data) ? data : Object.values(data);
                    players = players.filter(p => p && p.name && p.stats);
                }
                
                let playerIndex = players.findIndex(p => p.name.toLowerCase() === player.toLowerCase());
                let oldRank = (playerIndex !== -1 && typeof players[playerIndex].stats[leaderboard] === 'number') 
                              ? players[playerIndex].stats[leaderboard] : 999;
                
                if (status.includes('Promoted') || oldRank === 999) {
                    players.forEach(p => {
                        let r = p.stats[leaderboard];
                        if (typeof r === 'number') {
                            if (r >= rank && r < oldRank) {
                                if (r < 5) p.stats[leaderboard] = r + 1;
                                else delete p.stats[leaderboard];
                            }
                        }
                    });
                } else if (status.includes('Demoted')) {
                    players.forEach(p => {
                        let r = p.stats[leaderboard];
                        if (typeof r === 'number') {
                            if (r > oldRank && r <= rank) {
                                p.stats[leaderboard] = r - 1;
                            }
                        }
                    });
                }
                players = players.filter(p => Object.keys(p.stats).length > 0);
                
                playerIndex = players.findIndex(p => p.name.toLowerCase() === player.toLowerCase());
                if (playerIndex !== -1) {
                    players[playerIndex].stats[leaderboard] = rank;
                    if (region) players[playerIndex].region = region;
                } else {
                    players.push({ name: player, region: region, stats: { [leaderboard]: rank } });
                }
                await set(playersRef, players);
            }
        } catch(e) {
            console.error('Database update error on /results', e);
        }

        const avatarUrl = `https://mc-heads.net/avatar/${player}/200`;
        const resultText = `${playerScore}-${opponentScore}`;
        const verb = playerScore > opponentScore ? 'Won' : (playerScore < opponentScore ? 'Lost' : 'Tied');
        const lbName = leaderboard.charAt(0).toUpperCase() + leaderboard.slice(1);

        const resultEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({ name: 'Accension Rank Match', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
            .setTitle(`${statusEmoji} ${status} #${rank} ${lbName}`)
            .setThumbnail(avatarUrl)
            .addFields(
                { name: 'Player', value: `**\`${player}\`**`, inline: true },
                { name: 'Region', value: `**${region}**`, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: 'Match Result', value: `> **${verb}** ${resultText} vs **\`${opponent}\`**`, inline: false }
            )
            .setFooter({ text: 'Accension Bot • Match Update' })
            .setTimestamp();

        await interaction.editReply({ content: '', embeds: [resultEmbed] });
    }
    if (commandName === 'changeregion') {
        const player = options.getString('player');
        const region = options.getString('region').toUpperCase();

        await interaction.deferReply();
        try {
            const playersRef = ref(db, 'players');
            const snapshot = await get(playersRef);
            if (!snapshot.exists()) {
                return interaction.editReply('❌ Database is empty.');
            }

            let players = snapshot.val();
            players = Array.isArray(players) ? players : Object.values(players);
            players = players.filter(p => p && p.name && p.stats);

            let playerIndex = players.findIndex(p => p.name.toLowerCase() === player.toLowerCase());
            if (playerIndex !== -1) {
                const oldRegion = players[playerIndex].region || 'AS';
                players[playerIndex].region = region;
                await set(playersRef, players);
                
                const embed = new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle('🌍 Region Changed')
                    .setDescription(`**${players[playerIndex].name}**'s region was changed from **${oldRegion}** to **${region}**.`);
                interaction.editReply({ content: '', embeds: [embed] });
            } else {
                interaction.editReply(`⚠️ **${player}** not found in the database.`);
            }
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
    }
    if (commandName === 'changename') {
        const oldName = options.getString('oldname');
        const newName = options.getString('newname');

        await interaction.deferReply();
        try {
            const playersRef = ref(db, 'players');
            const snapshot = await get(playersRef);
            if (!snapshot.exists()) {
                return interaction.editReply('❌ Database is empty.');
            }

            let players = snapshot.val();
            players = Array.isArray(players) ? players : Object.values(players);
            players = players.filter(p => p && p.name && p.stats);

            let playerIndex = players.findIndex(p => p.name.toLowerCase() === oldName.toLowerCase());
            let newNameExists = players.some(p => p.name.toLowerCase() === newName.toLowerCase());
            
            if (newNameExists) {
                return interaction.editReply(`⚠️ Player **${newName}** already exists in the database.`);
            }

            if (playerIndex !== -1) {
                const actualOldName = players[playerIndex].name;
                players[playerIndex].name = newName;
                await set(playersRef, players);
                
                const embed = new EmbedBuilder()
                    .setColor('#9B59B6')
                    .setTitle('✏️ Name Changed')
                    .setDescription(`Player **${actualOldName}** has been renamed to **${newName}**.`);
                interaction.editReply({ content: '', embeds: [embed] });
            } else {
                interaction.editReply(`⚠️ **${oldName}** not found in the database.`);
            }
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
