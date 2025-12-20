/**
 * Discord Gateway WebSocket Handler for Cloudflare Workers
 * Handles starboard functionality via reaction events
 */

// Discord Gateway opcodes
const OPCODES = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  RESUME: 6,
  RECONNECT: 7,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
};

// Constants
const STAR_EMOJI = '⭐';
const NUMBER_EMOJIS = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
const STAR_COLOR_GOLD = 0xFFD700;
const STAR_COLOR_ORANGE = 0xFFA500;
const STAR_COLOR_YELLOW = 0xFFFF00;

/**
 * Connect to Discord Gateway via WebSocket
 */
export async function connectToGateway(env) {
  const gatewayUrl = 'wss://gateway.discord.gg/?v=10&encoding=json';
  
  const resp = await fetch(gatewayUrl, {
    headers: {
      'Upgrade': 'websocket',
    },
  });

  const ws = resp.webSocket;
  if (!ws) {
    throw new Error('Failed to establish WebSocket connection');
  }

  ws.accept();

  let heartbeatInterval = null;
  let sequenceNumber = null;

  // Handle incoming messages
  ws.addEventListener('message', async (event) => {
    try {
      const data = JSON.parse(event.data);
      sequenceNumber = data.s ?? sequenceNumber;

      switch (data.op) {
        case OPCODES.HELLO:
          // Start heartbeat
          const interval = data.d.heartbeat_interval;
          heartbeatInterval = setInterval(() => {
            ws.send(JSON.stringify({
              op: OPCODES.HEARTBEAT,
              d: sequenceNumber,
            }));
          }, interval);

          // Send IDENTIFY
          ws.send(JSON.stringify({
            op: OPCODES.IDENTIFY,
            d: {
              token: env.DISCORD_TOKEN,
              intents: (1 << 0) | (1 << 9) | (1 << 10) | (1 << 15), // GUILDS | GUILD_MESSAGES | GUILD_MESSAGE_REACTIONS | MESSAGE_CONTENT
              properties: {
                $os: 'cloudflare',
                $browser: 'workers',
                $device: 'workers',
              },
            },
          }));
          break;

        case OPCODES.DISPATCH:
          await handleDispatch(data.t, data.d, env);
          break;

        case OPCODES.INVALID_SESSION:
          // Reconnect
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          ws.close();
          break;

        case OPCODES.RECONNECT:
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          ws.close();
          break;
      }
    } catch (error) {
      console.error('Error processing Gateway message:', error);
    }
  });

  ws.addEventListener('close', () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  });

  ws.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return ws;
}

/**
 * Handle Discord Gateway events
 */
async function handleDispatch(eventType, data, env) {
  switch (eventType) {
    case 'MESSAGE_REACTION_ADD':
      await handleReactionAdd(data, env);
      break;
    case 'MESSAGE_REACTION_REMOVE':
      await handleReactionRemove(data, env);
      break;
    case 'READY':
      console.log('Discord Gateway connected successfully');
      break;
  }
}

/**
 * Handle reaction add event
 */
async function handleReactionAdd(data, env) {
  // Only handle star emoji
  if (data.emoji.name !== STAR_EMOJI) return;

  const messageId = data.message_id;
  const channelId = data.channel_id;
  const userId = data.user_id;

  // Don't track bot reactions
  const botUser = await getBotUser(env);
  if (userId === botUser.id) return;

  // Get or create entry
  let entry = await getStarboardEntry(env, messageId);
  
  // Fetch the message to get author and content
  const message = await fetchMessage(env, channelId, messageId);
  if (!message) return;

  // Don't star bot messages or messages in starboard channel
  if (message.author.bot) return;
  if (env.STARBOARD_CHANNEL_ID && channelId === env.STARBOARD_CHANNEL_ID) return;

  if (!entry) {
    await createStarboardEntry(env, messageId, channelId, message.author.id);
    entry = await getStarboardEntry(env, messageId);
  }

  // Count current stars
  const starCount = await countStars(env, channelId, messageId);
  await updateStarCount(env, messageId, starCount);

  const threshold = parseInt(env.STAR_THRESHOLD || '3', 10);

  // Update bot reactions
  await updateBotReactions(env, channelId, messageId, starCount, threshold, !!entry.starboard_message_id);

  // Post to starboard if threshold reached
  if (starCount >= threshold && !entry.starboard_message_id && env.STARBOARD_CHANNEL_ID) {
    const starboardMessageId = await postToStarboard(env, message, starCount);
    if (starboardMessageId) {
      await updateStarboardMessageId(env, messageId, starboardMessageId);
      await updateBotReactions(env, channelId, messageId, starCount, threshold, true);
    }
  } else if (entry.starboard_message_id && env.STARBOARD_CHANNEL_ID) {
    // Update existing starboard post
    await updateStarboardPost(env, entry.starboard_message_id, message, starCount);
  }
}

/**
 * Handle reaction remove event
 */
