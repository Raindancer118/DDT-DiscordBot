// src/register-commands.js
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { buildCommandData } from './lib/loadCommands.js';
import { log } from './lib/logger.js';

const token = process.env.DISCORD_TOKEN;
const appId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !appId) {
    log.error('Missing DISCORD_TOKEN or CLIENT_ID in env.');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

async function main() {
    try {
        const commands = await buildCommandData();
        log.info(`Registering ${commands.length} command(s) … scope: ${guildId ? `GUILD:${guildId}` : 'GLOBAL'}`);
        console.time('register');

        let result;
        if (guildId) {
            result = await rest.put(
                Routes.applicationGuildCommands(appId, guildId),
                                    { body: commands }
            );
            log.info(`Slash commands registered (GUILD:${guildId}).`);
        } else {
            result = await rest.put(
                Routes.applicationCommands(appId),
                                    { body: commands }
            );
            log.info('Slash commands registered (GLOBAL).');
        }

        console.timeEnd('register');
        if (Array.isArray(result)) {
            const list = result.map(c => `/${c.name} (${c.id})`).join(', ');
            log.info(`Registered: ${list || '—'}`);
        } else {
            log.warn('Unexpected register result shape:', result);
        }
    } catch (err) {
        log.error('Failed to register commands.');
        // Helpful Discord REST errors
        if (err?.rawError) log.error('rawError:', JSON.stringify(err.rawError, null, 2));
        if (err?.requestBody) log.error('requestBody:', JSON.stringify(err.requestBody, null, 2));
        log.error(err.stack || err);
        process.exit(1);
    }
}

main();
