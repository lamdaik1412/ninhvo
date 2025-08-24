import { Input } from "telegraf";

function ensurePics(state, chatId) {
  const cur = state.pics.get(chatId);
  if (cur) {
    if (!cur.docImageIds) cur.docImageIds = [];
    if (!cur.photoIds) cur.photoIds = cur.fileIds || [];
    if (!cur.urls) cur.urls = [];
    return cur;
  }
  const seeded = {
    photoIds: [],
    docImageIds: [],
    urls: [
      "https://i.imgur.com/Hm1ZJzC.jpeg",
      "https://i.imgur.com/6rQ7F1Q.jpeg",
      "https://i.imgur.com/O2mQq4M.jpeg",
    ],
  };
  state.pics.set(chatId, seeded);
  return seeded;
}

export function registerPhotos(bot, { state, utils }) {
  bot.command("addchipic", async (ctx) => {
    const reply = ctx.message?.reply_to_message;
    if (!reply)
      return ctx.reply(
        "Hãy **reply** vào một bức ảnh (photo hoặc file image) để thêm.",
        { parse_mode: "Markdown" }
      );
    if (!utils.isPhotoLike(reply))
      return ctx.reply(
        "Tin nhắn được reply không phải ảnh. Gửi ảnh hoặc file ảnh rồi reply /addchipic nha."
      );

    const store = ensurePics(state, ctx.chat.id);
    if (reply.photo && reply.photo.length > 0) {
      const best = reply.photo[reply.photo.length - 1];
      if (!store.photoIds.includes(best.file_id))
        store.photoIds.push(best.file_id);
    } else if (
      reply.document &&
      reply.document.mime_type?.startsWith("image/")
    ) {
      if (!store.docImageIds.includes(reply.document.file_id))
        store.docImageIds.push(reply.document.file_id);
    }
    state.pics.set(ctx.chat.id, store);

    const total =
      store.photoIds.length + store.docImageIds.length + store.urls.length;
    return ctx.reply(`Đã thêm 1 ảnh. Tổng: ${total}`);
  });

  bot.command("listchipic", (ctx) => {
    const store = ensurePics(state, ctx.chat.id);
    const total =
      store.photoIds.length + store.docImageIds.length + store.urls.length;
    ctx.reply(
      [
        `Kho ảnh kỷ niệm: ${total} tấm`,
        `• photo: ${store.photoIds.length}`,
        `• file image: ${store.docImageIds.length}`,
        `• url: ${store.urls.length}`,
        total > 0
          ? "Dùng /chipic [n] để gửi, /delchipic [index] để xoá."
          : "Dùng /addchipic (reply ảnh) để thêm nha.",
      ].join("\n")
    );
  });

  bot.command("delchipic", (ctx) => {
    const arg = utils.getArgs(ctx, "delchipic");
    const idx = parseInt(arg, 10);
    if (isNaN(idx) || idx < 1)
      return ctx.reply("Dùng: /delchipic [index], ví dụ: /delchipic 3");

    const store = ensurePics(state, ctx.chat.id);
    const flat = [
      ...store.photoIds.map((v) => ({ t: "p", v })),
      ...store.docImageIds.map((v) => ({ t: "d", v })),
      ...store.urls.map((v) => ({ t: "u", v })),
    ];
    if (idx > flat.length) return ctx.reply(`Chỉ có ${flat.length} ảnh.`);
    const { t, v } = flat[idx - 1];

    if (t === "p") store.photoIds = store.photoIds.filter((x) => x !== v);
    else if (t === "d")
      store.docImageIds = store.docImageIds.filter((x) => x !== v);
    else store.urls = store.urls.filter((x) => x !== v);

    state.pics.set(ctx.chat.id, store);
    ctx.reply(`Đã xoá ảnh ở vị trí ${idx}.`);
  });

  bot.command("chipic", async (ctx) => {
    const n = utils.getNick(state, ctx.chat.id);
    const args = utils.getArgs(ctx, "chipic");
    let count = parseInt(args, 10);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 10) count = 10;

    const store = ensurePics(state, ctx.chat.id);
    const stock = [
      ...store.photoIds.map((x) => ({ type: "photo", value: x })),
      ...store.docImageIds.map((x) => ({ type: "doc", value: x })),
      ...store.urls.map((x) => ({ type: "url", value: x })),
    ];
    if (stock.length === 0)
      return ctx.reply("Kho ảnh chưa có gì. Dùng /addchipic để thêm nha.");

    const captions = [
      `Khoảnh khắc yêu của ${n} đây nè 📸`,
      `Ảnh kỷ niệm đẹp như ${n} vậy 💞`,
      `Nhìn ảnh là thấy hạnh phúc rồi ${n} ơi ✨`,
    ];
    const caption = utils.bagPick(state, ctx, "chipic_captions", captions);

    const sendOne = async (it, withCaption = false) => {
      try {
        if (it.type === "photo")
          return await ctx.replyWithPhoto(it.value, {
            caption: withCaption ? caption : undefined,
          });
        if (it.type === "doc")
          return await ctx.replyWithDocument(it.value, {
            caption: withCaption ? caption : undefined,
          });
        return await ctx.replyWithPhoto(Input.fromURL(it.value), {
          caption: withCaption ? caption : undefined,
        });
      } catch (e) {
        console.error("sendOne error:", e.message);
        return ctx.reply("Gửi ảnh lỗi nhẹ, thử tấm khác nha.");
      }
    };

    if (count === 1) {
      const one =
        stock[utils.bagNext(state, ctx.chat.id, "chipic_stock", stock.length)];
      return sendOne(one, true);
    }
    for (let i = 0; i < count; i++) {
      const one =
        stock[utils.bagNext(state, ctx.chat.id, "chipic_stock", stock.length)];
      await sendOne(one, i === 0);
    }
  });
}
