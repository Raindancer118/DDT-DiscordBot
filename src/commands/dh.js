const EPHEMERAL_FLAG = 1 << 6;

const EMO = { sun: '🌟', die: '🎲', fear: '🫧', hope: '✨', warn: '⚠️', crit: '🎉' };
const COLOR = { hope: 0xFEE75C, fear: 0x5865F2, neutral: 0x2B2D31, crit: 0x57F287 };

export const definition = {
  name: 'dh',
  description: 'Daggerheart tools',
  options: [
    {
      type: 1,
      name: 'roll',
      description: 'Daggerheart Hope+Fear roll or a custom dice expression.',
      options: [
        {
          type: 3,
          name: 'expr',
          description: 'Dice expression, e.g., "4d8 + 10d12 + 2"',
          required: false
        },
        {
          type: 4,
          name: 'sides',
          description: 'DH die size (e.g., 12, 20, 10). Default 12 if no expr.',
          required: false
        },
        {
          type: 4,
          name: 'mod',
          description: 'Modifier to add (e.g., +2 or -1).',
          required: false
        },
        {
          type: 4,
          name: 'dc',
          description: 'Difficulty to meet/beat.',
          required: false
        },
        {
          type: 5,
          name: 'secret',
          description: 'Send only to you (ephemeral).',
          required: false
        },
        {
          type: 5,
          name: 'animate',
          description: 'Show a short roll animation (not supported on Workers).',
          required: false
        }
      ]
    }
  ]
};

function d(n) { return Math.floor(Math.random() * n) + 1; }
function sum(a) { return a.reduce((x, y) => x + y, 0); }

function parseDiceExpr(exprRaw) {
  const expr = exprRaw.replace(/\s+/g, '').toLowerCase();
  const tokens = expr.match(/[+\-]?[^+\-]+/g);
  if (!tokens) throw new Error('Invalid expression');
  const terms = []; let total = 0;

  for (let tok of tokens) {
    const sign = tok.startsWith('-') ? -1 : 1;
    tok = tok.replace(/^[-+]/, '');
    const m = tok.match(/^(\d*)d(\d+)$/);
    if (m) {
      const count = m[1] ? parseInt(m[1], 10) : 1;
      const sides = parseInt(m[2], 10);
      if (!(count > 0 && sides > 0)) throw new Error('Bad dice term: ' + tok);
      const rolls = Array.from({ length: count }, () => d(sides));
      terms.push({ kind: 'dice', count, sides, rolls, sign });
      total += sign * sum(rolls);
    } else {
      const val = parseInt(tok, 10);
      if (!Number.isFinite(val)) throw new Error('Bad token: ' + tok);
      terms.push({ kind: 'const', value: val, sign });
      total += sign * val;
    }
  }
  return { terms, total };
}

function buildDhEmbed({ userName, hope, fear, sides, mod, dc, critHit, timestamp }) {
  const total = hope + fear + mod;
  const fearWins = fear >= hope;

  let title;
  const desc = [];

  if (critHit) {
    title = `${EMO.crit} Critical Hit! [ ${total} ]`;
    desc.push(`**Both dice landed on ${hope}!**`);
    desc.push(`You gain a Hope point ${EMO.hope}.`);
  } else {
    title = `[ ${total} with ${fearWins ? 'Fear' : 'Hope'} ${fearWins ? EMO.fear : EMO.hope} ]`;
    desc.push(
      fearWins
        ? `The GM would get a fear point ${EMO.fear} or take an action.`
        : `A moment of hope shines ${EMO.hope}.`
    );
  }

  if (dc !== null && dc !== undefined) {
    const outcome = critHit || total >= dc ? 'Success ✅' : 'Fail ❌';
    desc.push(`**DC ${dc}** → **${outcome}**`);
  }

  return {
    author: { name: 'Daggerheart Dice' },
    title,
    description: desc.join('\n'),
    fields: [
      { name: `${EMO.sun} Player Hope Dices`, value: `Base: (d${sides})`, inline: true },
      { name: `Dice to Roll`, value: `Hope: (d${sides})\nFear: (d${sides})`, inline: true },
      {
        name: 'Result',
        value: `Hope: **${hope}** (d${sides}), Fear: **${fear}** (d${sides}), Mod: **${mod >= 0 ? `+${mod}` : mod}**\n**= ${total}**`
      }
    ],
    footer: { text: userName },
    timestamp: timestamp.toISOString(),
    color: critHit ? COLOR.crit : (fearWins ? COLOR.fear : COLOR.hope)
  };
}

