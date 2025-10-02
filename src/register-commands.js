import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { buildCommandData } from './lib/loadCommands.js';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const commands = await buildCommandData();

if (process.env.GUILD_ID) {
    await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                   { body: commands }
    );
    console.log('Slash commands registered (GUILD).');
} else {
    await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
                   { body: commands }
    );
    console.log('Slash commands registered (GLOBAL).');
}
