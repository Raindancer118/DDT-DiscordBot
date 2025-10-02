import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, Partials, Events } from 'discord.js';
import { loadCommands } from './lib/loadCommands.js';
import http from 'http'; // <-- add this

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

// --- minimal HTTP server for Render Web Service ---
const port = process.env.PORT;
if (port) {
    const server = http.createServer((req, res) => {
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('ok');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Dumb Decision TTRPG bot is running');
    });
    server.listen(port, () => console.log(`HTTP server listening on ${port}`));
}
