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
            option.setName('status')
                .setDescription('Rank status')
                .setRequired(true)
                .addChoices(
                    { name: 'Promoted to', value: 'Promoted to' },
                    { name: 'Demoted to', value: 'Demoted to' },
                    { name: 'Maintained at', value: 'Maintained at' }
                ))
        .addIntegerOption(option => 
            option.setName('rank')
                .setDescription('New rank achieved (e.g., 4)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5))
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
        .setName('leaderboard')
        .setDescription('View the interactive leaderboard')

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
