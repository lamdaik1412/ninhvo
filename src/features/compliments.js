export function registerCompliments(bot, { state, utils, content }) {
  // /chi
  bot.command("chi", (ctx) => {
    const n = utils.getNick(state, ctx.chat.id);
    const line = utils.bagPick(
      state,
      ctx,
      "compliments",
      content.compliments
    )(n);
    ctx.reply(line);
  });

  // /love
  bot.command("love", (ctx) => {
    const n = utils.getNick(state, ctx.chat.id);
    const line = utils.bagPick(state, ctx, "loves", content.loveLines)(n);
    ctx.reply(line);
  });

  // /promise
  bot.command("promise", (ctx) => {
    const n = utils.getNick(state, ctx.chat.id);
    const line = utils.bagPick(state, ctx, "promises", content.promises)(n);
    ctx.reply(line);
  });

  // /sorry [lí do]
  bot.command("sorry", (ctx) => {
    const n = utils.getNick(state, ctx.chat.id);
    const msg = utils.getArgs(ctx, "sorry");
    const base = utils.bagPick(state, ctx, "apologies", content.apologies)(n);
    ctx.reply(msg ? `${base}\n(Lý do: ${msg})` : base);
  });

  // /dateidea
  bot.command("dateidea", (ctx) => {
    const idea = utils.bagPick(state, ctx, "dateideas", content.dateIdeas);
    ctx.reply(`Hẹn hò nay thử: ${idea} 💡`);
  });

  // /coupon
  bot.command("coupon", (ctx) => {
    const n = utils.getNick(state, ctx.chat.id);
    const coupons = [
      `Phiếu ôm 10 phút không đếm lùi`,
      `Phiếu đấm lưng 15 phút`,
      `Phiếu rửa chén hộ hôm nay`,
      `Phiếu trà sữa size L (topping tùy chọn)`,
      `Phiếu dắt đi ăn món ${n} thích`,
      `Phiếu không cãi 1 ngày (dù ${n} sai… à nhầm, ${n} không bao giờ sai)`,
    ];
    const c = utils.bagPick(state, ctx, "coupons", coupons);
    ctx.reply(`🎟️ ${c}`);
  });

  // /truth & /dare
  bot.command("truth", (ctx) =>
    ctx.reply(
      `TRUTH: ${utils.bagPick(state, ctx, "truths", content.truthPrompts)}`
    )
  );
  bot.command("dare", (ctx) =>
    ctx.reply(
      `DARE: ${utils.bagPick(state, ctx, "dares", content.darePrompts)}`
    )
  );

  // /chore
  bot.command("chore", (ctx) =>
    ctx.reply(
      `Việc hôm nay: ${utils.bagPick(state, ctx, "chores", content.chores)} 🧽`
    )
  );
}
