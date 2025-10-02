import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
.setName('clear')
.setDescription('Deletes a specified number of messages from the channel.')
.addIntegerOption(option =>
option.setName('amount')
.setDescription('Number of messages to delete (1-100)')
.setRequired(true)
)
// You can also add an option for 'all', but bulkDelete is limited.
// A true 'all' would require fetching and deleting in batches, which is more complex.
// For now, we'll stick to a specified amount.
.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // User needs this permission
.setDMPermission(false); // Command cannot be used in DMs

export async function execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    // --- Permission and Input Validation ---
    if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({
            content: 'I do not have permission to manage messages in this channel.',
            ephemeral: true
        });
    }

    if (amount < 1 || amount > 1000) {
        return interaction.reply({
            content: 'You need to input a number between 1 and 1000.',
            ephemeral: true
        });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        // --- Message Deletion ---
        const { size } = await interaction.channel.bulkDelete(amount, true); // `true` filters messages older than 14 days

        // --- Confirmation Message ---
        await interaction.editReply({
            content: `✅ Successfully deleted **${size}** messages.`,
        });

        // Optional: Make the confirmation message disappear after a few seconds
        setTimeout(() => interaction.deleteReply(), 5000);

    } catch (error) {
        console.error('Error during bulk delete:', error);
        await interaction.editReply({
            content: '❌ An error occurred while trying to delete messages. They might be older than 14 days.',
        });
    }
}
