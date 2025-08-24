export function registerTimer(bot, { state, utils }) {
  bot.command("timer", (ctx) => {
    const raw = utils.getArgs(ctx, "timer");
    if (!raw) return ctx.reply("Dùng: /timer 10m [nhắc gì]");
    const [durStr, ...rest] = raw.split(" ").filter(Boolean);
    const ms = utils.parseDuration(durStr);
    if (!ms) return ctx.reply("Thời lượng sai. Dùng định dạng: 30s, 10m, 2h");
    const text = rest.join(" ") || "Tới giờ rồi nè ⏰";
    const when = Date.now() + ms;

    const timers = state.timers.get(ctx.chat.id) || [];
    const id = Math.random().toString(36).slice(2);
    timers.push({ id, when, text });
    state.timers.set(ctx.chat.id, timers);

    setTimeout(() => {
      ctx.reply(`${text}`);
      const t = state.timers.get(ctx.chat.id) || [];
      const left = t.filter((x) => x.id !== id);
      state.timers.set(ctx.chat.id, left);
    }, ms);

    ctx.reply(`Đặt hẹn giờ xong. Nhắc sau ${durStr}.`);
  });
}
