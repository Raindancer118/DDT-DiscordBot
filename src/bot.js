import 'dotenv/config';
import { Client, GatewayIntentBits, EmbedBuilder, PartialTypes } from 'discord.js';
import { log } from './lib/logger.js';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const STARBOARD_CHANNEL_ID = process.env.STARBOARD_CHANNEL_ID;
const STAR_THRESHOLD = parseInt(process.env.STAR_THRESHOLD || '3', 10);
const STAR_EMOJI = '⭐';

// Initialize database
let db;
try {
  db = new Database(process.env.DB_PATH || './starboard.db');
  log.info('Database connected');
  
  // Run migrations
  const migrationSQL = readFileSync(join(__dirname, 'db', 'starboard_migration.sql'), 'utf-8');
  db.exec(migrationSQL);
  log.info('Starboard migration applied');
} catch (err) {
  log.error('Failed to initialize database:', err);
  process.exit(1);
}

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [PartialTypes.Message, PartialTypes.Channel, PartialTypes.Reaction]
});

// Helper function to get or create starboard entry
function getStarboardEntry(messageId) {
  return db.prepare('SELECT * FROM starboard_messages WHERE message_id = ?').get(messageId);
}

function createStarboardEntry(messageId, channelId, authorId) {
  const stmt = db.prepare(`
    INSERT INTO starboard_messages (message_id, channel_id, author_id, star_count)
    VALUES (?, ?, ?, 0)
  `);
  stmt.run(messageId, channelId, authorId);
}

function updateStarCount(messageId, starCount) {
  const stmt = db.prepare(`
    UPDATE starboard_messages 
    SET star_count = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE message_id = ?
  `);
  stmt.run(starCount, messageId);
}

function updateStarboardMessageId(messageId, starboardMessageId) {
  const stmt = db.prepare(`
    UPDATE starboard_messages 
    SET starboard_message_id = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE message_id = ?
  `);
  stmt.run(starboardMessageId, messageId);
}

// Helper function to count stars on a message
async function countStars(reaction) {
  try {
    // Fetch the reaction if it's partial
    if (reaction.partial) {
      await reaction.fetch();
    }
    return reaction.count || 0;
  } catch (error) {
    log.error('Error counting stars:', error);
    return 0;
  }
}

// Helper function to create starboard embed
function createStarboardEmbed(message, starCount) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: message.author.tag,
      iconURL: message.author.displayAvatarURL()
    })
    .setDescription(message.content || '*[No text content]*')
    .setColor(starCount >= 10 ? 0xFFD700 : starCount >= 5 ? 0xFFA500 : 0xFFFF00)
    .addFields({
      name: 'Source',
      value: `[Jump to message](${message.url})`,
      inline: false
    })
    .setTimestamp(message.createdAt);

  // Add image if present
  if (message.attachments.size > 0) {
    const attachment = message.attachments.first();
    if (attachment.contentType?.startsWith('image/')) {
      embed.setImage(attachment.url);
    }
  }

  // Add embedded image if present
  if (message.embeds.length > 0 && message.embeds[0].image) {
    embed.setImage(message.embeds[0].image.url);
  }

  return embed;
}

// Helper function to update bot reactions
async function updateBotReactions(message, starCount, isPosted) {
  try {
    // Remove all bot reactions first
    const botReactions = message.reactions.cache.filter(r => r.me);
    for (const reaction of botReactions.values()) {
      await reaction.users.remove(client.user.id);
    }

    if (isPosted) {
      // Add green checkmark if posted
      await message.react('✅');
    } else {
      // Calculate stars needed
      const starsNeeded = STAR_THRESHOLD - starCount;
      if (starsNeeded > 0 && starsNeeded <= 9) {
        // React with number emoji showing stars left
        const numberEmojis = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
        await message.react(numberEmojis[starsNeeded]);
      }
    }
  } catch (error) {
    log.error('Error updating bot reactions:', error);
  }
}

