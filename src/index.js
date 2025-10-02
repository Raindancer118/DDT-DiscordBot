import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, Partials, Events } from 'discord.js';
import { loadCommands } from './lib/loadCommands.js';

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel]
});

client.commands = new Collection();
await loadCommands(client);

client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    try {
        await cmd.execute(interaction);
    } catch (err) {
        console.error(err);
        const msg = 'Something went wrong executing that command.';
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: msg, ephemeral: true });
        } else {
            await interaction.reply({ content: msg, ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
