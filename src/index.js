// src/index.js
import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, Partials, Events } from 'discord.js';
import { loadCommands } from './lib/loadCommands.js';
import { log } from './lib/logger.js';
import http from 'http'; // keep if you run as Web Service on Render

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel],
});

client.commands = new Collection();
await loadCommands(client);

client.once(Events.ClientReady, (c) => {
    log.info(`Logged in as ${c.user.tag} (id=${c.user.id})`);
});

function optionsToObject(opts = []) {
    // Flattens InteractionOptionResolver data for readable logs
    return opts.map(o => {
        const base = { name: o.name, type: o.type, value: o.value };
        if (o.options?.length) base.options = optionsToObject(o.options);
        return base;
    });
}

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (!interaction.isChatInputCommand()) return;
        const cmd = client.commands.get(interaction.commandName);
        log.info(
            `/${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'} (${interaction.guildId || 'no-guild'})`
        );
        log.debug('Options:', JSON.stringify(optionsToObject(interaction.options.data), null, 2));
        if (!cmd) {
            log.warn(`No handler found for /${interaction.commandName}`);
            return;
        }
        await cmd.execute(interaction);
    } catch (err) {
        log.error(`Error handling interaction: /${interaction.commandName}`);
        log.error(err.stack || err);
        const msg = 'Something went wrong executing that command.';
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: msg, ephemeral: true });
        } else {
            await interaction.reply({ content: msg, ephemeral: true });
        }
    }
});

// Process-level error traps (show up in Render logs)
process.on('unhandledRejection', (reason, p) => {
    log.error('Unhandled Rejection at:', p, '\nReason:', reason);
});
process.on('uncaughtException', (err) => {
    log.error('Uncaught Exception:', err.stack || err);
});

client.login(process.env.DISCORD_TOKEN);

// Optional tiny HTTP server for Render Web Service
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
    server.listen(port, () => log.info(`HTTP server listening on ${port}`));
}
