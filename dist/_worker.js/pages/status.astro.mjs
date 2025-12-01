globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                  */
import { e as createComponent, f as createAstro, h as addAttribute, n as renderHead, o as renderSlot, r as renderTemplate, p as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_DIId5cqJ.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro$1 = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="description" content="Astro description"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title}</title>${renderHead()}</head> <body class="bg-gray-900 text-white font-sans"> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "/media/data/Dokumente/Development/DDT-DiscordBot/src/layouts/Layout.astro", void 0);

const $$Astro = createAstro();
const $$Status = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Status;
  const env = Astro2.locals.runtime.env;
  let discordStatus = "Unknown";
  let guilds = [];
  let errorMsg = "";
  try {
    const userResp = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${env.DISCORD_TOKEN}` }
    });
    if (userResp.ok) {
      discordStatus = "Online";
      const guildsResp = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: { Authorization: `Bot ${env.DISCORD_TOKEN}` }
      });
      if (guildsResp.ok) {
        guilds = await guildsResp.json();
      }
    } else {
      discordStatus = "Unreachable";
      errorMsg = `Discord API Error: ${userResp.status}`;
    }
  } catch (e) {
    discordStatus = "Error";
    errorMsg = e.message;
  }
  const functionalities = [
    { name: "Slash Commands", status: "Operational", icon: "\u26A1" },
    { name: "Status Page", status: "Operational", icon: "\u{1F4CA}" },
    { name: "Discord Gateway", status: discordStatus === "Online" ? "Operational" : "Outage", icon: "\u{1F50C}" }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "DDT Bot Status" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-gray-800"> <div class="w-full max-w-3xl bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 overflow-hidden"> <!-- Header --> <div class="p-8 text-center border-b border-gray-700 bg-gray-800/80"> <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
Dumb Decision TTRPG Bot
</h1> <p class="text-gray-400 text-lg">System Status Dashboard</p> </div> <div class="p-8 space-y-8"> <!-- System Status --> <section> <h2 class="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2"> <span class="w-2 h-6 bg-blue-500 rounded-full"></span>
System Status
</h2> <div class="grid gap-4 md:grid-cols-2"> <div class="bg-gray-700/50 p-4 rounded-xl border border-gray-600 flex justify-between items-center"> <span class="text-gray-300">Worker Status</span> <span class="flex items-center gap-2 text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-full text-sm"> <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
Online
</span> </div> <div class="bg-gray-700/50 p-4 rounded-xl border border-gray-600 flex justify-between items-center"> <span class="text-gray-300">Discord API</span> <span${addAttribute(`flex items-center gap-2 font-bold px-3 py-1 rounded-full text-sm ${discordStatus === "Online" ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`, "class")}> <span${addAttribute(`w-2 h-2 rounded-full ${discordStatus === "Online" ? "bg-green-400 animate-pulse" : "bg-red-400"}`, "class")}></span> ${discordStatus} </span> </div> </div> ${errorMsg && renderTemplate`<div class="mt-2 text-red-400 text-sm bg-red-400/10 p-2 rounded border border-red-400/20">${errorMsg}</div>`} </section> <!-- Functionalities --> <section> <h2 class="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2"> <span class="w-2 h-6 bg-purple-500 rounded-full"></span>
Services
</h2> <div class="grid gap-3"> ${functionalities.map((f) => renderTemplate`<div class="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50 flex justify-between items-center hover:bg-gray-700/50 transition-colors"> <div class="flex items-center gap-3"> <span class="text-2xl">${f.icon}</span> <span class="text-gray-200 font-medium">${f.name}</span> </div> <span${addAttribute(`font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider ${f.status === "Operational" ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`, "class")}> ${f.status} </span> </div>`)} </div> </section> <!-- Deployed Servers --> <section> <h2 class="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2"> <span class="w-2 h-6 bg-pink-500 rounded-full"></span>
Deployed Servers <span class="text-gray-500 text-sm font-normal ml-2">(${guilds.length})</span> </h2> <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"> ${guilds.map((g) => renderTemplate`<div class="bg-gray-700/30 p-3 rounded-xl border border-gray-600/50 flex items-center gap-3 hover:bg-gray-700/50 transition-all hover:scale-[1.02]"> ${g.icon ? renderTemplate`<img${addAttribute(`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`, "src")}${addAttribute(g.name, "alt")} class="w-10 h-10 rounded-full shadow-md">` : renderTemplate`<div class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold shadow-md"> ${g.name.substring(0, 2)} </div>`} <span class="text-gray-200 font-medium truncate">${g.name}</span> </div>`)} ${guilds.length === 0 && renderTemplate`<div class="col-span-full text-center py-8 text-gray-500 italic bg-gray-700/20 rounded-xl border border-gray-700 border-dashed">
No servers found or unable to fetch list.
</div>`} </div> </section> </div> <!-- Footer --> <div class="p-4 text-center text-gray-500 text-sm border-t border-gray-700 bg-gray-800/80">
Powered by Cloudflare Workers & Astro
</div> </div> </main> ` })}`;
}, "/media/data/Dokumente/Development/DDT-DiscordBot/src/pages/status.astro", void 0);

const $$file = "/media/data/Dokumente/Development/DDT-DiscordBot/src/pages/status.astro";
const $$url = "/status";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Status,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
