export function registerGratitude(bot, { state, utils }) {
  bot.command("grat", (ctx) => {
    const msg = utils.getArgs(ctx, "grat");
    if (!msg)
      return ctx.reply(
        "Viết điều em biết ơn hôm nay đi nào 🫶\nVD: /grat Anh rửa chén xịn quá"
      );
    const jar = state.gratitude.get(ctx.chat.id) || [];
    jar.push(msg);
    while (jar.length > 50) jar.shift();
    state.gratitude.set(ctx.chat.id, jar);
    ctx.reply(`Bỏ vào hũ rồi nè. Hiện có ${jar.length}/50 mẩu 🤍`);
  });

  bot.command("gratlist", (ctx) => {
    const jar = state.gratitude.get(ctx.chat.id) || [];
    if (jar.length === 0)
      return ctx.reply(
        "Hũ đang trống tinh tươm ✨\nGõ /grat để bỏ mẩu đầu tiên nha."
      );
    const lines = jar.map((x, i) => `${i + 1}. ${x}`);
    ctx.reply(["Hũ biết ơn:", ...lines].join("\n"));
  });

  bot.command("gratclear", (ctx) => {
    state.gratitude.set(ctx.chat.id, []);
    ctx.reply("Đã dọn hũ biết ơn. Mở hũ mới nhé 🌟");
  });
}
