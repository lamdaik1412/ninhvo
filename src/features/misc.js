export function registerMisc(bot, { utils }) {
  bot.command("echo", (ctx) => {
    const raw = utils.getArgs(ctx, "echo");
    if (!raw) return ctx.reply("Dùng: /echo [nội dung]");
    ctx.reply(utils.escapeMD(raw), { parse_mode: "MarkdownV2" });
  });

  bot.command("ping", async (ctx) => {
    const t0 = Date.now();
    const sent = await ctx.reply("Pong 🏓");
    const dt = Date.now() - t0;
    try {
      await ctx.telegram.editMessageText(
        sent.chat.id,
        sent.message_id,
        undefined,
        `Pong 🏓 ${dt}ms`
      );
    } catch {}
  });

  const startedAt = Date.now();
  bot.command("uptime", (ctx) => {
    const ms = Date.now() - startedAt;
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000);
    ctx.reply(`Bot đã chạy: ${h}h ${m}m ${s}s`);
  });
}
