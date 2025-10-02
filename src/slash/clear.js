import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
.setName('clear')
.setDescription('Deletes messages from the channel.')
.addStringOption(option =>
option.setName('amount')
.setDescription('Number of messages to delete, or type "all" to clear the entire channel')
.setRequired(true)
)
.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
.setDMPermission(false);

export async function execute(interaction) {
    // --- Permission Check ---
    if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({
            content: 'I do not have permission to manage messages in this channel.',
            ephemeral: true
        });
    }

    try {
        const amountStr = interaction.options.getString('amount').toLowerCase();
        let targetAmount;

        // Determine the target number of messages to delete
        if (amountStr === 'all') {
            targetAmount = Infinity;
        } else {
            targetAmount = parseInt(amountStr, 10);
            if (isNaN(targetAmount) || targetAmount < 1) {
                return interaction.reply({
                    content: 'Please provide a valid number greater than 0, or type "all".',
                    ephemeral: true
                });
            }
        }

        // --- Unified Deletion Logic ---
        await interaction.deferReply({ ephemeral: true });
        await interaction.editReply({ content: `🧹 Preparing to clear up to ${targetAmount === Infinity ? 'all' : targetAmount} messages...` });

        let totalDeleted = 0;
        let lastMessageId = null;
        let isDone = false;

        while (!isDone && totalDeleted < targetAmount) {
            // Determine how many messages to fetch in this batch
            const remaining = targetAmount - totalDeleted;
            const fetchLimit = Math.min(100, remaining);

            const options = { limit: fetchLimit };
            if (lastMessageId) {
                options.before = lastMessageId;
            }

            const fetched = await interaction.channel.messages.fetch(options);

            // Stop if the channel has no more messages
            if (fetched.size === 0) {
                isDone = true;
                continue;
            }

            lastMessageId = fetched.last().id;

            const recentMessages = fetched.filter(msg => (Date.now() - msg.createdTimestamp) < 1209600000); // < 14 days
            const oldMessages = fetched.filter(msg => (Date.now() - msg.createdTimestamp) >= 1209600000); // >= 14 days

            try {
                // Bulk delete recent messages for efficiency
                if (recentMessages.size > 0) {
                    const deleted = await interaction.channel.bulkDelete(recentMessages, true);
                    totalDeleted += deleted.size;
                    await interaction.editReply({ content: `🧹 Cleared ${totalDeleted} messages... (fast-deleting recent ones)`, ephemeral: true });
                }

                // Individually delete old messages
                if (oldMessages.size > 0) {
                    for (const message of oldMessages.values()) {
                        await message.delete();
                        totalDeleted++;
                        // Update the user periodically during the slow part
                        if (totalDeleted % 5 === 0) {
                            await interaction.editReply({ content: `🧹 Cleared ${totalDeleted} messages... (slow-deleting old ones)`, ephemeral: true });
                        }
                        // This delay is CRUCIAL to avoid hitting Discord's API rate limits.
                        // Removing it will cause the command to fail on large purges.
                        await new Promise(res => setTimeout(res, 1000)); // Reduced delay for a slight speed boost
                    }
                }
            } catch (err) {
                console.error("Error during message deletion batch:", err);
                await interaction.editReply({ content: `❌ An error occurred after deleting ${totalDeleted} messages. Stopping. Some messages may remain.`, ephemeral: true });
                isDone = true; // Stop the process on error
            }

            // Stop if we fetched fewer messages than we asked for (means we're at the end)
            if (fetched.size < fetchLimit) {
                isDone = true;
            }

            // Short delay between fetching batches to be safe
            if (!isDone) await new Promise(res => setTimeout(res, 1000));
        }

        await interaction.editReply({ content: `✅ All done! Successfully deleted a total of **${totalDeleted}** messages.`, ephemeral: true });

    } catch (error) {
        console.error("An unexpected error occurred while executing the /clear command:", error);
        // If the interaction is already replied to or deferred, we have to use followup
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: 'An unexpected error occurred while processing your command.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'An unexpected error occurred while processing your command.', ephemeral: true });
        }
    }
}

