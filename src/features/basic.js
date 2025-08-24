import { anniversaryInfo, getArgs, getNick } from "../utils.js";

export function registerBasic(bot, { state, utils, content }) {
  bot.start((ctx) => {
    const n = utils.getNick(state, ctx.chat.id);
    const { since, nextDate, until } = utils.anniversaryInfo(state, new Date());
    ctx.reply(
      [
        `Chào vợ iu ${n} 🌸`,
        `• /chi – khen`,
        `• /love – câu yêu`,
        `• /promise – lời hứa`,
        `• /sorry [vì…] – xin lỗi`,
        `• /dateidea – hẹn hò`,
        `• /coupon – phiếu quà`,
        `• /truth • /dare • /chore`,
        `• /dinner A | B | C • /poll "Q" | A | B`,
        `• /grat … • /gratlist • /gratclear`,
        `• /chipic [n] • /addchipic • /listchipic • /delchipic [i]`,
        `• /mood [1..5] • /moodavg`,
        `• /note … • /notelist • /notedel [i]`,
        `• /buy … • /buylist • /buydel [i]`,
        `• /timer 10m [nhắc] • /poem • /story`,
        `• /anniversary • /setnick [tên] • /echo • /ping • /uptime`,
        "",
        `Đã bên nhau: ${since} ngày. Kỷ niệm tiếp theo: ${nextDate} (còn ${until} ngày). 💞`,
      ].join("\n")
    );
  });

  bot.command("help", (ctx) => {
    ctx.reply(
      [
        "Lệnh nhanh:",
        "/chi /love /promise /sorry /dateidea /coupon /truth /dare /chore",
        '/dinner A | B | C • /poll "Câu hỏi" | A | B | C',
        "/grat … • /gratlist • /gratclear",
        "/chipic [n] • /addchipic • /listchipic • /delchipic [i]",
        "/mood [1..5] • /moodavg",
        "/note … • /notelist • /notedel [i]",
        "/buy … • /buylist • /buydel [i]",
        "/timer 10m [nhắc] • /poem • /story",
        "/anniversary • /setnick [tên] • /echo • /ping • /uptime",
      ].join("\n")
    );
  });

  bot.command("setnick", (ctx) => {
    const args = utils.getArgs(ctx, "setnick");
    if (!args)
      return ctx.reply("Dùng: /setnick [tên], ví dụ: /setnick Vợ iu ❤️");
    state.nickMap.set(ctx.chat.id, args);
    ctx.reply(`Ok, từ giờ anh sẽ gọi là: ${args} 💖`);
  });

  bot.command("anniversary", (ctx) => {
    const { since, nextDate, until } = utils.anniversaryInfo(state, new Date());
    ctx.reply(
      `Đã bên nhau: ${since} ngày.\nKỷ niệm tiếp theo: ${nextDate} (còn ${until} ngày). 💑`
    );
  });
}
