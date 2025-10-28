const EPHEMERAL_FLAG = 1 << 6;
const MANAGE_MESSAGES = 8192; // Permission bit for Manage Messages

export const definition = {
  name: 'clear',
  description: 'Deletes messages from the channel.',
  default_member_permissions: MANAGE_MESSAGES.toString(),
  dm_permission: false,
  options: [
    {
      type: 3,
      name: 'amount',
      description: 'Number of messages to delete, or type "all" to clear the entire channel.',
      required: true
    }
  ]
};

const API_BASE = 'https://discord.com/api/v10';
const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;

function buildDeferredResponse() {
  return {
    type: 5,
    data: {
      flags: EPHEMERAL_FLAG
    }
  };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function discordRequest(env, path, init = {}) {
  if (!env.DISCORD_TOKEN) {
    throw new Error('Missing DISCORD_TOKEN environment variable.');
  }
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bot ${env.DISCORD_TOKEN}`);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${path}`;

  while (true) {
    const res = await fetch(url, { ...init, headers });
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      const retry = Math.ceil((data.retry_after ?? 1) * 1000);
      console.warn('Hit Discord rate limit. Retrying after', retry, 'ms');
      await sleep(retry);
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord API ${init.method || 'GET'} ${path} failed: ${res.status} ${text}`);
    }
    return res;
  }
}

async function updateOriginalMessage(interaction, env, content) {
  const url = `/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;
  await discordRequest(env, url, {
    method: 'PATCH',
    body: JSON.stringify({ content })
  });
}

function parseAmount(raw) {
  if (raw === 'all') return Infinity;
  const value = parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1) {
    throw new Error('Please provide a valid number greater than 0, or type "all".');
  }
  return value;
}

async function fetchMessages(env, channelId, limit, before) {
  const params = new URLSearchParams({ limit: Math.min(limit, 100).toString() });
  if (before) params.set('before', before);
  const res = await discordRequest(env, `/channels/${channelId}/messages?${params.toString()}`);
  return res.json();
}

async function bulkDelete(env, channelId, ids) {
  if (ids.length === 0) return 0;
  if (ids.length === 1) {
    await discordRequest(env, `/channels/${channelId}/messages/${ids[0]}`, { method: 'DELETE' });
    return 1;
  }
  await discordRequest(env, `/channels/${channelId}/messages/bulk-delete`, {
    method: 'POST',
    body: JSON.stringify({ messages: ids })
  });
  return ids.length;
}

async function deleteIndividually(env, channelId, ids) {
  let deleted = 0;
  for (const id of ids) {
    try {
      await discordRequest(env, `/channels/${channelId}/messages/${id}`, { method: 'DELETE' });
      deleted += 1;
      await sleep(1000);
    } catch (err) {
      if (err.message?.includes('10008')) {
        console.warn('Message already deleted:', id);
      } else {
        throw err;
      }
    }
  }
  return deleted;
}

async function performDeletion(interaction, env, target) {
  const channelId = interaction.channel_id;
  let totalDeleted = 0;
  let before = null;

  await updateOriginalMessage(
    interaction,
    env,
    `🧹 Preparing to clear up to ${target === Infinity ? 'all' : target} messages...`
  );

  while (totalDeleted < target) {
    const remaining = target === Infinity ? Infinity : target - totalDeleted;
    const batchLimit = Math.min(remaining === Infinity ? 100 : remaining, 100);
    const messages = await fetchMessages(env, channelId, batchLimit, before);

    if (!Array.isArray(messages) || messages.length === 0) break;

    before = messages[messages.length - 1].id;

    const now = Date.now();
    const recent = [];
    const old = [];

    for (const msg of messages) {
      const age = now - Date.parse(msg.timestamp);
      if (age < TWO_WEEKS) {
        recent.push(msg.id);
      } else {
        old.push(msg.id);
      }
    }

    if (recent.length) {
      const deleted = await bulkDelete(env, channelId, recent);
      totalDeleted += deleted;
      await updateOriginalMessage(
        interaction,
        env,
        `🧹 Cleared ${totalDeleted} messages... (fast-deleting recent ones)`
      );
    }

    if (old.length) {
      const deleted = await deleteIndividually(env, channelId, old);
      totalDeleted += deleted;
      await updateOriginalMessage(
        interaction,
        env,
        `🧹 Cleared ${totalDeleted} messages... (slow-deleting old ones)`
      );
    }

    if (messages.length < batchLimit) {
      break;
    }

    await sleep(1000);
  }

  await updateOriginalMessage(
    interaction,
    env,
    `✅ All done! Successfully deleted a total of **${totalDeleted}** messages.`
  );
}

export async function handle(interaction, env, ctx) {
  const option = interaction.data.options?.find(o => o.name === 'amount');
  const rawAmount = option?.value?.toLowerCase();
  if (!rawAmount) {
    return {
      type: 4,
      data: {
        content: 'Please provide how many messages to delete, or "all".',
        flags: EPHEMERAL_FLAG
      }
    };
  }

  let target;
  try {
    target = parseAmount(rawAmount);
  } catch (err) {
    return {
      type: 4,
      data: {
        content: err.message || 'Please provide a valid number greater than 0, or type "all".',
        flags: EPHEMERAL_FLAG
      }
    };
  }

  ctx.waitUntil(
    performDeletion(interaction, env, target).catch(async (err) => {
      console.error('Error executing /clear command', err);
      try {
        await updateOriginalMessage(
          interaction,
          env,
          `❌ An error occurred while deleting messages. Some messages may remain.\n\n${err.message || err}`
        );
      } catch (innerErr) {
        console.error('Failed to update interaction response after error', innerErr);
      }
    })
  );

  return buildDeferredResponse();
}