function buildExprEmbed({ userName, expr, terms, subtotalNoMod, mod, dc, total, critHit, timestamp }) {
  const title = `[ ${total} ]`;
  const parts = terms.map(t =>
    t.kind === 'dice'
      ? `${t.sign < 0 ? '-' : '+'} ${t.count}d${t.sides} → [${t.rolls.join(', ')}] = ${t.sign * sum(t.rolls)}`
      : `${t.sign < 0 ? '-' : '+'} ${t.value}`
  );

  const lines = [];
  if (critHit) lines.push(`${EMO.crit} **Critical Success!**`);
  lines.push('**Breakdown**');
  lines.push(parts.join('\n'));
  lines.push(`\nSubtotal (no mod): **${subtotalNoMod}**`);
  lines.push(`Modifier: **${mod >= 0 ? `+${mod}` : mod}**`);
  if (dc !== null && dc !== undefined) {
    lines.push(`**DC ${dc}** → **${total >= dc ? 'Success ✅' : 'Fail ❌'}**`);
  }

  return {
    author: { name: 'Dice Roller' },
    title,
    description: `${EMO.die} \`${expr}\``,
    fields: [{ name: 'Result', value: lines.join('\n') }],
    footer: { text: userName },
    timestamp: timestamp.toISOString(),
    color: critHit ? COLOR.crit : COLOR.neutral
  };
}

function optionValue(options, name) {
  const opt = options?.find(o => o.name === name);
  return opt ? opt.value : undefined;
}

function buildMessage({ content = null, embeds = [], ephemeral = false }) {
  const data = {};
  if (content) data.content = content;
  if (embeds.length) data.embeds = embeds;
  if (ephemeral) data.flags = EPHEMERAL_FLAG;
  return { type: 4, data };
}

export async function handle(interaction) {
  const subcommand = interaction.data.options?.find(o => o.type === 1);
  if (!subcommand || subcommand.name !== 'roll') {
    return buildMessage({ content: 'Unknown subcommand.', ephemeral: true });
  }

  const options = subcommand.options || [];
  const expr = optionValue(options, 'expr');
  const sides = optionValue(options, 'sides') ?? 12;
  const mod = optionValue(options, 'mod') ?? 0;
  const dc = optionValue(options, 'dc');
  const secret = optionValue(options, 'secret') ?? false;

  const userName = interaction.member?.nick
    || interaction.member?.user?.global_name
    || interaction.member?.user?.username
    || interaction.user?.username
    || 'Unknown Adventurer';
  const now = new Date();

  try {
    if (expr && expr.trim()) {
      const parsed = parseDiceExpr(expr);
      const subtotal = parsed.total;
      const total = subtotal + mod;
      const critHit = false;

      const finalEmbed = buildExprEmbed({
        userName,
        expr,
        terms: parsed.terms,
        subtotalNoMod: subtotal,
        mod,
        dc,
        total,
        critHit,
        timestamp: now
      });

      return buildMessage({ embeds: [finalEmbed], ephemeral: secret });
    }

    const hope = d(sides);
    const fear = d(sides);
    const critHit = hope === fear;

    const finalEmbed = buildDhEmbed({
      userName,
      hope,
      fear,
      sides,
      mod,
      dc,
      critHit,
      timestamp: now
    });

    return buildMessage({ embeds: [finalEmbed], ephemeral: secret });
  } catch (err) {
    console.error('Error running /dh roll', err);
    return buildMessage({
      content: 'Invalid dice expression. Examples: `2d6+3`, `4d8 + 10d12 - 2`, or leave empty for Daggerheart.',
      ephemeral: true
    });
  }
}
