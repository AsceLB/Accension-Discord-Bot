require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('add')
        .setDescription("Add or update a player's rank.")
        .addStringOption(option => 
            option.setName('ign')
                .setDescription('In-Game Name (IGN)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('leaderboard')
                .setDescription('Select Leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'sword' },
                    { name: 'Axe', value: 'axe' },
                    { name: 'Mace', value: 'mace' },
                    { name: 'UHC', value: 'uhc' },
                    { name: 'Vanilla', value: 'vanilla' },
                    { name: 'Pot', value: 'pot' },
                    { name: 'Nethpot', value: 'nethop' },
                    { name: 'SMP', value: 'smp' }
                ))
        .addStringOption(option => 
            option.setName('tier')
                .setDescription('Tier (e.g. HT1, LT2, Tier 4)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('region')
                .setDescription('Region (Default: AS)')
                .setRequired(false)
                .addChoices(
                    { name: 'AS', value: 'AS' },
                    { name: 'NA', value: 'NA' },
                    { name: 'EU', value: 'EU' }
                )),
                
    new SlashCommandBuilder()
        .setName('addmulti')
        .setDescription("Add or update multiple players' ranks at once.")
        .addStringOption(option => 
            option.setName('igns')
                .setDescription('Comma-separated list of IGNs (e.g. Player1, Player2)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('leaderboard')
                .setDescription('Select Leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'sword' },
                    { name: 'Axe', value: 'axe' },
                    { name: 'Mace', value: 'mace' },
                    { name: 'UHC', value: 'uhc' },
                    { name: 'Vanilla', value: 'vanilla' },
                    { name: 'Pot', value: 'pot' },
                    { name: 'Nethpot', value: 'nethop' },
                    { name: 'SMP', value: 'smp' }
                ))
        .addStringOption(option => 
            option.setName('tier')
                .setDescription('Tier (e.g. HT1, LT2, Tier 4)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('region')
                .setDescription('Region (Default: AS)')
                .setRequired(false)
                .addChoices(
                    { name: 'AS', value: 'AS' },
                    { name: 'NA', value: 'NA' },
                    { name: 'EU', value: 'EU' }
                )),
                
    new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Completely remove a player from the system.')
        .addStringOption(option => 
            option.setName('ign')
                .setDescription('The IGN to delete')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('deletemulti')
        .setDescription('Completely remove multiple players from the system.')
        .addStringOption(option => 
            option.setName('igns')
                .setDescription('Comma-separated list of IGNs to delete')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('results')
        .setDescription('Announce a match result.')
        .addStringOption(option => 
            option.setName('player')
                .setDescription("Main player's IGN")
                .setRequired(true))
        .addStringOption(option => 
            option.setName('opponent')
                .setDescription("Opponent's IGN")
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('player_score')
                .setDescription("Main player's score")
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('opponent_score')
                .setDescription("Opponent's score")
                .setRequired(true))
        .addStringOption(option => 
            option.setName('leaderboard')
                .setDescription('Game mode')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'sword' },
                    { name: 'Axe', value: 'axe' },
                    { name: 'Mace', value: 'mace' },
                    { name: 'UHC', value: 'uhc' },
                    { name: 'Vanilla', value: 'vanilla' },
                    { name: 'Pot', value: 'pot' },
                    { name: 'Nethpot', value: 'nethop' },
                    { name: 'SMP', value: 'smp' }
                ))

        .addStringOption(option => 
            option.setName('region')
                .setDescription('Region (e.g., AS)')
                .setRequired(false)),
                
    
    new SlashCommandBuilder()
        .setName('setup_leaderboard')
        .setDescription('Create a self-updating Leaderboard Panel in this channel.'),

    new SlashCommandBuilder()
        .setName('removerank')
        .setDescription('Remove a specific rank from a player.')
        .addStringOption(option => 
            option.setName('ign')
                .setDescription('The IGN to update')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('leaderboard')
                .setDescription('Select Leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'sword' },
                    { name: 'Axe', value: 'axe' },
                    { name: 'Mace', value: 'mace' },
                    { name: 'UHC', value: 'uhc' },
                    { name: 'Vanilla', value: 'vanilla' },
                    { name: 'Pot', value: 'pot' },
                    { name: 'Nethpot', value: 'nethop' },
                    { name: 'SMP', value: 'smp' }
                )),
                
    new SlashCommandBuilder()
        .setName('retire')
        .setDescription('Mark a player\'s rank as Retired (r#X).')
        .addStringOption(option => 
            option.setName('ign')
                .setDescription('The IGN to update')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('leaderboard')
                .setDescription('Select Leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'sword' },
                    { name: 'Axe', value: 'axe' },
                    { name: 'Mace', value: 'mace' },
                    { name: 'UHC', value: 'uhc' },
                    { name: 'Vanilla', value: 'vanilla' },
                    { name: 'Pot', value: 'pot' },
                )),

    new SlashCommandBuilder()
        .setName('promote')
        .setDescription('Promote a player to a higher Tier.')
        .addStringOption(option => 
            option.setName('ign')
                .setDescription('The IGN to promote')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('leaderboard')
                .setDescription('Select Leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'sword' },
                    { name: 'Axe', value: 'axe' },
                    { name: 'Mace', value: 'mace' },
                    { name: 'UHC', value: 'uhc' },
                    { name: 'Vanilla', value: 'vanilla' },
                    { name: 'Pot', value: 'pot' },
                    { name: 'Nethpot', value: 'nethop' },
                    { name: 'SMP', value: 'smp' }
                ))
        .addStringOption(option => 
            option.setName('tier')
                .setDescription('Tier (e.g. HT1, LT2, Tier 4)')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('demote')
        .setDescription('Demote a player to a lower Tier.')
        .addStringOption(option => 
            option.setName('ign')
                .setDescription('The IGN to demote')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('leaderboard')
                .setDescription('Select Leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'sword' },
                    { name: 'Axe', value: 'axe' },
                    { name: 'Mace', value: 'mace' },
                    { name: 'UHC', value: 'uhc' },
                    { name: 'Vanilla', value: 'vanilla' },
                    { name: 'Pot', value: 'pot' },
                    { name: 'Nethpot', value: 'nethop' },
                    { name: 'SMP', value: 'smp' }
                ))
        .addStringOption(option => 
            option.setName('tier')
                .setDescription('Tier (e.g. HT1, LT2, Tier 4)')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('changeregion')
        .setDescription('Change the region of a player')
        .addStringOption(option => 
            option.setName('player')
                .setDescription('The IGN of the player')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('region')
                .setDescription('The new region (e.g., AS, EU, NA)')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('changename')
        .setDescription('Change the IGN of a player')
        .addStringOption(option => 
            option.setName('oldname')
                .setDescription('The current IGN of the player')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('newname')
                .setDescription('The new IGN of the player')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('unretire')
        .setDescription('Unretire a player and restore their rank.')
        .addStringOption(option => 
            option.setName('ign')
                .setDescription('The IGN of the player to unretire')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('leaderboard')
                .setDescription('Select Leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'sword' },
                    { name: 'Axe', value: 'axe' },
                    { name: 'Mace', value: 'mace' },
                    { name: 'UHC', value: 'uhc' },
                    { name: 'Vanilla', value: 'vanilla' },
                    { name: 'Pot', value: 'pot' },
                    { name: 'Nethpot', value: 'nethop' },
                    { name: 'SMP', value: 'smp' }
                )),
                
    new SlashCommandBuilder()
        .setName('peak')
        .setDescription('Set a peak rank for a player.')
        .addStringOption(option => 
            option.setName('ign')
                .setDescription('The IGN of the player')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('leaderboard')
                .setDescription('Select Leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'sword' },
                    { name: 'Axe', value: 'axe' },
                    { name: 'Mace', value: 'mace' },
                    { name: 'UHC', value: 'uhc' },
                    { name: 'Vanilla', value: 'vanilla' },
                    { name: 'Pot', value: 'pot' },
                    { name: 'Nethpot', value: 'nethop' },
                    { name: 'SMP', value: 'smp' }
                ))
        .addStringOption(option => 
            option.setName('tier')
                .setDescription('Tier (e.g. HT1, LT2, Tier 4)')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('unpeak')
        .setDescription('Remove the peak rank from a player.')
        .addStringOption(option => 
            option.setName('ign')
                .setDescription('The IGN of the player')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('leaderboard')
                .setDescription('Select Leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'sword' },
                    { name: 'Axe', value: 'axe' },
                    { name: 'Mace', value: 'mace' },
                    { name: 'UHC', value: 'uhc' },
                    { name: 'Vanilla', value: 'vanilla' },
                    { name: 'Pot', value: 'pot' },
                    { name: 'Nethpot', value: 'nethop' },
                    { name: 'SMP', value: 'smp' }
                )),

    new SlashCommandBuilder()
        .setName('logmatch')
        .setDescription('Log a match result to update win rates and match history.')
        .addStringOption(option => 
            option.setName('player1')
                .setDescription('The IGN of player 1')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('score1')
                .setDescription('Score of player 1')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('player2')
                .setDescription('The IGN of player 2')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('score2')
                .setDescription('Score of player 2')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('leaderboard')
                .setDescription('Select Leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'sword' },
                    { name: 'Axe', value: 'axe' },
                    { name: 'Mace', value: 'mace' },
                    { name: 'UHC', value: 'uhc' },
                    { name: 'Vanilla', value: 'vanilla' },
                    { name: 'Pot', value: 'pot' },
                    { name: 'Nethpot', value: 'nethop' },
                    { name: 'SMP', value: 'smp' }
                ))
        .addStringOption(option => 
            option.setName('action')
                .setDescription('Result of the match (for history log)')
                .setRequired(true)
                .addChoices(
                    { name: 'Promoted', value: 'Promoted' },
                    { name: 'Demoted', value: 'Demoted' },
                    { name: 'Stayed', value: 'Stayed' }
                )),

    new SlashCommandBuilder()
        .setName('dellogmatch')
        .setDescription('Delete a match log from an interactive menu.'),

    new SlashCommandBuilder()
        .setName('setstreak')
        .setDescription('Set a win streak for a player.')
        .addStringOption(option => option.setName('ign').setDescription('The IGN of the player').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('The streak amount').setRequired(true)),

    new SlashCommandBuilder()
        .setName('addstreak')
        .setDescription('Add to a win streak for a player.')
        .addStringOption(option => option.setName('ign').setDescription('The IGN of the player').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('Amount to add').setRequired(true)),

    new SlashCommandBuilder()
        .setName('setwinrate')
        .setDescription('Set win rate (%) for a player.')
        .addStringOption(option => option.setName('ign').setDescription('IGN of the player').setRequired(true))
        .addIntegerOption(option => option.setName('percent').setDescription('Win rate percentage (0-100)').setRequired(true).setMinValue(0).setMaxValue(100)),
        
    new SlashCommandBuilder()
        .setName('setmatch')
        .setDescription('Set total matches for a player.')
        .addStringOption(option => option.setName('ign').setDescription('IGN of the player').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('Exact amount of matches').setRequired(true).setMinValue(0)),

    new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the interactive leaderboard'),

    new SlashCommandBuilder()
        .setName('customprofile')
        .setDescription('Set a custom background for a player profile.')
        .addStringOption(option => option.setName('ign').setDescription('The IGN of the player').setRequired(true))
        .addStringOption(option => 
            option.setName('color')
                .setDescription('Select a preset background color')
                .setRequired(false)
                .addChoices(
                    { name: 'Default (Reset)', value: '#0d1117' },
                    { name: 'Pure Black', value: '#000000' },
                    { name: 'Shadow Gray', value: '#1f2937' },
                    { name: 'White Smoke', value: '#f3f4f6' },
                    { name: 'Blood Red', value: '#8b0000' },
                    { name: 'Crimson', value: '#dc143c' },
                    { name: 'Rose Pink', value: '#f43f5e' },
                    { name: 'Hot Magenta', value: '#d946ef' },
                    { name: 'Royal Purple', value: '#581c87' },
                    { name: 'Neon Purple', value: '#9333ea' },
                    { name: 'Deep Indigo', value: '#312e81' },
                    { name: 'Midnight Blue', value: '#0f172a' },
                    { name: 'Ocean Blue', value: '#2563eb' },
                    { name: 'Ice Blue', value: '#e0f2fe' },
                    { name: 'Neon Cyan', value: '#06b6d4' },
                    { name: 'Emerald Green', value: '#064e3b' },
                    { name: 'Neon Green', value: '#22c55e' },
                    { name: 'Lime', value: '#84cc16' },
                    { name: 'Goldenrod', value: '#ca8a04' },
                    { name: 'Neon Yellow', value: '#eab308' },
                    { name: 'Deep Orange', value: '#ea580c' },
                    { name: 'Bronze', value: '#b45309' },
                    { name: 'Chocolate', value: '#451a03' },
                    { name: 'Rose Gold', value: '#b76e79' }
                ))
        .addStringOption(option => option.setName('image_url').setDescription('Or paste a custom image URL').setRequired(false))
        .addStringOption(option => 
            option.setName('effect')
                .setDescription('Select an animated particle effect')
                .setRequired(false)
                .addChoices(
                    { name: 'Default (Reset)', value: 'reset' },
                    { name: 'Snow (Falling Snow)', value: 'snow' },
                    { name: 'Embers (Floating Fire)', value: 'embers' },
                    { name: 'Stars (Starfield)', value: 'stars' },
                    { name: 'Matrix (Code Rain)', value: 'matrix' },
                    { name: 'Bubbles (Floating Orbs)', value: 'bubbles' },
                    { name: 'Fireflies (Glowing Orbs)', value: 'fireflies' }
                ))
        .addStringOption(option => 
            option.setName('border_color')
                .setDescription('Select a preset neon border color')
                .setRequired(false)
                .addChoices(
                    { name: 'Default (Reset)', value: 'reset' },
                    { name: 'Pure Black', value: '#000000' },
                    { name: 'Shadow Gray', value: '#1f2937' },
                    { name: 'White Smoke', value: '#f3f4f6' },
                    { name: 'Blood Red', value: '#8b0000' },
                    { name: 'Crimson', value: '#dc143c' },
                    { name: 'Rose Pink', value: '#f43f5e' },
                    { name: 'Hot Magenta', value: '#d946ef' },
                    { name: 'Royal Purple', value: '#581c87' },
                    { name: 'Neon Purple', value: '#9333ea' },
                    { name: 'Deep Indigo', value: '#312e81' },
                    { name: 'Midnight Blue', value: '#0f172a' },
                    { name: 'Ocean Blue', value: '#2563eb' },
                    { name: 'Ice Blue', value: '#e0f2fe' },
                    { name: 'Neon Cyan', value: '#06b6d4' },
                    { name: 'Emerald Green', value: '#064e3b' },
                    { name: 'Neon Green', value: '#22c55e' },
                    { name: 'Lime', value: '#84cc16' },
                    { name: 'Goldenrod', value: '#ca8a04' },
                    { name: 'Neon Yellow', value: '#eab308' },
                    { name: 'Deep Orange', value: '#ea580c' },
                    { name: 'Bronze', value: '#b45309' },
                    { name: 'Chocolate', value: '#451a03' },
                    { name: 'Rose Gold', value: '#b76e79' }
                )),

    new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Send a direct message to a specific member.')
        .addUserOption(option => 
            option.setName('member')
                .setDescription('The member to DM')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message content to send')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('dmall')
        .setDescription('Send a direct message to everyone in the server (excluding bots).')
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true)
        ),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands...');
        
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
