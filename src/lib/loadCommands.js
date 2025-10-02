import { readdirSync } from 'fs';
import { join } from 'path';

const __dirname = new URL('.', import.meta.url).pathname;

export async function loadCommands(client) {
    const dir = join(__dirname, '..', 'slash');
    for (const file of readdirSync(dir).filter(f => f.endsWith('.js'))) {
        const mod = await import(join(dir, file));
        client.commands.set(mod.data.name, mod);
    }
}

export async function buildCommandData() {
    const dir = join(__dirname, '..', 'slash');
    const arr = [];
    for (const file of readdirSync(dir).filter(f => f.endsWith('.js'))) {
        const mod = await import(join(dir, file));
        arr.push(mod.data.toJSON());
    }
    return arr;
}