// Handle reaction add
async function handleReactionAdd(reaction, user) {
  try {
    // Ignore bot reactions
    if (user.bot) return;

    // Fetch partial data
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (reaction.message.partial) {
      await reaction.message.fetch();
    }

    // Only handle star emoji
    if (reaction.emoji.name !== STAR_EMOJI) return;

    const message = reaction.message;

    // Don't star bot messages or messages in starboard channel
    if (message.author.bot) return;
    if (STARBOARD_CHANNEL_ID && message.channel.id === STARBOARD_CHANNEL_ID) return;

    // Get or create starboard entry
    let entry = getStarboardEntry(message.id);
    if (!entry) {
      createStarboardEntry(message.id, message.channel.id, message.author.id);
      entry = getStarboardEntry(message.id);
    }

    // Count current stars
    const starCount = await countStars(reaction);
    updateStarCount(message.id, starCount);

    log.info(`Message ${message.id} now has ${starCount} stars (threshold: ${STAR_THRESHOLD})`);

    // Update bot reactions
    const isPosted = !!entry.starboard_message_id;
    await updateBotReactions(message, starCount, isPosted);

    // Check if we should post to starboard
    if (!STARBOARD_CHANNEL_ID) {
      log.warn('STARBOARD_CHANNEL_ID not configured');
      return;
    }

    if (starCount >= STAR_THRESHOLD && !entry.starboard_message_id) {
      // Post to starboard
      const starboardChannel = await client.channels.fetch(STARBOARD_CHANNEL_ID);
      if (!starboardChannel || !starboardChannel.isTextBased()) {
        log.error('Starboard channel not found or not a text channel');
        return;
      }

      const embed = createStarboardEmbed(message, starCount);
      const starboardMessage = await starboardChannel.send({
        content: `${STAR_EMOJI} **${starCount}** ${message.channel}`,
        embeds: [embed]
      });

      updateStarboardMessageId(message.id, starboardMessage.id);
      log.info(`Posted message ${message.id} to starboard`);

      // Update bot reactions to show green checkmark
      await updateBotReactions(message, starCount, true);

    } else if (entry.starboard_message_id) {
      // Update existing starboard message
      try {
        const starboardChannel = await client.channels.fetch(STARBOARD_CHANNEL_ID);
        const starboardMessage = await starboardChannel.messages.fetch(entry.starboard_message_id);
        
        const embed = createStarboardEmbed(message, starCount);
        await starboardMessage.edit({
          content: `${STAR_EMOJI} **${starCount}** ${message.channel}`,
          embeds: [embed]
        });

        log.info(`Updated starboard message for ${message.id}`);
      } catch (error) {
        log.error('Error updating starboard message:', error);
      }
    }
  } catch (error) {
    log.error('Error handling reaction add:', error);
  }
}

// Handle reaction remove
async function handleReactionRemove(reaction, user) {
  try {
    // Ignore bot reactions
    if (user.bot) return;

    // Fetch partial data
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (reaction.message.partial) {
      await reaction.message.fetch();
    }

    // Only handle star emoji
    if (reaction.emoji.name !== STAR_EMOJI) return;

    const message = reaction.message;
    const entry = getStarboardEntry(message.id);
    
    if (!entry) return;

    // Count current stars
    const starCount = await countStars(reaction);
    updateStarCount(message.id, starCount);

    log.info(`Message ${message.id} now has ${starCount} stars after removal`);

    // Update bot reactions
    const isPosted = !!entry.starboard_message_id;
    await updateBotReactions(message, starCount, isPosted);

    // Update starboard message if it exists
    if (entry.starboard_message_id && STARBOARD_CHANNEL_ID) {
      try {
        const starboardChannel = await client.channels.fetch(STARBOARD_CHANNEL_ID);
        const starboardMessage = await starboardChannel.messages.fetch(entry.starboard_message_id);
        
        const embed = createStarboardEmbed(message, starCount);
        await starboardMessage.edit({
          content: `${STAR_EMOJI} **${starCount}** ${message.channel}`,
          embeds: [embed]
        });

        log.info(`Updated starboard message for ${message.id}`);
      } catch (error) {
        log.error('Error updating starboard message after removal:', error);
      }
    }
  } catch (error) {
    log.error('Error handling reaction remove:', error);
  }
}

// Event handlers
client.on('ready', () => {
  log.info(`Logged in as ${client.user.tag}`);
  log.info(`Starboard configured with threshold: ${STAR_THRESHOLD}`);
  if (STARBOARD_CHANNEL_ID) {
    log.info(`Starboard channel ID: ${STARBOARD_CHANNEL_ID}`);
  } else {
    log.warn('STARBOARD_CHANNEL_ID not set - starboard will not post messages');
  }
});

client.on('messageReactionAdd', handleReactionAdd);
client.on('messageReactionRemove', handleReactionRemove);

client.on('error', (error) => {
  log.error('Discord client error:', error);
});

// Login
const token = process.env.DISCORD_TOKEN;
if (!token) {
  log.error('DISCORD_TOKEN not found in environment');
  process.exit(1);
}

client.login(token).catch(err => {
  log.error('Failed to login:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  log.info('Shutting down gracefully...');
  client.destroy();
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log.info('Shutting down gracefully...');
  client.destroy();
  db.close();
  process.exit(0);
});
