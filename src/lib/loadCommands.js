// src/lib/loadCommands.js
import { readdirSync } from 'fs';
import { join } from 'path';
import { log } from './logger.js';

const __dirname = new URL('.', import.meta.url).pathname;

export async function loadCommands(client) {
    const dir = join(__dirname, '..', 'slash');
    const files = readdirSync(dir).filter(f => f.endsWith('.js'));
    log.info(`Loading command modules from ${dir} … found ${files.length}`);
    for (const file of files) {
        const mod = await import(join(dir, file));
        client.commands.set(mod.data.name, mod);
        log.debug(`Loaded /${mod.data.name} from ${file}`);
    }
    log.info(`Commands loaded into client: ${client.commands.size}`);
}

export async function buildCommandData() {
    const dir = join(__dirname, '..', 'slash');
    const files = readdirSync(dir).filter(f => f.endsWith('.js'));
    const arr = [];
    for (const file of files) {
        const mod = await import(join(dir, file));
        arr.push(mod.data.toJSON());
    }
    log.info(`Prepared ${arr.length} slash command definition(s) for registration`);
    return arr;
}
