require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set } = require('firebase/database');
const { getAuth, signInAnonymously } = require('firebase/auth');

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

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

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

            // Tìm player xem đã có chưa
            let playerIndex = players.findIndex(p => p.name.toLowerCase() === ign.toLowerCase());
            
            if (playerIndex !== -1) {
                // Cập nhật người chơi đã có
                players[playerIndex].stats[leaderboard] = position;
                // Nếu họ nhập region mới thì cập nhật luôn
                if (options.getString('region')) {
                    players[playerIndex].region = region;
                }
            } else {
                // Thêm người chơi mới
                let newPlayer = {
                    name: ign, // Giữ nguyên case do user nhập
                    region: region,
                    stats: {}
                };
                newPlayer.stats[leaderboard] = position;
                players.push(newPlayer);
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
                .setColor('#FF0000')
                .setTitle('🗑️ Player Deleted')
                .setDescription(`Completely removed player **${ign}** from the Leaderboard!`)
                .setTimestamp();
                
            await interaction.editReply({ content: '', embeds: [delEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Error deleting from Database.');
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

        let color = '#FFFF00'; // Maintained
        if (status.includes('Promoted')) color = '#00FF00'; // Promoted
        else if (status.includes('Demoted')) color = '#FF0000'; // Demoted

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
                if (playerIndex !== -1) {
                    players[playerIndex].stats[leaderboard] = rank;
                    if (region) players[playerIndex].region = region;
                } else {
                    let newPlayer = { name: player, region: region, stats: {} };
                    newPlayer.stats[leaderboard] = rank;
                    players.push(newPlayer);
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
            .setColor(color)
            .setAuthor({ name: `@${player} | ${region}`, iconURL: avatarUrl })
            .setDescription(`- **${player}** - ${status} **#${rank} ${lbName}**\n\n**Rank Fights:**\n> ${verb} ${resultText} vs ${opponent}`)
            .setTimestamp();

        await interaction.editReply({ content: '', embeds: [resultEmbed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
