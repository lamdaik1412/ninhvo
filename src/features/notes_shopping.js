function ensureNotes(state, chatId) {
  const cur = state.notes.get(chatId);
  if (cur) return cur;
  const seeded = [];
  state.notes.set(chatId, seeded);
  return seeded;
}
function ensureLists(state, chatId) {
  const cur = state.lists.get(chatId);
  if (cur) return cur;
  const seeded = { shopping: [] };
  state.lists.set(chatId, seeded);
  return seeded;
}

export function registerNotesShopping(bot, { state, utils }) {
  // Notes
  bot.command("note", (ctx) => {
    const text = utils.getArgs(ctx, "note");
    if (!text) return ctx.reply("Dùng: /note [nội dung]");
    const list = ensureNotes(state, ctx.chat.id);
    list.push(text);
    state.notes.set(ctx.chat.id, list);
    ctx.reply(`Đã ghi note #${list.length}: ${text}`);
  });
  bot.command("notelist", (ctx) => {
    const list = ensureNotes(state, ctx.chat.id);
    if (list.length === 0) return ctx.reply("Chưa có note nào.");
    ctx.reply(["Notes:", ...list.map((x, i) => `${i + 1}. ${x}`)].join("\n"));
  });
  bot.command("notedel", (ctx) => {
    const i = utils.clampInt(
      parseInt(utils.getArgs(ctx, "notedel"), 10),
      1,
      1e9
    );
    const list = ensureNotes(state, ctx.chat.id);
    if (i < 1 || i > list.length)
      return ctx.reply(`Chỉ có ${list.length} note.`);
    const removed = list.splice(i - 1, 1)[0];
    state.notes.set(ctx.chat.id, list);
    ctx.reply(`Đã xoá note ${i}: ${removed}`);
  });

  // Shopping
  bot.command("buy", (ctx) => {
    const text = utils.getArgs(ctx, "buy");
    if (!text) return ctx.reply("Dùng: /buy [mặt hàng]");
    const lists = ensureLists(state, ctx.chat.id);
    lists.shopping.push(text);
    state.lists.set(ctx.chat.id, lists);
    ctx.reply(`Đã thêm vào list mua sắm (#${lists.shopping.length}): ${text}`);
  });
  bot.command("buylist", (ctx) => {
    const lists = ensureLists(state, ctx.chat.id);
    const arr = lists.shopping;
    if (!arr.length) return ctx.reply("List mua sắm trống.");
    ctx.reply(
      ["Shopping list:", ...arr.map((x, i) => `${i + 1}. ${x}`)].join("\n")
    );
  });
  bot.command("buydel", (ctx) => {
    const i = utils.clampInt(
      parseInt(utils.getArgs(ctx, "buydel"), 10),
      1,
      1e9
    );
    const lists = ensureLists(state, ctx.chat.id);
    const arr = lists.shopping;
    if (i < 1 || i > arr.length) return ctx.reply(`Chỉ có ${arr.length} món.`);
    const removed = arr.splice(i - 1, 1)[0];
    state.lists.set(ctx.chat.id, lists);
    ctx.reply(`Đã xoá món ${i}: ${removed}`);
  });
}
