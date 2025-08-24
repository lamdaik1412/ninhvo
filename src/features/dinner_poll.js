export function registerDinnerPoll(bot, { utils }) {
  // /dinner A | B | C
  bot.command("dinner", (ctx) => {
    const raw = utils.getArgs(ctx, "dinner");
    const parts = raw
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length < 2) return ctx.reply("Dùng: /dinner A | B | C");
    ctx.reply(`Tối nay mình đi: ${utils.pick(parts)} 🍽️`);
  });

  // /poll "Câu hỏi" | A | B | C
  bot.command("poll", async (ctx) => {
    const raw = utils.getArgs(ctx, "poll");
    const m = raw.match(/^"([^"]+)"\s*\|(.*)$/);
    if (!m)
      return ctx.reply('Dùng: /poll "Câu hỏi" | Lựa chọn 1 | Lựa chọn 2 | ...');
    const question = m[1];
    const opts = m[2]
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (opts.length < 2) return ctx.reply("Cần ít nhất 2 lựa chọn nha.");
    try {
      await ctx.telegram.sendPoll(ctx.chat.id, question, opts, {
        is_anonymous: false,
      });
    } catch (e) {
      ctx.reply("Tạo poll lỗi nhẹ. Thử lại nhen.");
    }
  });
}
