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
    if (!signature || !timestamp || !publicKey) {
        console.error('[DEBUG] Missing signature, timestamp, or public key for verification.');
        return false;
    }
    try {
        const sig = hexToUint8Array(signature);
        const key = hexToUint8Array(publicKey);
        const msg = encoder.encode(timestamp + body);
        const verified = nacl.sign.detached.verify(msg, sig, key);
        console.log(`[DEBUG] Crypto verification result: ${verified}`);
        return verified;
    } catch (err) {
        console.error('[DEBUG] Failed to verify signature (exception):', err);
        return false;
    }
}

async function handleCommand(interaction: any, env: any, ctx: any) {
    const name = interaction.data?.name;
    console.log(`[DEBUG] Handling command: /${name}`);

    const handler = commandHandlers[name];
    if (!handler) {
        console.warn(`[DEBUG] No handler found for /${name}`);
        return new Response(JSON.stringify({
            type: 4,
            data: {
                content: `No handler implemented for /${name}.`,
                flags: 1 << 6
            }
        }), { headers: { 'Content-Type': 'application/json' } });
    }

    try {
        console.log(`[DEBUG] Executing handler for /${name}...`);
        const result = await handler(interaction, env, ctx);
        console.log(`[DEBUG] Handler for /${name} executed. Result:`, JSON.stringify(result, null, 2));

        if (!result) {
            console.warn(`[DEBUG] Handler for /${name} returned null/undefined.`);
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
        console.error(`[DEBUG] Error handling /${name}:`, err);
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

    console.log('--- [DEBUG] Incoming Interaction Request ---');
    console.log(`[DEBUG] Method: ${request.method}`);
    console.log(`[DEBUG] URL: ${request.url}`);
    console.log(`[DEBUG] Signature: ${signature}`);
    console.log(`[DEBUG] Timestamp: ${timestamp}`);
    console.log(`[DEBUG] Public Key Configured: ${env.DISCORD_PUBLIC_KEY ? 'YES' : 'NO'}`);
    if (env.DISCORD_PUBLIC_KEY) {
        console.log(`[DEBUG] Public Key (first 10 chars): ${env.DISCORD_PUBLIC_KEY.substring(0, 10)}...`);
    }

    const body = await request.text();
    console.log(`[DEBUG] Raw Body Length: ${body.length}`);
    console.log(`[DEBUG] Raw Body Content: ${body}`);

    const isVerified = verifySignature({
        signature,
        timestamp,
        body,
        publicKey: env.DISCORD_PUBLIC_KEY
    });

    if (!isVerified) {
        console.error('[DEBUG] Signature verification FAILED. Returning 401.');
        return new Response('Bad request signature.', { status: 401 });
    }
    console.log('[DEBUG] Signature verified successfully.');

    let interaction;
    try {
        interaction = JSON.parse(body);
        console.log('[DEBUG] Parsed Interaction Type:', interaction.type);
    } catch (err) {
        console.error('[DEBUG] Failed to parse interaction body JSON:', err);
        return new Response('Invalid JSON body.', { status: 400 });
    }

    if (interaction.type === 1) {
        console.log('[DEBUG] Interaction Type 1 (PING). Returning PONG.');
        return new Response(JSON.stringify({ type: 1 }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (interaction.type === 2) {
        console.log('[DEBUG] Interaction Type 2 (APPLICATION_COMMAND). Delegating to handleCommand.');
        return handleCommand(interaction, env, ctx);
    }

    console.warn('[DEBUG] Unhandled interaction type:', interaction.type);
    return new Response(JSON.stringify({
        type: 4,
        data: {
            content: 'Interaction type not supported yet.',
            flags: 1 << 6
        }
    }), { headers: { 'Content-Type': 'application/json' } });
};
