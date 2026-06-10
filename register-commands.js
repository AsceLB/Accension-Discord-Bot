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
        .addIntegerOption(option => 
            option.setName('position')
                .setDescription('Rank position (e.g., 1, 2, 3...)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5))
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
                    { name: 'Nethpot', value: 'nethop' },
                    { name: 'SMP', value: 'smp' }
                )),

    new SlashCommandBuilder()
        .setName('promote')
        .setDescription('Promote a player and shift existing active players down.')
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
        .addIntegerOption(option => 
            option.setName('rank')
                .setDescription('New rank achieved (e.g., 1)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5)),
                
    new SlashCommandBuilder()
        .setName('demote')
        .setDescription('Demote a player and shift existing active players up.')
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
        .addIntegerOption(option => 
            option.setName('rank')
                .setDescription('New rank (e.g., 3)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5)),
                
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
        .addIntegerOption(option => 
            option.setName('rank')
                .setDescription('Peak rank (e.g., 1)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5)),
                
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
    new SlashCommandBuilder()
        .setName('roster')
        .setDescription('Manage the website roster')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to a roster tier')
                .addStringOption(option => option.setName('tier').setDescription('Tier name (e.g. HT1, LT2, etc)').setRequired(true).addChoices(
                    { name: 'HT1', value: 'HT1' }, { name: 'LT1', value: 'LT1' },
                    { name: 'HT2', value: 'HT2' }, { name: 'LT2', value: 'LT2' },
                    { name: 'HT3', value: 'HT3' }, { name: 'LT3', value: 'LT3' },
                    { name: 'HT4', value: 'HT4' }, { name: 'LT4', value: 'LT4' },
                    { name: 'HT5', value: 'HT5' }, { name: 'LT5', value: 'LT5' }
                ))
                .addStringOption(option => option.setName('name').setDescription('Username to add').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from a roster tier')
                .addStringOption(option => option.setName('tier').setDescription('Tier name (e.g. HT1, LT2, etc)').setRequired(true).addChoices(
                    { name: 'HT1', value: 'HT1' }, { name: 'LT1', value: 'LT1' },
                    { name: 'HT2', value: 'HT2' }, { name: 'LT2', value: 'LT2' },
                    { name: 'HT3', value: 'HT3' }, { name: 'LT3', value: 'LT3' },
                    { name: 'HT4', value: 'HT4' }, { name: 'LT4', value: 'LT4' },
                    { name: 'HT5', value: 'HT5' }, { name: 'LT5', value: 'LT5' }
                ))
                .addStringOption(option => option.setName('name').setDescription('Username to remove').setRequired(true))
        ),
    new SlashCommandBuilder()
        .setName('leadership')
        .setDescription('Manage the website leadership section')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to leadership')
                .addStringOption(option => option.setName('name').setDescription('Username to add').setRequired(true))
                .addStringOption(option => option.setName('role').setDescription('Role').setRequired(true).addChoices(
                    { name: 'Founder', value: 'Founder' },
                    { name: 'Leader', value: 'Leader' },
                    { name: 'EU Leader', value: 'EU Leader' },
                    { name: 'War Leader', value: 'War Leader' },
                    { name: 'Overseer', value: 'Overseer' },
                    { name: 'Officer', value: 'Officer' }
                ))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from leadership')
                .addStringOption(option => option.setName('name').setDescription('Username to remove').setRequired(true))
        )
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
