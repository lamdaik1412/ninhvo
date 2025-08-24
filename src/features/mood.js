export function registerMood(bot, { state, utils }) {
  bot.command("mood", (ctx) => {
    const raw = utils.getArgs(ctx, "mood");
    const v = parseInt(raw, 10);
    if (isNaN(v) || v < 1 || v > 5)
      return ctx.reply("Chấm mood từ 1..5 nhé. VD: /mood 5");
    const arr = state.moods.get(ctx.chat.id) || [];
    arr.push(v);
    while (arr.length > 100) arr.shift();
    state.moods.set(ctx.chat.id, arr);
    ctx.reply(`Đã lưu mood: ${v}/5. Gõ /moodavg để xem trung bình nha.`);
  });

  bot.command("moodavg", (ctx) => {
    const arr = state.moods.get(ctx.chat.id) || [];
    if (arr.length === 0)
      return ctx.reply("Chưa có dữ liệu mood. Dùng /mood 1..5 để lưu nhé.");
    const avg = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    ctx.reply(`Mood trung bình: ${avg}/5 (trong ${arr.length} lần) 💟`);
  });
}