async function handleReactionRemove(data, env) {
  if (data.emoji.name !== STAR_EMOJI) return;

  const messageId = data.message_id;
  const channelId = data.channel_id;

  const entry = await getStarboardEntry(env, messageId);
  if (!entry) return;

  const starCount = await countStars(env, channelId, messageId);
  await updateStarCount(env, messageId, starCount);

  const threshold = parseInt(env.STAR_THRESHOLD || '3', 10);

  await updateBotReactions(env, channelId, messageId, starCount, threshold, !!entry.starboard_message_id);

  // Update starboard post if it exists
  if (entry.starboard_message_id && env.STARBOARD_CHANNEL_ID) {
    const message = await fetchMessage(env, channelId, messageId);
    if (message) {
      await updateStarboardPost(env, entry.starboard_message_id, message, starCount);
    }
  }
}

/**
 * Database operations
 */
async function getStarboardEntry(env, messageId) {
  const result = await env.DB.prepare(
    'SELECT * FROM starboard_messages WHERE message_id = ?'
  ).bind(messageId).first();
  return result;
}

async function createStarboardEntry(env, messageId, channelId, authorId) {
  await env.DB.prepare(
    'INSERT INTO starboard_messages (message_id, channel_id, author_id, star_count) VALUES (?, ?, ?, 0)'
  ).bind(messageId, channelId, authorId).run();
}

async function updateStarCount(env, messageId, starCount) {
  await env.DB.prepare(
    'UPDATE starboard_messages SET star_count = ?, updated_at = CURRENT_TIMESTAMP WHERE message_id = ?'
  ).bind(starCount, messageId).run();
}

async function updateStarboardMessageId(env, messageId, starboardMessageId) {
  await env.DB.prepare(
    'UPDATE starboard_messages SET starboard_message_id = ?, updated_at = CURRENT_TIMESTAMP WHERE message_id = ?'
  ).bind(starboardMessageId, messageId).run();
}

/**
 * Discord API helpers
 */
async function getBotUser(env) {
  const resp = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { 'Authorization': `Bot ${env.DISCORD_TOKEN}` }
  });
  return await resp.json();
}

async function fetchMessage(env, channelId, messageId) {
  const resp = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
    headers: { 'Authorization': `Bot ${env.DISCORD_TOKEN}` }
  });
  if (!resp.ok) return null;
  return await resp.json();
}

async function countStars(env, channelId, messageId) {
  const message = await fetchMessage(env, channelId, messageId);
  if (!message || !message.reactions) return 0;
  
  const starReaction = message.reactions.find(r => r.emoji.name === STAR_EMOJI);
  return starReaction ? starReaction.count : 0;
}

async function addReaction(env, channelId, messageId, emoji) {
  await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
    {
      method: 'PUT',
      headers: { 'Authorization': `Bot ${env.DISCORD_TOKEN}` }
    }
  );
}

async function removeReaction(env, channelId, messageId, emoji) {
  await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bot ${env.DISCORD_TOKEN}` }
    }
  );
}

async function updateBotReactions(env, channelId, messageId, starCount, threshold, isPosted) {
  try {
    // Remove existing bot reactions
    const message = await fetchMessage(env, channelId, messageId);
    if (message && message.reactions) {
      for (const reaction of message.reactions) {
        if (reaction.me && (NUMBER_EMOJIS.includes(reaction.emoji.name) || reaction.emoji.name === '✅')) {
          await removeReaction(env, channelId, messageId, reaction.emoji.name);
        }
      }
    }

    if (isPosted) {
      await addReaction(env, channelId, messageId, '✅');
    } else {
      const starsNeeded = threshold - starCount;
      if (starsNeeded > 0 && starsNeeded <= 9) {
        await addReaction(env, channelId, messageId, NUMBER_EMOJIS[starsNeeded]);
      }
    }
  } catch (error) {
    console.error('Error updating bot reactions:', error);
  }
}

async function postToStarboard(env, message, starCount) {
  const embed = createStarboardEmbed(message, starCount);
  
  const resp = await fetch(`https://discord.com/api/v10/channels/${env.STARBOARD_CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: `${STAR_EMOJI} **${starCount}** <#${message.channel_id}>`,
      embeds: [embed]
    })
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  return data.id;
}

async function updateStarboardPost(env, starboardMessageId, message, starCount) {
  const embed = createStarboardEmbed(message, starCount);
  
  await fetch(`https://discord.com/api/v10/channels/${env.STARBOARD_CHANNEL_ID}/messages/${starboardMessageId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bot ${env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: `${STAR_EMOJI} **${starCount}** <#${message.channel_id}>`,
      embeds: [embed]
    })
  });
}

function createStarboardEmbed(message, starCount) {
  const color = starCount >= 10 ? STAR_COLOR_GOLD : starCount >= 5 ? STAR_COLOR_ORANGE : STAR_COLOR_YELLOW;
  
  const embed = {
    author: {
      name: `${message.author.username}#${message.author.discriminator}`,
      icon_url: `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`
    },
    description: message.content || '*[No text content]*',
    color: color,
    fields: [{
      name: 'Source',
      value: `[Jump to message](https://discord.com/channels/${message.guild_id}/${message.channel_id}/${message.id})`
    }],
    timestamp: message.timestamp
  };

  // Add image if present
  if (message.attachments && message.attachments.length > 0) {
    const attachment = message.attachments[0];
    if (attachment.content_type && attachment.content_type.startsWith('image/')) {
      embed.image = { url: attachment.url };
    }
  }

  // Add embedded image if present
  if (message.embeds && message.embeds.length > 0 && message.embeds[0].image) {
    embed.image = { url: message.embeds[0].image.url };
  }

  return embed;
}
