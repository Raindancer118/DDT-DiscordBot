import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

/**
 * /dh roll
 * - Default: Daggerheart Hope+Fear (2d12), sum both, add modifier; Fear token if Fear >= Hope
 * - Options:
 *    expr   : free-form dice expression like "4d8 + 10d12 + 3"
 *    sides  : override DH die size (e.g., 20 for d20, 10 for d10; default 12). Ignored if expr is set.
 *    mod    : integer modifier added to total (works for both DH and expr)
 *    dc     : optional target difficulty
 *    secret : boolean → ephemeral
 *    animate: boolean → do a short “rolling…” animation
 */

export const data = new SlashCommandBuilder()
.setName('dh')
.setDescription('Daggerheart tools')
.addSubcommand(sc =>
sc.setName('roll')
.setDescription('Daggerheart Hope+Fear roll by default; supports custom dice expressions.')
.addStringOption(o => o.setName('expr').setDescription('Dice expression, e.g., "4d8 + 10d12 + 2"').setRequired(false))
.addIntegerOption(o => o.setName('sides').setDescription('DH die size (e.g., 12, 20, 10). Default 12 if no expr.').setRequired(false))
.addIntegerOption(o => o.setName('mod').setDescription('Modifier to add (e.g., +2 or -1)').setRequired(false))
.addIntegerOption(o => o.setName('dc').setDescription('Difficulty to meet/beat').setRequired(false))
.addBooleanOption(o => o.setName('secret').setDescription('Send only to you (ephemeral)').setRequired(false))
.addBooleanOption(o => o.setName('animate').setDescription('Show a short roll animation').setRequired(false))
);

const EMO = {
    sun: '🌟',
    die: '🎲',
    fear: '🫧',         // adjust to your taste (can be 🕯️/⚫ etc.)
    hope: '✨',
    warn: '⚠️'
};

function d(n) { return Math.floor(Math.random() * n) + 1; }
function sum(arr) { return arr.reduce((a, b) => a + b, 0); }

/**
 * Parse expressions like:
 *  "d20" | "2d6+3" | "4d8 + 10d12 - 2" | "3d6 + d8 + 5"
 * Returns a list of terms with roll arrays and constants, plus total.
 */
function parseDiceExpr(exprRaw) {
    const expr = exprRaw.replace(/\s+/g, '').toLowerCase();
    if (!expr) throw new Error('Empty expression');
    // Tokenize by +/-
    const tokens = expr.match(/[+\-]?[^+\-]+/g);
    if (!tokens) throw new Error('Invalid expression');

    const terms = [];
    let running = 0;

    for (let tok of tokens) {
        const sign = tok.startsWith('-') ? -1 : 1;
        tok = tok.replace(/^[-+]/, '');

        const m = tok.match(/^(\d*)d(\d+)$/); // NdM or dM
        if (m) {
            const count = m[1] ? parseInt(m[1], 10) : 1;
            const sides = parseInt(m[2], 10);
            if (!Number.isFinite(count) || !Number.isFinite(sides) || count <= 0 || sides <= 0)
                throw new Error('Bad dice term: ' + tok);
            const rolls = Array.from({ length: count }, () => d(sides));
            const subtotal = sum(rolls) * sign;
            terms.push({ kind: 'dice', count, sides, rolls, sign });
            running += subtotal;
            continue;
        }

        // Constant integer
        const val = parseInt(tok, 10);
        if (!Number.isFinite(val)) throw new Error('Bad token: ' + tok);
        running += sign * val;
        terms.push({ kind: 'const', value: val, sign });
    }

    return { terms, total: running };
}

/** Build a pretty embed in the style of your screenshot */
function buildDhEmbed({ userName, hope, fear, sides, mod, dc, timestamp }) {
    const total = hope + fear + mod;
    const fearWins = fear >= hope;
    const title = `[ ${total} with ${fearWins ? 'Fear' : 'Hope'} ${fearWins ? EMO.fear : EMO.hope} ]`;

    const descLines = [];
    descLines.push(fearWins
    ? `The GM would gain a fear point ${EMO.fear} or take an action.`
    : `A moment of hope shines ${EMO.hope}.`);
    if (dc !== null && dc !== undefined) {
        descLines.push(`**DC ${dc}** → **${total >= dc ? 'Success ✅' : 'Fail ❌'}**`);
    }

    const embed = new EmbedBuilder()
    .setAuthor({ name: 'Daggerheart Dice' })
    .setTitle(title)
    .setDescription(descLines.join('\n'))
    .addFields(
        { name: `${EMO.sun} Player Hope Dices`, value: `Base: (d${sides})`, inline: true },
               { name: `Dice to Roll`, value: `Hope: (d${sides})\nFear: (d${sides})`, inline: true },
               {
                   name: 'Result',
               value: `Hope: **${hope}** (d${sides}), Fear: **${fear}** (d${sides}), Mod: **${mod >= 0 ? `+${mod}` : mod}**\n**= ${total}**`,
               inline: false
               }
    )
    .setFooter({ text: userName })
    .setTimestamp(timestamp);

    // Add a subtle color cue
    embed.setColor(fearWins ? 0x5865F2 : 0xFEE75C); // blurple for fear, gold for hope
    return embed;
}

