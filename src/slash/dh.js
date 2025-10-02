import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

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

const EMO = { sun: '🌟', die: '🎲', fear: '🫧', hope: '✨', warn: '⚠️', crit: '🎉' };
const COLOR = { hope: 0xFEE75C, fear: 0x5865F2, neutral: 0x2B2D31, crit: 0x57F287 };

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
        const m = tok.match(/^(\d*)d(\d+)$/); // NdM or dM
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

function anyCritInTerms(terms, crit) {
    if (!crit) return false;
    for (const t of terms) if (t.kind === 'dice') {
        if (t.rolls.some(r => r >= crit)) return true;
    }
    return false;
}

function buildDhEmbed({ userName, hope, fear, sides, mod, dc, critHit, timestamp }) {
    const total = hope + fear + mod;
    const fearWins = fear >= hope;

    let title;
    const desc = [];

    // --- MODIFIED CRIT LOGIC ---
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
    // --- END MODIFICATION ---

    if (dc !== null && dc !== undefined) {
        desc.push(`**DC ${dc}** → **${total >= dc ? 'Success ✅' : 'Fail ❌'}**`);
    }

    const embed = new EmbedBuilder()
    .setAuthor({ name: 'Daggerheart Dice' })
    .setTitle(title)
    .setDescription(desc.join('\n'))
    .addFields(
        { name: `${EMO.sun} Player Hope Dices`, value: `Base: (d${sides})`, inline: true },
               { name: `Dice to Roll`, value: `Hope: (d${sides})\nFear: (d${sides})`, inline: true },
               {
                   name: 'Result',
                   value: `Hope: **${hope}** (d${sides}), Fear: **${fear}** (d${sides}), Mod: **${mod >= 0 ? `+${mod}` : mod}**\n**= ${total}**`
               }
    )
    .setFooter({ text: userName })
    .setTimestamp(timestamp)
    .setColor(critHit ? COLOR.crit : (fearWins ? COLOR.fear : COLOR.hope));

    return embed;
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

    return new EmbedBuilder()
    .setAuthor({ name: 'Dice Roller' })
    .setTitle(title)
    .setDescription(`${EMO.die} \`${expr}\``)
    .addFields({ name: 'Result', value: lines.join('\n') })
    .setFooter({ text: userName })
    .setTimestamp(timestamp)
    .setColor(critHit ? COLOR.crit : COLOR.neutral);
}

async function animateReply(interaction, ephemeral, frames) {
    await interaction.deferReply({ ephemeral });
    await interaction.editReply(frames[0]);
    await new Promise(r => setTimeout(r, 450));
    await interaction.editReply(frames[1]);
    await new Promise(r => setTimeout(r, 500));
}

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== 'roll') return;

    const expr = interaction.options.getString('expr');
    const sides = interaction.options.getInteger('sides') ?? 12;
    const mod = interaction.options.getInteger('mod') ?? 0;
    const dc = interaction.options.getInteger('dc');
    const crit = interaction.options.getInteger('crit'); // optional threshold from command
    const secret = interaction.options.getBoolean('secret') ?? false;
    const animate = interaction.options.getBoolean('animate') ?? false;

    const userName = `${interaction.user.username}`;
    const now = new Date();

    try {
        if (expr && expr.trim()) {
            const parsed = parseDiceExpr(expr);
            const subtotal = parsed.total;
            const total = subtotal + mod;
            const critHit = crit ? anyCritInTerms(parsed.terms, crit) : false;

            const finalEmbed = buildExprEmbed({
                userName, expr,
                terms: parsed.terms,
                subtotalNoMod: subtotal,
                mod, dc, total,
                critHit,
                timestamp: now
            });

            if (animate) {
                const frame1 = { content: '🎲 Rolling…', embeds: [new EmbedBuilder().setTitle('Rolling…').setColor(COLOR.neutral)] };
                const frame2 = { content: '🎲 Rolling… 🎲', embeds: [new EmbedBuilder().setTitle('Almost there…').setColor(COLOR.neutral)] };
                await animateReply(interaction, secret, [frame1, frame2]);
                return interaction.editReply({ content: null, embeds: [finalEmbed] });
            }
            return interaction.reply({ embeds: [finalEmbed], ephemeral: secret });
        }

        // Default Daggerheart
        const hope = d(sides);
        const fear = d(sides);

        // --- MODIFIED CRIT LOGIC ---
        // A crit now happens if both dice show the same number.
        const critHit = hope === fear;
        // --- END MODIFICATION ---

        const finalEmbed = buildDhEmbed({
            userName, hope, fear, sides, mod, dc, critHit, timestamp: now
        });

        if (animate) {
            const f1 = { content: '🎲 Rolling Hope…', embeds: [new EmbedBuilder().setTitle(`Hope (d${sides})…`).setColor(COLOR.hope)] };
            const f2 = { content: '🎲 Rolling Fear…', embeds: [new EmbedBuilder().setTitle(`Fear (d${sides})…`).setColor(COLOR.fear)] };
            await animateReply(interaction, secret, [f1, f2]);
            return interaction.editReply({ content: null, embeds: [finalEmbed] });
        }
        return interaction.reply({ embeds: [finalEmbed], ephemeral: secret });

    } catch (err) {
        console.error(err);
        const msg = 'Invalid dice expression. Examples: `2d6+3`, `4d8 + 10d12 - 2`, or leave empty for Daggerheart.';
        if (interaction.deferred || interaction.replied) {
            return interaction.followUp({ content: msg, ephemeral: true });
        }
        return interaction.reply({ content: msg, ephemeral: true });
    }
}
