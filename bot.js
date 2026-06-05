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
    const ADMIN_IDS = ['760539503211053057', '1406613103499677746', '1243137908613840958'];
    const ADMIN_ROLES = ['1493227708446937158', '1483019761091612815'];
    
    let hasAccess = false;
    const { user, member } = interaction;
    
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

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_delete_match') {
            const timestamp = parseInt(interaction.values[0]);
            
            await interaction.deferReply();
            try {
                const matchHistoryRef = ref(db, 'match_history');
                const playersRef = ref(db, 'players');
                const [matchSnapshot, playersSnapshot] = await Promise.all([get(matchHistoryRef), get(playersRef)]);
                
                if (!matchSnapshot.exists() || !playersSnapshot.exists()) return interaction.editReply('❌ Database error.');
                
                let matchHistory = matchSnapshot.val();
                matchHistory = Array.isArray(matchHistory) ? matchHistory : Object.values(matchHistory);
                
                const matchIndex = matchHistory.findIndex(m => m.timestamp === timestamp);
                if (matchIndex === -1) return interaction.editReply('❌ Match not found. It may have already been deleted.');
                
                const deletedMatch = matchHistory.splice(matchIndex, 1)[0];
                
                let players = playersSnapshot.val();
                players = Array.isArray(players) ? players : Object.values(players);
                
                const winnerIndex = players.findIndex(p => p.name.toLowerCase() === deletedMatch.winner.toLowerCase());
                const loserIndex = players.findIndex(p => p.name.toLowerCase() === deletedMatch.loser.toLowerCase());
                
                if (winnerIndex !== -1) {
                    players[winnerIndex].wins = Math.max(0, (players[winnerIndex].wins || 0) - 1);
                }
                if (loserIndex !== -1) {
                    players[loserIndex].losses = Math.max(0, (players[loserIndex].losses || 0) - 1);
                }
                
                await Promise.all([set(matchHistoryRef, matchHistory), set(playersRef, players)]);
                
                const delEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🗑️ Match Log Deleted & Stats Reverted')
                    .setDescription(`Deleted log: **${deletedMatch.winner}** vs **${deletedMatch.loser}** in **${deletedMatch.leaderboard}**.\n\n-1 Win for **${deletedMatch.winner}**\n-1 Loss for **${deletedMatch.loser}**`)
                    .setFooter({ text: 'Note: Win Streaks are not reverted automatically.' });
                    
                interaction.editReply({ content: '', embeds: [delEmbed], components: [] });
            } catch (error) {
                console.error(error);
                interaction.editReply('❌ Error deleting match.');
            }
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'peak') {
        const ign = options.getString('ign');
        const rank = options.getInteger('rank');
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
                players[playerIndex].peaks = players[playerIndex].peaks || {};
                players[playerIndex].peaks[leaderboard] = rank;
                
                await set(playersRef, players);
                
                const avatarUrl = `https://mc-heads.net/avatar/${ign}/200`;
                const peakEmbed = new EmbedBuilder()
                    .setColor('#FF00FF')
                    .setAuthor({ name: 'Ascension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                    .setTitle('✨ Peak Rank Set')
                    .setDescription(`**${ign}**'s peak rank in **${leaderboard.toUpperCase()}** is now set to **#${rank}**.`)
                    .setThumbnail(avatarUrl)
                    .addFields(
                        { name: 'Mode', value: `**${leaderboard.toUpperCase()}**`, inline: true },
                        { name: 'Peak Rank', value: `**#${rank}**`, inline: true }
                    )
                    .setFooter({ text: 'Ascension Bot • System Update' })
                    .setTimestamp();
                    
                interaction.editReply({ content: '', embeds: [peakEmbed] });
            } else {
                interaction.editReply(`⚠️ Player **${ign}** not found or no active rank in **${leaderboard}**.`);
            }
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
    }

    if (commandName === 'unpeak') {
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
            if (playerIndex !== -1 && players[playerIndex].peaks && players[playerIndex].peaks[leaderboard]) {
                delete players[playerIndex].peaks[leaderboard];
                
                await set(playersRef, players);
                
                const avatarUrl = `https://mc-heads.net/avatar/${ign}/200`;
                const unpeakEmbed = new EmbedBuilder()
                    .setColor('#FF00FF')
                    .setAuthor({ name: 'Ascension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                    .setTitle('🧹 Peak Rank Removed')
                    .setDescription(`**${ign}**'s peak rank in **${leaderboard.toUpperCase()}** has been removed.`)
                    .setThumbnail(avatarUrl)
                    .addFields(
                        { name: 'Mode', value: `**${leaderboard.toUpperCase()}**`, inline: true }
                    )
                    .setFooter({ text: 'Ascension Bot • System Update' })
                    .setTimestamp();
                    
                interaction.editReply({ content: '', embeds: [unpeakEmbed] });
            } else {
                interaction.editReply(`⚠️ Player **${ign}** does not have a peak rank in **${leaderboard}**.`);
            }
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
    }

    if (commandName === 'logmatch') {
        const player1 = options.getString('player1');
        const score1 = options.getInteger('score1');
        const player2 = options.getString('player2');
        const score2 = options.getInteger('score2');
        const leaderboard = options.getString('leaderboard');
        const action = options.getString('action'); // Promoted, Demoted, Stayed
        
        let winner = player1;
        let loser = player2;
        let scoreWinner = score1;
        let scoreLoser = score2;
        
        if (score2 > score1) {
            winner = player2;
            loser = player1;
            scoreWinner = score2;
            scoreLoser = score1;
        } else if (score1 === score2) {
            return interaction.reply({ content: '❌ A match cannot end in a draw.', ephemeral: true });
        }
        
        await interaction.deferReply();
        try {
            const playersRef = ref(db, 'players');
            const matchHistoryRef = ref(db, 'match_history');
            const [playersSnapshot, matchSnapshot] = await Promise.all([get(playersRef), get(matchHistoryRef)]);
            
            if (!playersSnapshot.exists()) return interaction.editReply('❌ Database is empty.');
            
            let players = playersSnapshot.val();
            players = Array.isArray(players) ? players : Object.values(players);
            players = players.filter(p => p && p.name && p.stats);

            // Find or create winner
            let winnerIndex = players.findIndex(p => p.name.toLowerCase() === winner.toLowerCase());
            if (winnerIndex === -1) {
                players.push({ name: winner, stats: {}, region: 'AS', wins: 0, losses: 0, streak: 0 });
                winnerIndex = players.length - 1;
            }
            
            // Find or create loser
            let loserIndex = players.findIndex(p => p.name.toLowerCase() === loser.toLowerCase());
            if (loserIndex === -1) {
                players.push({ name: loser, stats: {}, region: 'AS', wins: 0, losses: 0, streak: 0 });
                loserIndex = players.length - 1;
            }

            // Update Winner Stats
            players[winnerIndex].wins = (players[winnerIndex].wins || 0) + 1;
            players[winnerIndex].streak = (players[winnerIndex].streak || 0) + 1;

            // Update Loser Stats
            players[loserIndex].losses = (players[loserIndex].losses || 0) + 1;
            players[loserIndex].streak = 0; // Reset streak

            // Save players
            await set(playersRef, players);

            // Update Match History
            let matchHistory = [];
            if (matchSnapshot.exists()) {
                let data = matchSnapshot.val();
                matchHistory = Array.isArray(data) ? data : Object.values(data);
            }
            
            const newMatch = {
                timestamp: Date.now(),
                winner: players[winnerIndex].name,
                loser: players[loserIndex].name,
                scoreWinner: scoreWinner,
                scoreLoser: scoreLoser,
                leaderboard: leaderboard,
                action: action
            };
            
            matchHistory.unshift(newMatch);
            // Keep only last 50 matches to save space
            if (matchHistory.length > 50) matchHistory = matchHistory.slice(0, 50);
            
            await set(matchHistoryRef, matchHistory);

            const matchEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('⚔️ Match Result Logged')
                .setDescription(`**${players[winnerIndex].name}** (${scoreWinner}) defeated **${players[loserIndex].name}** (${scoreLoser}) in **${leaderboard.toUpperCase()}**!`)
                .addFields(
                    { name: 'Winner Stats', value: `Wins: ${players[winnerIndex].wins} | Streak: 🔥 ${players[winnerIndex].streak}`, inline: true },
                    { name: 'Loser Stats', value: `Losses: ${players[loserIndex].losses} | Streak: ❄️ 0`, inline: true },
                    { name: 'Result', value: `${action}`, inline: false }
                )
                .setFooter({ text: 'Ascension Bot • Match System' })
                .setTimestamp();

            interaction.editReply({ content: '', embeds: [matchEmbed] });
        } catch (error) {
            console.error(error);
            interaction.editReply('❌ Database error.');
        }
    }

    if (commandName === 'dellogmatch') {
        await interaction.deferReply();
        try {
            const matchHistoryRef = ref(db, 'match_history');
            const matchSnapshot = await get(matchHistoryRef);
            
            if (!matchSnapshot.exists()) return interaction.editReply('❌ No match history found.');
            
            let matchHistory = matchSnapshot.val();
            matchHistory = Array.isArray(matchHistory) ? matchHistory : Object.values(matchHistory);
            
            if (matchHistory.length === 0) return interaction.editReply('❌ No match history found.');
            
            // Get up to 25 matches for Discord select menu limit
            const recentMatches = matchHistory.slice(0, 25);
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_delete_match')
                .setPlaceholder('Select a match to delete and revert')
                .addOptions(recentMatches.map(m => {
                    let scoreText = (m.scoreWinner !== undefined && m.scoreLoser !== undefined) ? ` (${m.scoreWinner}-${m.scoreLoser})` : '';
                    const labelText = `${m.winner} vs ${m.loser}${scoreText}`;
                    
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(labelText.substring(0, 100))
                        .setDescription(`${m.leaderboard} - ${new Date(m.timestamp).toLocaleString()}`.substring(0, 100))
                        .setValue(m.timestamp.toString());
                }));
                
            const row = new ActionRowBuilder().addComponents(selectMenu);
            
            interaction.editReply({ content: '🗑️ **Select a match to delete**. This will also revert 1 Win/Loss.', components: [row] });
        } catch (error) {
            console.error(error);
            interaction.editReply('❌ Database error.');
        }
    }

    if (commandName === 'setstreak') {
        const ign = options.getString('ign');
        const amount = options.getInteger('amount');
        
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
                return interaction.editReply(`❌ Player **${ign}** not found in the database.`);
            }

            players[playerIndex].streak = amount;
            await set(playersRef, players);
            interaction.editReply(`✅ Set **${players[playerIndex].name}**'s streak to 🔥 **${amount}**.`);
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
    }

    if (commandName === 'addstreak') {
        const ign = options.getString('ign');
        const amount = options.getInteger('amount');
        
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
                return interaction.editReply(`❌ Player **${ign}** not found in the database.`);
            }

            players[playerIndex].streak = (players[playerIndex].streak || 0) + amount;
            await set(playersRef, players);
            interaction.editReply(`✅ Added ${amount} to **${players[playerIndex].name}**'s streak. Current streak is 🔥 **${players[playerIndex].streak}**.`);
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
    }

    if (commandName === 'setwinrate') {
        const ign = options.getString('ign');
        const percent = options.getInteger('percent');
        
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
                return interaction.editReply(`❌ Player **${ign}** not found in the database.`);
            }

            const totalMatches = (players[playerIndex].wins || 0) + (players[playerIndex].losses || 0);
            if (totalMatches === 0) {
                return interaction.editReply(`❌ **${players[playerIndex].name}** has 0 matches. Please set matches first or log a match.`);
            }

            const newWins = Math.round(totalMatches * (percent / 100));
            const newLosses = totalMatches - newWins;
            
            players[playerIndex].wins = newWins;
            players[playerIndex].losses = newLosses;
            
            await set(playersRef, players);
            
            interaction.editReply(`✅ Set **${players[playerIndex].name}**'s win rate to **${percent}%**. (Wins: ${newWins}, Losses: ${newLosses})`);
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
    }

    if (commandName === 'setmatch') {
        const ign = options.getString('ign');
        const amount = options.getInteger('amount');
        
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
                return interaction.editReply(`❌ Player **${ign}** not found in the database.`);
            }

            const totalMatches = (players[playerIndex].wins || 0) + (players[playerIndex].losses || 0);
            let currentWinRate = totalMatches > 0 ? (players[playerIndex].wins / totalMatches) : 1; // Default to 100% if 0 matches
            
            const newWins = Math.round(amount * currentWinRate);
            const newLosses = amount - newWins;

            players[playerIndex].wins = newWins;
            players[playerIndex].losses = newLosses;
            
            await set(playersRef, players);
            
            interaction.editReply(`✅ Set **${players[playerIndex].name}**'s total matches to **${amount}**. (Wins: ${newWins}, Losses: ${newLosses})`);
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
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
            // Rank shifting removed to allow multiple players per rank
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
                .setAuthor({ name: 'Ascension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                .setTitle('✅ Player Updated')
                .setThumbnail(avatarUrl)
                .addFields(
                    { name: 'IGN', value: `**${ign}**`, inline: true },
                    { name: 'Region', value: `${region}`, inline: true },
                    { name: 'Leaderboard', value: `**${leaderboard.toUpperCase()}**`, inline: true },
                    { name: 'New Rank', value: `**#${position}**`, inline: true }
                )
                .setFooter({ text: 'Ascension Bot • System Update' })
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
                .setAuthor({ name: 'Ascension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                .setTitle('🗑️ Player Deleted')
                .setDescription(`The player **\`${ign}\`** has been completely removed from all leaderboards.`)
                .setThumbnail(`https://mc-heads.net/avatar/${ign}/200`)
                .setFooter({ text: 'Ascension Bot • System Update' })
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
                if (players[playerIndex].peaks && players[playerIndex].peaks[leaderboard]) {
                    delete players[playerIndex].peaks[leaderboard];
                }
                
                players = players.filter(p => Object.keys(p.stats).length > 0);
                await set(playersRef, players);
                
                const avatarUrl = `https://mc-heads.net/avatar/${ign}/200`;
                const removeEmbed = new EmbedBuilder()
                    .setColor('#E67E22')
                    .setAuthor({ name: 'Ascension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                    .setTitle('🔻 Rank Removed')
                    .setDescription(`The rank for **${leaderboard.toUpperCase()}** has been removed.`)
                    .setThumbnail(avatarUrl)
                    .addFields({ name: 'Player', value: `**\`${ign}\`**`, inline: true })
                    .setFooter({ text: 'Ascension Bot • System Update' })
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
                        .setAuthor({ name: 'Ascension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                        .setTitle('💤 Player Retired')
                        .setDescription(`**${ign}** is now RETIRED in **${leaderboard.toUpperCase()}**.`)
                        .setThumbnail(avatarUrl)
                        .addFields(
                            { name: 'Mode', value: `**${leaderboard.toUpperCase()}**`, inline: true },
                            { name: 'Locked Rank', value: `**R#${currentRank}**`, inline: true }
                        )
                        .setFooter({ text: 'Ascension Bot • System Update' })
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

    if (commandName === 'unretire') {
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
                if (typeof currentRank === 'string' && currentRank.startsWith('r')) {
                    let unretiredRank = parseInt(currentRank.substring(1));
                    players[playerIndex].stats[leaderboard] = unretiredRank;
                    await set(playersRef, players);
                    
                    const avatarUrl = `https://mc-heads.net/avatar/${ign}/200`;
                    const unretireEmbed = new EmbedBuilder()
                        .setColor('#F1C40F')
                        .setAuthor({ name: 'Ascension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                        .setTitle('✨ Player Unretired')
                        .setDescription(`**${ign}** is now UNRETIRED in **${leaderboard.toUpperCase()}**.`)
                        .setThumbnail(avatarUrl)
                        .addFields(
                            { name: 'Mode', value: `**${leaderboard.toUpperCase()}**`, inline: true },
                            { name: 'Restored Rank', value: `**#${unretiredRank}**`, inline: true }
                        )
                        .setFooter({ text: 'Ascension Bot • System Update' })
                        .setTimestamp();
                        
                    interaction.editReply({ content: '', embeds: [unretireEmbed] });
                } else {
                    interaction.editReply(`⚠️ Player is not retired in this mode.`);
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
            // Rank shifting removed to allow multiple players per rank

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
                .setAuthor({ name: 'Ascension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                .setTitle('⬆️ Player Promoted')
                .setThumbnail(avatarUrl)
                .setDescription(`**\`${ign}\`** was PROMOTED to **#${newRank}** in **${leaderboard.toUpperCase()}**.`)
                .setFooter({ text: 'Ascension Bot • System Update' })
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
                
                // Rank shifting removed to allow multiple players per rank

                players[pIndex].stats[leaderboard] = newRank;
                players = players.filter(p => Object.keys(p.stats).length > 0);
                await set(playersRef, players);
                const avatarUrl = `https://mc-heads.net/avatar/${ign}/200`;
                const embed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setAuthor({ name: 'Ascension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                    .setTitle('⬇️ Player Demoted')
                    .setThumbnail(avatarUrl)
                    .setDescription(`**\`${ign}\`** was DEMOTED to **#${newRank}** in **${leaderboard.toUpperCase()}**.`)
                    .setFooter({ text: 'Ascension Bot • System Update' })
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
                    // Player won against someone with a better rank
                    let newRank = oRank;
                    rankUpdateText = `Promoted to **#${newRank}** ⬆️`;
                    
                    if (oRank < 5) oppRankUpdateText = `Demoted to **#${oRank + 1}** ⬇️`;
                    else oppRankUpdateText = `Demoted off leaderboard ⬇️`;

                } else if (status === 'Won' && pRank === null && oppIndex !== -1 && oRank !== null) {
                    // Player won against someone but was unranked
                    let newRank = oRank;
                    rankUpdateText = `Promoted to **#${newRank}** ⬆️`;

                    if (oRank < 5) oppRankUpdateText = `Demoted to **#${oRank + 1}** ⬇️`;
                    else oppRankUpdateText = `Demoted off leaderboard ⬇️`;

                } else {
                    rankUpdateText = `No rank change`;
                    oppRankUpdateText = `No rank change`;
                }
            }
        } catch(e) {
            console.error('Database fetch error on /results', e);
        }

        const avatarUrl = `https://mc-heads.net/avatar/${player}/200`;
        const resultText = `${playerScore}-${opponentScore}`;
        const lbName = leaderboard.charAt(0).toUpperCase() + leaderboard.slice(1);

        const combinedEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({ name: 'Ascension Rank Match', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
            .setTitle(`${statusEmoji} Match Result: ${player} vs ${opponent}`)
            .setThumbnail(avatarUrl)
            .addFields(
                { name: 'Score', value: `> **${playerScore} - ${opponentScore}**`, inline: false },
                { name: `🟦 \`${player}\``, value: `Region: **${region}**\nRank: **${currentRank}** (${lbName})\n> ${rankUpdateText}`, inline: true },
                { name: `🟥 \`${opponent}\``, value: `Region: **${oppRegion}**\nRank: **${oppCurrentRank}** (${lbName})\n> ${oppRankUpdateText}`, inline: true }
            )
            .setFooter({ text: 'Ascension Bot • Match Update' })
            .setTimestamp();

        await interaction.editReply({ content: '', embeds: [combinedEmbed] });
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
                    .setAuthor({ name: 'Ascension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                    .setTitle('🌍 Region Changed')
                    .setThumbnail(avatarUrl)
                    .addFields(
                        { name: 'Player', value: `**\`${players[playerIndex].name}\`**`, inline: true },
                        { name: 'Old Region', value: `**${oldRegion}**`, inline: true },
                        { name: 'New Region', value: `**${region}**`, inline: true }
                    )
                    .setFooter({ text: 'Ascension Bot • System Update' })
                    .setTimestamp();
                interaction.editReply({ content: '', embeds: [embed] });
            } else {
                interaction.editReply(`⚠️ **${player}** not found in the database.`);
            }
        } catch (error) {
            interaction.editReply('❌ Database error.');
        }
    }
    if (commandName === 'customprofile') {
        const ign = options.getString('ign');
        const color = options.getString('color');
        const imageUrl = options.getString('image_url');
        const borderColor = options.getString('border_color');
        const effect = options.getString('effect');
        
        if (!color && !imageUrl && !borderColor && !effect) {
            return interaction.reply({ content: '❌ You must provide at least a background color, an image URL, a border color, or a particle effect.', ephemeral: true });
        }
        
        const background = imageUrl || color;

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

            let playerIndex = players.findIndex(p => p.name.toLowerCase() === ign.toLowerCase());
            
            if (playerIndex !== -1) {
                if (background) {
                    if (background === 'reset' || background === '#0d1117') {
                        delete players[playerIndex].background;
                    } else {
                        players[playerIndex].background = background;
                    }
                }
                
                if (borderColor) {
                    if (borderColor === 'reset') {
                        delete players[playerIndex].border;
                    } else {
                        players[playerIndex].border = borderColor;
                    }
                }
                
                if (effect) {
                    if (effect === 'reset') {
                        delete players[playerIndex].effect;
                    } else {
                        players[playerIndex].effect = effect;
                    }
                }
                
                await set(playersRef, players);
                
                const embed = new EmbedBuilder()
                    .setTitle('🎨 Custom Profile Updated!')
                    .setDescription(`**${players[playerIndex].name}**'s profile styling has been updated.`)
                    .setColor('#00e5ff');

                return interaction.editReply({ embeds: [embed] });
            } else {
                return interaction.editReply(`❌ Player **${ign}** not found in the database.`);
            }
        } catch (error) {
            console.error(error);
            return interaction.editReply('❌ An error occurred while updating the profile background.');
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
                    .setAuthor({ name: 'Ascension Leaderboard', iconURL: 'https://i.postimg.cc/j5B1nLhX/Silver-Arrow-Emblem-with-Wings-removebg-preview.png' })
                    .setTitle('🏷️ Name Changed')
                    .setThumbnail(avatarUrl)
                    .addFields(
                        { name: 'Old Name', value: `**\`${actualOldName}\`**`, inline: true },
                        { name: 'New Name', value: `**\`${newName}\`**`, inline: true }
                    )
                    .setFooter({ text: 'Ascension Bot • System Update' })
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
