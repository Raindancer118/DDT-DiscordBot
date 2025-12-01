import type { APIRoute } from 'astro';
import nacl from 'tweetnacl';
import { commandHandlers } from '../../commands/index.js';

const encoder = new TextEncoder();

function hexToUint8Array(hex: string) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

function verifySignature({ signature, timestamp, body, publicKey }: { signature: string | null, timestamp: string | null, body: string, publicKey: string }) {
    if (!signature || !timestamp || !publicKey) return false;
    try {
        const sig = hexToUint8Array(signature);
        const key = hexToUint8Array(publicKey);
        const msg = encoder.encode(timestamp + body);
        return nacl.sign.detached.verify(msg, sig, key);
    } catch (err) {
        console.error('Failed to verify signature', err);
        return false;
    }
}

async function handleCommand(interaction: any, env: any, ctx: any) {
    const name = interaction.data?.name;
    const handler = commandHandlers[name];
    if (!handler) {
        return new Response(JSON.stringify({
            type: 4,
            data: {
                content: `No handler implemented for /${name}.`,
                flags: 1 << 6
            }
        }), { headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const result = await handler(interaction, env, ctx);
        if (!result) {
            return new Response(JSON.stringify({
                type: 4,
                data: {
                    content: 'Command executed but returned no response.',
                    flags: 1 << 6
                }
            }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        console.error(`Error handling /${name}`, err);
        return new Response(JSON.stringify({
            type: 4,
            data: {
                content: 'Something went wrong executing that command.',
                flags: 1 << 6
            }
        }), { headers: { 'Content-Type': 'application/json' }, status: 200 });
    }
}

export const POST: APIRoute = async ({ request, locals }) => {
    const env = (locals as any).runtime.env;
    const ctx = (locals as any).runtime.ctx;

    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');
    const body = await request.text();

    if (!verifySignature({
        signature,
        timestamp,
        body,
        publicKey: env.DISCORD_PUBLIC_KEY
    })) {
        return new Response('Bad request signature.', { status: 401 });
    }

    let interaction;
    try {
        interaction = JSON.parse(body);
    } catch (err) {
        console.error('Failed to parse interaction body', err);
        return new Response('Invalid JSON body.', { status: 400 });
    }

    if (interaction.type === 1) {
        return new Response(JSON.stringify({ type: 1 }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (interaction.type === 2) {
        return handleCommand(interaction, env, ctx);
    }

    console.warn('Unhandled interaction type', interaction.type);
    return new Response(JSON.stringify({
        type: 4,
        data: {
            content: 'Interaction type not supported yet.',
            flags: 1 << 6
        }
    }), { headers: { 'Content-Type': 'application/json' } });
};
