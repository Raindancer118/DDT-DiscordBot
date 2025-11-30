import nacl from 'tweetnacl';
import { commandHandlers } from './commands/index.js';

const encoder = new TextEncoder();

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function verifySignature({ signature, timestamp, body, publicKey }) {
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

function errorResponse(message, status = 400) {
  return new Response(message, { status });
}

async function handleCommand(interaction, env, ctx) {
  const name = interaction.data?.name;
  const handler = commandHandlers[name];
  if (!handler) {
    return jsonResponse({
      type: 4,
      data: {
        content: `No handler implemented for /${name}.`,
        flags: 1 << 6
      }
    });
  }

  try {
    const result = await handler(interaction, env, ctx);
    if (!result) {
      return jsonResponse({
        type: 4,
        data: {
          content: 'Command executed but returned no response.',
          flags: 1 << 6
        }
      });
    }
    return jsonResponse(result);
  } catch (err) {
    console.error(`Error handling /${name}`, err);
    return jsonResponse({
      type: 4,
      data: {
        content: 'Something went wrong executing that command.',
        flags: 1 << 6
      }
    }, 200);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'GET') {
      if (url.pathname === '/status') {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bot Status</title>
            <style>
                body { font-family: sans-serif; background: #2c2f33; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { background: #23272a; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); text-align: center; }
                h1 { margin-top: 0; color: #7289da; }
                .status-item { margin: 10px 0; font-size: 1.2rem; }
                .online { color: #43b581; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>DDT Bot Status</h1>
                <div class="status-item">Status: <span class="online">● Online</span></div>
                <div class="status-item">Platform: Cloudflare Workers</div>
            </div>
        </body>
        </html>
        `;
        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
      }
      return new Response('OK', { status: 200 });
    }

    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');

    const body = await request.text();

    if (!verifySignature({
      signature,
      timestamp,
      body,
      publicKey: env.DISCORD_PUBLIC_KEY
    })) {
      return errorResponse('Bad request signature.', 401);
    }

    let interaction;
    try {
      interaction = JSON.parse(body);
    } catch (err) {
      console.error('Failed to parse interaction body', err);
      return errorResponse('Invalid JSON body.', 400);
    }

    if (interaction.type === 1) {
      return jsonResponse({ type: 1 });
    }

    if (interaction.type === 2) {
      return handleCommand(interaction, env, ctx);
    }

    console.warn('Unhandled interaction type', interaction.type);
    return jsonResponse({
      type: 4,
      data: {
        content: 'Interaction type not supported yet.',
        flags: 1 << 6
      }
    });
  }
};
