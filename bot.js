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
    const ADMIN_ROLES = ['1493227708446937158', '1483019761091612815'];
    const { commandName, options, user, member } = interaction;

    let hasAccess = false;
    
    // Check User ID
    if (user && ADMIN_IDS.includes(user.id)) {
        hasAccess = true;
    }
    
    // Check Roles (only works if used inside a server/guild)
    if (!hasAccess && member && member.roles && member.roles.cache) {
        if (member.roles.cache.some(role => ADMIN_ROLES.includes(role.id))) {
            hasAccess = true;
        }
    }

    if (!hasAccess) {
        return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
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
        const region = options.getString('region') || 'AS'; // Default to AS if not provided

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
                .setAuthor({ name: 'Accension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                .setTitle('✅ Player Updated')
                .setThumbnail(avatarUrl)
                .addFields(
                    { name: 'IGN', value: `**${ign}**`, inline: true },
                    { name: 'Region', value: `${region}`, inline: true },
                    { name: 'Leaderboard', value: `**${leaderboard.toUpperCase()}**`, inline: true },
                    { name: 'New Rank', value: `**#${position}**`, inline: true }
                )
                .setFooter({ text: 'Accension Bot • System Update' })
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
                
                players = players.filter(p => Object.keys(p.stats).length > 0);
                await set(playersRef, players);
                
                const avatarUrl = `https://mc-heads.net/avatar/${ign}/200`;
                const removeEmbed = new EmbedBuilder()
                    .setColor('#E67E22')
                    .setAuthor({ name: 'Accension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                    .setTitle('🔻 Rank Removed')
                    .setDescription(`The rank for **${leaderboard.toUpperCase()}** has been removed.`)
                    .setThumbnail(avatarUrl)
                    .addFields({ name: 'Player', value: `**\`${ign}\`**`, inline: true })
                    .setFooter({ text: 'Accension Bot • System Update' })
                    .setTimestamp();
                    
                interaction.editReply({ content: '', embeds: [removeEmbed] });
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
                    
                    const avatarUrl = `https://mc-heads.net/avatar/${ign}/200`;
                    const retireEmbed = new EmbedBuilder()
                        .setColor('#95A5A6')
                        .setAuthor({ name: 'Accension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                        .setTitle('💤 Player Retired')
                        .setDescription(`**${ign}** is now RETIRED in **${leaderboard.toUpperCase()}**.`)
                        .setThumbnail(avatarUrl)
                        .addFields(
                            { name: 'Mode', value: `**${leaderboard.toUpperCase()}**`, inline: true },
                            { name: 'Locked Rank', value: `**#r${currentRank}**`, inline: true }
                        )
                        .setFooter({ text: 'Accension Bot • System Update' })
                        .setTimestamp();
                        
                    interaction.editReply({ content: '', embeds: [retireEmbed] });
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
            const avatarUrl = `https://mc-heads.net/avatar/${ign}/200`;
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setAuthor({ name: 'Accension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                .setTitle('⬆️ Player Promoted')
                .setThumbnail(avatarUrl)
                .setDescription(`**\`${ign}\`** was PROMOTED to **#${newRank}** in **${leaderboard.toUpperCase()}**.\n> Existing players shifted down!`)
                .setFooter({ text: 'Accension Bot • System Update' })
                .setTimestamp();
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

                players = players.filter(p => Object.keys(p.stats).length > 0);
                await set(playersRef, players);
                const avatarUrl = `https://mc-heads.net/avatar/${ign}/200`;
                const embed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setAuthor({ name: 'Accension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                    .setTitle('⬇️ Player Demoted')
                    .setThumbnail(avatarUrl)
                    .setDescription(`**\`${ign}\`** was DEMOTED to **#${newRank}** in **${leaderboard.toUpperCase()}**.\n> Existing players shifted up!`)
                    .setFooter({ text: 'Accension Bot • System Update' })
                    .setTimestamp();
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
        const region = options.getString('region') || 'AS';

        await interaction.deferReply();

        let embedColor = '#F1C40F'; // Tied - Yellow
        let status = 'Tied';
        let statusEmoji = '➖';
        let verb = 'Tied';

        if (playerScore > opponentScore) { 
            embedColor = '#2ECC71'; 
            status = 'Won';
            statusEmoji = '📈'; 
            verb = 'Won';
        } else if (playerScore < opponentScore) { 
            embedColor = '#E74C3C'; 
            status = 'Lost';
            statusEmoji = '📉'; 
            verb = 'Lost';
        }

        // Fetch players from database
        let currentRank = 'Unranked';
        let rankUpdateText = 'No Change';
        let oppCurrentRank = 'Unranked';
        let oppRankUpdateText = 'No Change';
        let oppRegion = 'AS'; // Default if not found

        try {
            const playersRef = ref(db, 'players');
            const snapshot = await get(playersRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                let players = Array.isArray(data) ? data : Object.values(data);
                players = players.filter(p => p && p.name && p.stats);
                
                const playerIndex = players.findIndex(p => p.name.toLowerCase() === player.toLowerCase());
                const oppIndex = players.findIndex(p => p.name.toLowerCase() === opponent.toLowerCase());

                let pRank = (playerIndex !== -1 && typeof players[playerIndex].stats[leaderboard] === 'number') ? players[playerIndex].stats[leaderboard] : null;
                let oRank = (oppIndex !== -1 && typeof players[oppIndex].stats[leaderboard] === 'number') ? players[oppIndex].stats[leaderboard] : null;

                if (pRank !== null) currentRank = `#${pRank}`;
                if (oRank !== null) oppCurrentRank = `#${oRank}`;
                if (oppIndex !== -1 && players[oppIndex].region) oppRegion = players[oppIndex].region;

                if (status === 'Won' && oppIndex !== -1 && oRank !== null && pRank !== null && oRank < pRank) {
                    // Player won against someone with a better rank -> Promote to their rank
                    let oldRank = pRank;
                    let newRank = oRank;
                    
                    // Shift active players down
                    players.forEach(p => {
                        let r = p.stats[leaderboard];
                        if (typeof r === 'number') {
                            if (r >= newRank && r < oldRank) {
                                if (r < 5) p.stats[leaderboard] = r + 1;
                                else delete p.stats[leaderboard];
                            }
                        }
                    });
                    
                    players[playerIndex].stats[leaderboard] = newRank;
                    rankUpdateText = `Promoted to **#${newRank}** ⬆️`;
                    
                    // Opponent was shifted down
                    if (oRank < 5) oppRankUpdateText = `Demoted to **#${oRank + 1}** ⬇️`;
                    else oppRankUpdateText = `Demoted off leaderboard ⬇️`;

                    // Cleanup and Save
                    players = players.filter(p => Object.keys(p.stats).length > 0);
                    await set(playersRef, players);
                } else if (status === 'Won' && pRank === null && oppIndex !== -1 && oRank !== null) {
                    // Player won against someone but was unranked -> Promote to their rank
                    let oldRank = 999;
                    let newRank = oRank;
                    
                    // Shift active players down
                    players.forEach(p => {
                        let r = p.stats[leaderboard];
                        if (typeof r === 'number') {
                            if (r >= newRank && r < oldRank) {
                                if (r < 5) p.stats[leaderboard] = r + 1;
                                else delete p.stats[leaderboard];
                            }
                        }
                    });
                    
                    players[playerIndex].stats[leaderboard] = newRank;
                    rankUpdateText = `Promoted to **#${newRank}** ⬆️`;

                    if (oRank < 5) oppRankUpdateText = `Demoted to **#${oRank + 1}** ⬇️`;
                    else oppRankUpdateText = `Demoted off leaderboard ⬇️`;

                    players = players.filter(p => Object.keys(p.stats).length > 0);
                    await set(playersRef, players);
                } else {
                    rankUpdateText = `Manual update required (use /promote or /demote)`;
                    oppRankUpdateText = `Manual update required (use /promote or /demote)`;
                }
            }
        } catch(e) {
            console.error('Database fetch error on /results', e);
        }

        const avatarUrl = `https://mc-heads.net/avatar/${player}/200`;
        const resultText = `${playerScore}-${opponentScore}`;
        const lbName = leaderboard.charAt(0).toUpperCase() + leaderboard.slice(1);

        const resultEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({ name: 'Accension Rank Match', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
            .setTitle(`${statusEmoji} Match Result: ${status}`)
            .setThumbnail(avatarUrl)
            .addFields(
                { name: 'Player', value: `**\`${player}\`**`, inline: true },
                { name: 'Region', value: `**${region}**`, inline: true },
                { name: 'Current Rank', value: `**${currentRank}** (${lbName})`, inline: true },
                { name: 'Score', value: `> **${verb}** ${resultText} vs **\`${opponent}\`**`, inline: false },
                { name: 'Rank Update', value: `> ${rankUpdateText}`, inline: false }
            )
            .setFooter({ text: 'Accension Bot • Match Update' })
            .setTimestamp();

        // Prepare opponent status and embed
        let oppEmbedColor = '#F1C40F';
        let oppStatus = 'Tied';
        let oppStatusEmoji = '➖';
        let oppVerb = 'Tied';

        if (opponentScore > playerScore) { 
            oppEmbedColor = '#2ECC71'; 
            oppStatus = 'Won';
            oppStatusEmoji = '📈'; 
            oppVerb = 'Won';
        } else if (opponentScore < playerScore) { 
            oppEmbedColor = '#E74C3C'; 
            oppStatus = 'Lost';
            oppStatusEmoji = '📉'; 
            oppVerb = 'Lost';
        }

        const oppAvatarUrl = `https://mc-heads.net/avatar/${opponent}/200`;
        const oppResultText = `${opponentScore}-${playerScore}`;

        const oppEmbed = new EmbedBuilder()
            .setColor(oppEmbedColor)
            .setAuthor({ name: 'Accension Rank Match', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
            .setTitle(`${oppStatusEmoji} Match Result: ${oppStatus}`)
            .setThumbnail(oppAvatarUrl)
            .addFields(
                { name: 'Player', value: `**\`${opponent}\`**`, inline: true },
                { name: 'Region', value: `**${oppRegion}**`, inline: true },
                { name: 'Current Rank', value: `**${oppCurrentRank}** (${lbName})`, inline: true },
                { name: 'Score', value: `> **${oppVerb}** ${oppResultText} vs **\`${player}\`**`, inline: false },
                { name: 'Rank Update', value: `> ${oppRankUpdateText}`, inline: false }
            )
            .setFooter({ text: 'Accension Bot • Match Update' })
            .setTimestamp();

        await interaction.editReply({ content: '', embeds: [resultEmbed, oppEmbed] });
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
                
                const avatarUrl = `https://mc-heads.net/avatar/${players[playerIndex].name}/200`;
                const embed = new EmbedBuilder()
                    .setColor('#3498DB')
                    .setAuthor({ name: 'Accension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                    .setTitle('🌍 Region Changed')
                    .setThumbnail(avatarUrl)
                    .addFields(
                        { name: 'Player', value: `**\`${players[playerIndex].name}\`**`, inline: true },
                        { name: 'Old Region', value: `**${oldRegion}**`, inline: true },
                        { name: 'New Region', value: `**${region}**`, inline: true }
                    )
                    .setFooter({ text: 'Accension Bot • System Update' })
                    .setTimestamp();
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
                players = players.filter(p => Object.keys(p.stats).length > 0);
                await set(playersRef, players);
                
                const avatarUrl = `https://mc-heads.net/avatar/${newName}/200`;
                const embed = new EmbedBuilder()
                    .setColor('#9B59B6')
                    .setAuthor({ name: 'Accension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                    .setTitle('🏷️ Name Changed')
                    .setThumbnail(avatarUrl)
                    .addFields(
                        { name: 'Old Name', value: `**\`${actualOldName}\`**`, inline: true },
                        { name: 'New Name', value: `**\`${newName}\`**`, inline: true }
                    )
                    .setFooter({ text: 'Accension Bot • System Update' })
                    .setTimestamp();
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
