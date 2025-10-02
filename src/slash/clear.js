import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
.setName('clear')
.setDescription('Deletes messages from the channel.')
.addStringOption(option =>
option.setName('amount')
.setDescription('Number of messages to delete (1-1000), or type "all" to clear recent messages')
.setRequired(true)
)
.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // User needs this permission
.setDMPermission(false); // Command cannot be used in DMs

export async function execute(interaction) {
    // --- Permission Check ---
    if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({
            content: 'I do not have permission to manage messages in this channel.',
            ephemeral: true
        });
    }

    const amountStr = interaction.options.getString('amount').toLowerCase();

    if (amountStr === 'all') {
        // --- Handle 'all' logic ---
        await interaction.deferReply({ ephemeral: true });

        try {
            let deletedCount = 0;
            let isDone = false;

            while (!isDone) {
                // Fetch up to 100 messages at a time
                const fetched = await interaction.channel.messages.fetch({ limit: 100 });
                // bulkDelete cannot delete messages older than 14 days.
                const messagesToDelete = fetched.filter(msg => (Date.now() - msg.createdTimestamp) < 1209600000); // 14 days in ms

                if (messagesToDelete.size > 0) {
                    const deleted = await interaction.channel.bulkDelete(messagesToDelete, false);
                    deletedCount += deleted.size;

                    // If we deleted less than 100, we've likely hit the 14-day wall or cleared everything
                    if (deleted.size < 100) {
                        isDone = true;
                    }
                    // Add a small delay to avoid hitting Discord's rate limits
                    await new Promise(res => setTimeout(res, 1000));
                } else {
                    isDone = true;
                }
            }

            await interaction.editReply({
                content: `✅ Successfully deleted **${deletedCount}** messages (up to 14 days old).`,
            });
            setTimeout(() => interaction.deleteReply(), 5000);

        } catch (error) {
            console.error('Error during "clear all":', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to clear messages.',
            });
        }

    } else {
        // --- Handle numeric amount logic ---
        const amount = parseInt(amountStr, 10);

        if (isNaN(amount) || amount < 1 || amount > 1000) {
            return interaction.reply({
                content: 'Please provide a number between 1 and 1000, or type "all".',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const { size } = await interaction.channel.bulkDelete(amount, true);

            await interaction.editReply({
                content: `✅ Successfully deleted **${size}** messages.`,
            });
            setTimeout(() => interaction.deleteReply(), 5000);

        } catch (error) {
            console.error('Error during bulk delete:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to delete messages. They might be older than 14 days.',
            });
        }
    }
}

