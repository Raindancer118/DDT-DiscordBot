import nacl from 'tweetnacl';
import { commandHandlers, componentHandlers } from './commands/index.js';

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

async function handleMessageComponent(interaction, env, ctx) {
  const customId = interaction.data?.custom_id;
  if (!customId) {
    return jsonResponse({
      type: 4,
      data: {
        content: 'Invalid component interaction.',
        flags: 1 << 6
      }
    });
  }

  // Parse custom_id to get the handler key (e.g., "roulette_bet:10" -> "roulette_bet")
  const handlerKey = customId.split(':')[0];
  const handler = componentHandlers[handlerKey];
  
  if (!handler) {
    return jsonResponse({
      type: 4,
      data: {
        content: `No handler implemented for component ${handlerKey}.`,
        flags: 1 << 6
      }
    });
  }

  try {
    const selectedValues = interaction.data?.values || [];
    const result = await handler(interaction, customId, selectedValues, env, ctx);
    if (!result) {
      return jsonResponse({
        type: 4,
        data: {
          content: 'Component interaction executed but returned no response.',
          flags: 1 << 6
        }
      });
    }
    return jsonResponse(result);
  } catch (err) {
    console.error(`Error handling component ${handlerKey}`, err);
    return jsonResponse({
      type: 4,
      data: {
        content: 'Something went wrong executing that component interaction.',
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
        let discordStatus = 'Unknown';
        let guilds = [];
        let errorMsg = '';

        try {
          const userResp = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bot ${env.DISCORD_TOKEN}` }
          });
          if (userResp.ok) {
            discordStatus = 'Online';
            const guildsResp = await fetch('https://discord.com/api/v10/users/@me/guilds', {
              headers: { Authorization: `Bot ${env.DISCORD_TOKEN}` }
            });
            if (guildsResp.ok) {
              guilds = await guildsResp.json();
            }
          } else {
            discordStatus = 'Unreachable';
            errorMsg = `Discord API Error: ${userResp.status}`;
          }
        } catch (e) {
          discordStatus = 'Error';
          errorMsg = e.message;
        }

        const functionalities = [
          { name: 'Slash Commands', status: 'Operational' },
          { name: 'Status Page', status: 'Operational' },
          { name: 'Discord Gateway', status: discordStatus === 'Online' ? 'Operational' : 'Outage' }
        ];

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bot Status</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #2c2f33; color: #fff; display: flex; justify-content: center; padding-top: 50px; min-height: 100vh; margin: 0; }
                .container { background: #23272a; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); width: 80%; max-width: 800px; }
                h1 { margin-top: 0; color: #7289da; text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .section-title { font-size: 1.1rem; color: #99aab5; border-bottom: 1px solid #99aab5; padding-bottom: 5px; margin-bottom: 10px; }
                .status-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2c2f33; }
                .status-row:last-child { border-bottom: none; }
                .online { color: #43b581; font-weight: bold; }
                .offline { color: #f04747; font-weight: bold; }
                .unknown { color: #faa61a; font-weight: bold; }
                .guild-list { list-style: none; padding: 0; margin: 0; }
                .guild-item { padding: 5px 0; display: flex; align-items: center; }
                .guild-icon { width: 32px; height: 32px; border-radius: 50%; margin-right: 10px; background: #7289da; display: flex; align-items: center; justify-content: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>DDT Bot Status</h1>
                
                <div class="section">
                    <div class="section-title">System Status</div>
                    <div class="status-row">
                        <span>Worker Status</span>
                        <span class="online">● Online</span>
                    </div>
                    <div class="status-row">
                        <span>Discord API Connection</span>
                        <span class="${discordStatus === 'Online' ? 'online' : 'offline'}">● ${discordStatus}</span>
                    </div>
                    ${errorMsg ? `<div class="status-row" style="color: #f04747; font-size: 0.9em;">${errorMsg}</div>` : ''}
                </div>

                <div class="section">
                    <div class="section-title">Functionalities</div>
                    ${functionalities.map(f => `
                        <div class="status-row">
                            <span>${f.name}</span>
                            <span class="${f.status === 'Operational' ? 'online' : 'offline'}">${f.status}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="section">
                    <div class="section-title">Deployed Servers (${guilds.length})</div>
                    <ul class="guild-list">
                        ${guilds.map(g => `
                            <li class="guild-item">
                                <div class="guild-icon">${g.icon ? `<img src="https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png" style="width:100%;height:100%;border-radius:50%;">` : g.name.substring(0, 2)}</div>
                                <span>${g.name}</span>
                            </li>
                        `).join('')}
                        ${guilds.length === 0 ? '<li class="guild-item" style="color: #99aab5;">No servers found or unable to fetch list.</li>' : ''}
                    </ul>
                </div>
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

    if (interaction.type === 3) {
      return handleMessageComponent(interaction, env, ctx);
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
