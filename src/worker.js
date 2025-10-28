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
    if (request.method !== 'POST') {
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
