/**
 * Discord Gateway Durable Object
 * Maintains persistent WebSocket connection to Discord Gateway
 */

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

const STAR_EMOJI = '⭐';
const NUMBER_EMOJIS = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
const STAR_COLOR_GOLD = 0xFFD700;
const STAR_COLOR_ORANGE = 0xFFA500;
const STAR_COLOR_YELLOW = 0xFFFF00;

export class DiscordGateway {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.ws = null;
    this.heartbeatInterval = null;
    this.sequenceNumber = null;
  }

  async fetch(request) {
    // Initialize Gateway connection if not already connected
    if (!this.ws) {
      await this.connect();
    }

    return new Response('Gateway connected', { status: 200 });
  }

  async connect() {
    const gatewayUrl = 'wss://gateway.discord.gg/?v=10&encoding=json';
    
    try {
      const resp = await fetch(gatewayUrl, {
        headers: {
          'Upgrade': 'websocket',
        },
      });

      this.ws = resp.webSocket;
      if (!this.ws) {
        console.error('Failed to establish WebSocket connection');
        return;
      }

      this.ws.accept();
      console.log('Discord Gateway WebSocket connected');

      this.ws.addEventListener('message', async (event) => {
        await this.handleMessage(event);
      });

      this.ws.addEventListener('close', () => {
        console.log('Discord Gateway WebSocket closed');
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.ws = null;
        // Attempt reconnection after a delay
        setTimeout(() => this.connect(), 5000);
      });

      this.ws.addEventListener('error', (error) => {
        console.error('Discord Gateway WebSocket error:', error);
      });

    } catch (error) {
      console.error('Failed to connect to Discord Gateway:', error);
    }
  }

  async handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.sequenceNumber = data.s ?? this.sequenceNumber;

      switch (data.op) {
        case OPCODES.HELLO:
          await this.handleHello(data.d);
          break;

        case OPCODES.DISPATCH:
          await this.handleDispatch(data.t, data.d);
          break;

        case OPCODES.HEARTBEAT_ACK:
          // Heartbeat acknowledged
          break;

        case OPCODES.INVALID_SESSION:
        case OPCODES.RECONNECT:
          if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
          this.ws.close();
          break;
      }
    } catch (error) {
      console.error('Error processing Gateway message:', error);
    }
  }

  async handleHello(data) {
    // Start heartbeat
    const interval = data.heartbeat_interval;
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          op: OPCODES.HEARTBEAT,
          d: this.sequenceNumber,
        }));
      }
    }, interval);

    // Send IDENTIFY
    this.ws.send(JSON.stringify({
      op: OPCODES.IDENTIFY,
      d: {
        token: this.env.DISCORD_TOKEN,
        intents: (1 << 0) | (1 << 9) | (1 << 10) | (1 << 15), // GUILDS | GUILD_MESSAGES | GUILD_MESSAGE_REACTIONS | MESSAGE_CONTENT
        properties: {
          $os: 'cloudflare',
          $browser: 'workers',
          $device: 'workers',
        },
      },
    }));
  }

  async handleDispatch(eventType, data) {
    switch (eventType) {
      case 'READY':
        console.log('Discord Gateway ready');
        break;
      case 'MESSAGE_REACTION_ADD':
        await this.handleReactionAdd(data);
        break;
      case 'MESSAGE_REACTION_REMOVE':
        await this.handleReactionRemove(data);
        break;
    }
  }

  async handleReactionAdd(data) {
    if (data.emoji.name !== STAR_EMOJI) return;

    const messageId = data.message_id;
    const channelId = data.channel_id;
    const userId = data.user_id;

    // Get bot user
    const botUser = await this.getBotUser();
    if (userId === botUser.id) return;

    // Get or create entry
    let entry = await this.getStarboardEntry(messageId);
    
    // Fetch the message
    const message = await this.fetchMessage(channelId, messageId);
    if (!message) return;

    // Don't star bot messages or messages in starboard channel
    if (message.author.bot) return;
    if (this.env.STARBOARD_CHANNEL_ID && channelId === this.env.STARBOARD_CHANNEL_ID) return;

    if (!entry) {
      await this.createStarboardEntry(messageId, channelId, message.author.id);
      entry = await this.getStarboardEntry(messageId);
    }

    // Count stars
    const starCount = await this.countStars(channelId, messageId);
    await this.updateStarCount(messageId, starCount);

    const threshold = Math.min(Math.max(parseInt(this.env.STAR_THRESHOLD || '3', 10), 1), 100);

    // Update bot reactions
    await this.updateBotReactions(channelId, messageId, starCount, threshold, !!entry.starboard_message_id);

    // Post to starboard if threshold reached
    if (starCount >= threshold && !entry.starboard_message_id && this.env.STARBOARD_CHANNEL_ID) {
      const starboardMessageId = await this.postToStarboard(message, starCount);
      if (starboardMessageId) {
        await this.updateStarboardMessageId(messageId, starboardMessageId);
        await this.updateBotReactions(channelId, messageId, starCount, threshold, true);
      }
    } else if (entry.starboard_message_id && this.env.STARBOARD_CHANNEL_ID) {
      await this.updateStarboardPost(entry.starboard_message_id, message, starCount);
    }
  }

  async handleReactionRemove(data) {
    if (data.emoji.name !== STAR_EMOJI) return;

    const messageId = data.message_id;
    const channelId = data.channel_id;

    const entry = await this.getStarboardEntry(messageId);
    if (!entry) return;

    const starCount = await this.countStars(channelId, messageId);
    await this.updateStarCount(messageId, starCount);

    const threshold = Math.min(Math.max(parseInt(this.env.STAR_THRESHOLD || '3', 10), 1), 100);

    await this.updateBotReactions(channelId, messageId, starCount, threshold, !!entry.starboard_message_id);

    if (entry.starboard_message_id && this.env.STARBOARD_CHANNEL_ID) {
      const message = await this.fetchMessage(channelId, messageId);
      if (message) {
        await this.updateStarboardPost(entry.starboard_message_id, message, starCount);
      }
    }
  }

  // Database operations
  async getStarboardEntry(messageId) {
    const result = await this.env.DB.prepare(
      'SELECT * FROM starboard_messages WHERE message_id = ?'
    ).bind(messageId).first();
    return result;
  }

  async createStarboardEntry(messageId, channelId, authorId) {
    await this.env.DB.prepare(
      'INSERT INTO starboard_messages (message_id, channel_id, author_id, star_count) VALUES (?, ?, ?, 0)'
    ).bind(messageId, channelId, authorId).run();
  }

  async updateStarCount(messageId, starCount) {
    await this.env.DB.prepare(
      'UPDATE starboard_messages SET star_count = ?, updated_at = CURRENT_TIMESTAMP WHERE message_id = ?'
    ).bind(starCount, messageId).run();
  }

  async updateStarboardMessageId(messageId, starboardMessageId) {
    await this.env.DB.prepare(
      'UPDATE starboard_messages SET starboard_message_id = ?, updated_at = CURRENT_TIMESTAMP WHERE message_id = ?'
    ).bind(starboardMessageId, messageId).run();
  }

  // Discord API helpers
  async getBotUser() {
    const resp = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { 'Authorization': `Bot ${this.env.DISCORD_TOKEN}` }
    });
    return await resp.json();
  }

  async fetchMessage(channelId, messageId) {
    const resp = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
      headers: { 'Authorization': `Bot ${this.env.DISCORD_TOKEN}` }
    });
    if (!resp.ok) return null;
    return await resp.json();
  }

  async countStars(channelId, messageId) {
    const message = await this.fetchMessage(channelId, messageId);
    if (!message || !message.reactions) return 0;
    
    const starReaction = message.reactions.find(r => r.emoji.name === STAR_EMOJI);
    return starReaction ? starReaction.count : 0;
  }

  async addReaction(channelId, messageId, emoji) {
    await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bot ${this.env.DISCORD_TOKEN}` }
      }
    );
  }

  async removeReaction(channelId, messageId, emoji) {
    await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bot ${this.env.DISCORD_TOKEN}` }
      }
    );
  }

  async updateBotReactions(channelId, messageId, starCount, threshold, isPosted) {
    try {
      const message = await this.fetchMessage(channelId, messageId);
      if (message && message.reactions) {
        for (const reaction of message.reactions) {
          if (reaction.me && (NUMBER_EMOJIS.includes(reaction.emoji.name) || reaction.emoji.name === '✅')) {
            await this.removeReaction(channelId, messageId, reaction.emoji.name);
          }
        }
      }

      if (isPosted) {
        await this.addReaction(channelId, messageId, '✅');
      } else {
        const starsNeeded = threshold - starCount;
        if (starsNeeded > 0 && starsNeeded <= 9) {
          await this.addReaction(channelId, messageId, NUMBER_EMOJIS[starsNeeded]);
        }
      }
    } catch (error) {
      console.error('Error updating bot reactions:', error);
    }
  }

  async postToStarboard(message, starCount) {
    const embed = this.createStarboardEmbed(message, starCount);
    
    const resp = await fetch(`https://discord.com/api/v10/channels/${this.env.STARBOARD_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${this.env.DISCORD_TOKEN}`,
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

  async updateStarboardPost(starboardMessageId, message, starCount) {
    const embed = this.createStarboardEmbed(message, starCount);
    
    await fetch(`https://discord.com/api/v10/channels/${this.env.STARBOARD_CHANNEL_ID}/messages/${starboardMessageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bot ${this.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: `${STAR_EMOJI} **${starCount}** <#${message.channel_id}>`,
        embeds: [embed]
      })
    });
  }

  createStarboardEmbed(message, starCount) {
    const color = starCount >= 10 ? STAR_COLOR_GOLD : starCount >= 5 ? STAR_COLOR_ORANGE : STAR_COLOR_YELLOW;
    
    const embed = {
      author: {
        name: message.author.discriminator !== '0' 
          ? `${message.author.username}#${message.author.discriminator}`
          : message.author.username,
        icon_url: message.author.avatar 
          ? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`
          : undefined
      },
      description: message.content || '*[No text content]*',
      color: color,
      fields: [{
        name: 'Source',
        value: `[Jump to message](https://discord.com/channels/${message.guild_id}/${message.channel_id}/${message.id})`
      }],
      timestamp: message.timestamp
    };

    if (message.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0];
      if (attachment.content_type && attachment.content_type.startsWith('image/')) {
        embed.image = { url: attachment.url };
      }
    }

    if (message.embeds && message.embeds.length > 0 && message.embeds[0].image) {
      embed.image = { url: message.embeds[0].image.url };
    }

    return embed;
  }
}