/** Embed for generic dice expressions */
function buildExprEmbed({ userName, expr, terms, subtotalNoMod, mod, dc, total, timestamp }) {
    const title = `[ ${total} ]`;
    const lines = [];

    // Per-term breakdown
    const parts = terms.map(t => {
        if (t.kind === 'dice') {
            const sign = t.sign < 0 ? '-' : '+';
            return `${sign} ${t.count}d${t.sides} → [${t.rolls.join(', ')}] = ${t.sign * sum(t.rolls)}`;
        } else {
            const sign = t.sign < 0 ? '-' : '+';
            return `${sign} ${t.value}`;
        }
    });

    lines.push('**Breakdown**');
    lines.push(parts.join('\n'));
    lines.push(`\nSubtotal (no mod): **${subtotalNoMod}**`);
    lines.push(`Modifier: **${mod >= 0 ? `+${mod}` : mod}**`);
    if (dc !== null && dc !== undefined) {
        lines.push(`**DC ${dc}** → **${total >= dc ? 'Success ✅' : 'Fail ❌'}**`);
    }

    const embed = new EmbedBuilder()
    .setAuthor({ name: 'Dice Roller' })
    .setTitle(title)
    .setDescription(`${EMO.die} \`${expr}\``)
    .addFields({ name: 'Result', value: lines.join('\n') })
    .setFooter({ text: userName })
    .setTimestamp(timestamp)
    .setColor(0x2B2D31);
    return embed;
}

/** Optional mini animation: 2 frames and a reveal */
async function animateReply(interaction, ephemeral, frames) {
    // If user asked for animation, show "rolling..." with small edits
    await interaction.deferReply({ ephemeral });
    // Frame 1
    await interaction.editReply(frames[0]);
    // small jitter so it feels alive
    await new Promise(r => setTimeout(r, 450));
    // Frame 2
    await interaction.editReply(frames[1]);
    await new Promise(r => setTimeout(r, 500));
    // Final will be sent by caller via editReply again
}

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== 'roll') return;

    const expr = interaction.options.getString('expr');
    const sides = interaction.options.getInteger('sides') ?? 12;
    const mod = interaction.options.getInteger('mod') ?? 0;
    const dc = interaction.options.getInteger('dc');
    const secret = interaction.options.getBoolean('secret') ?? false;
    const animate = interaction.options.getBoolean('animate') ?? false;

    const userName = `${interaction.user.username}`;
    const now = new Date();

    try {
        if (expr && expr.trim().length) {
            // Generic dice expression mode
            const parsed = parseDiceExpr(expr);
            const subtotal = parsed.total;
            const total = subtotal + mod;

            const finalEmbed = buildExprEmbed({
                userName,
                expr,
                terms: parsed.terms,
                subtotalNoMod: subtotal,
                mod,
                dc,
                total,
                timestamp: now
            });

            if (animate) {
                const frame1 = {
                    content: `${EMO.die} Rolling…`,
                    embeds: [new EmbedBuilder().setTitle('Rolling…').setColor(0x2B2D31)]
                };
                const frame2 = {
                    content: `${EMO.die} Rolling… ${EMO.die}`,
                    embeds: [new EmbedBuilder().setTitle('Almost there…').setColor(0x2B2D31)]
                };
                await animateReply(interaction, secret, [frame1, frame2]);
                return interaction.editReply({ content: null, embeds: [finalEmbed] });
            } else {
                return interaction.reply({ embeds: [finalEmbed], ephemeral: secret });
            }
        }

        // Default: Daggerheart Hope+Fear
        const hope = d(sides);
        const fear = d(sides);

        const finalEmbed = buildDhEmbed({
            userName,
            hope,
            fear,
            sides,
            mod,
            dc,
            timestamp: now
        });

        if (animate) {
            const f1 = {
                content: `${EMO.die} Rolling Hope…`,
                embeds: [new EmbedBuilder().setTitle(`Hope (d${sides})…`).setColor(0xFEE75C)]
            };
            const f2 = {
                content: `${EMO.die} Rolling Fear…`,
                embeds: [new EmbedBuilder().setTitle(`Fear (d${sides})…`).setColor(0x5865F2)]
            };
            await animateReply(interaction, secret, [f1, f2]);
            return interaction.editReply({ content: null, embeds: [finalEmbed] });
        } else {
            return interaction.reply({ embeds: [finalEmbed], ephemeral: secret });
        }
    } catch (err) {
        console.error(err);
        const msg = 'Invalid dice expression. Try examples like `2d6+3`, `4d8 + 10d12 - 2`, or leave empty for Daggerheart.';
        if (interaction.deferred || interaction.replied) {
            return interaction.followUp({ content: msg, ephemeral: true });
        }
        return interaction.reply({ content: msg, ephemeral: true });
    }
}
