// wife-bot.js
import express from "express";
import { Telegraf, Input } from "telegraf";
import fs from "fs";

// ==== ENV ====
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let PUBLIC_URL = process.env.PUBLIC_URL || "";
let WEBHOOK_SECRET_PATH =
  process.env.WEBHOOK_SECRET_PATH || "/hook-" + Math.random().toString(36).slice(2);
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error("Missing env TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

// Normalize
if (!WEBHOOK_SECRET_PATH.startsWith("/")) WEBHOOK_SECRET_PATH = "/" + WEBHOOK_SECRET_PATH;
if (PUBLIC_URL.endsWith("/")) PUBLIC_URL = PUBLIC_URL.slice(0, -1);

console.log("ENV CHECK:");
console.log("PUBLIC_URL         =", PUBLIC_URL || "(empty)");
console.log("WEBHOOK_SECRET_PATH=", WEBHOOK_SECRET_PATH);

const bot = new Telegraf(BOT_TOKEN);

// ==== UTILS ====
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function getArgs(ctx, cmd) {
  const t = ctx.message?.text || "";
  const p = `/${cmd}`;
  if (!t.startsWith(p)) return "";
  return t.slice(p.length).trim();
}
function escapeMD(s = "") {
  return s.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

// ==== STATE & PERSISTENCE ====
// Per-chat state để dùng chung cho group/cá nhân
// hũ biết ơn, ảnh kỷ niệm, mood, nickname, …
const SAVE_FILE = "./wife_bot_state.json";
const state = {
  nickMap: new Map(), // chatId -> nickname (mặc định: "Yến Chi")
  gratitude: new Map(), // chatId -> string[]
  pics: new Map(), // chatId -> { photoIds: string[], docImageIds: string[], urls: string[] }
  moods: new Map(), // chatId -> number[] (1..5)
};

// Wedding date (đã cưới 17/08/2025)
const WEDDING_DATE_ISO = "2025-08-17"; // yyyy-mm-dd

function loadState() {
  try {
    if (!fs.existsSync(SAVE_FILE)) return;
    const j = JSON.parse(fs.readFileSync(SAVE_FILE, "utf8"));
    (j.nickMap || []).forEach(([k, v]) => state.nickMap.set(Number(k), v));
    (j.gratitude || []).forEach(([k, v]) => state.gratitude.set(Number(k), v));
    (j.pics || []).forEach(([k, v]) => state.pics.set(Number(k), v));
    (j.moods || []).forEach(([k, v]) => state.moods.set(Number(k), v));
    console.log("State loaded.");
  } catch (e) {
    console.warn("Load state error:", e.message);
  }
}
function saveState() {
  try {
    const j = {
      nickMap: Array.from(state.nickMap.entries()),
      gratitude: Array.from(state.gratitude.entries()),
      pics: Array.from(state.pics.entries()),
      moods: Array.from(state.moods.entries()),
    };
    fs.writeFileSync(SAVE_FILE, JSON.stringify(j));
  } catch (e) {
    console.warn("Save state error:", e.message);
  }
}
loadState();

function getNick(chatId) {
  return state.nickMap.get(chatId) || "Yến Chi";
}
function ensurePics(chatId) {
  const cur = state.pics.get(chatId);
  if (cur) {
    if (!cur.docImageIds) cur.docImageIds = [];
    if (!cur.photoIds) cur.photoIds = cur.fileIds || []; // back-compat
    return cur;
  }
  const seeded = {
    photoIds: [],
    docImageIds: [],
    urls: [
      // seed vài ảnh đại diện (đổi thành ảnh của vợ bạn cho ấm áp 🥰)
      "https://i.imgur.com/Hm1ZJzC.jpeg",
      "https://i.imgur.com/6rQ7F1Q.jpeg",
      "https://i.imgur.com/O2mQq4M.jpeg",
    ],
  };
  state.pics.set(chatId, seeded);
  saveState();
  return seeded;
}

// ==== ERROR & LOGGING ====
bot.catch((err, ctx) => {
  console.error("Bot error:", err);
  try { ctx.reply("Ui, bot bị vấp xíu. Mình thử lại nha 🤍"); } catch {}
});
bot.use(async (ctx, next) => {
  const user = ctx.from ? `${ctx.from.username || ctx.from.first_name}(${ctx.from.id})` : "unknown";
  console.log(`[Update] ${new Date().toISOString()} - ${user} - ${ctx.updateType}`);
  await next();
});

// ==== CONTENT BANKS ====
const compliments = [
  (n) => `${n} giỏi giang mà vẫn dễ thương quá chừng ✨`,
  (n) => `${n} cười một cái là cả ngày sáng rực 🌞`,
  (n) => `${n} là chân ái + chân ác luôn (ác ở chỗ xinh quá) 😏`,
  (n) => `Hôm nay ${n} xinh hơn hôm qua. Ngày mai chắc xinh hơn nữa 😎`,
  (n) => `${n} là bản cập nhật hạnh phúc mới nhất của anh 💖`,
];
const loveLines = [
  (n) => `Thương ${n} như cơm như nước – thiếu cái nào cũng đói 🥰`,
  (n) => `Lịch hôm nay: ngắm ${n} – nghĩ về ${n} – nhớ ${n} – yêu ${n} 💌`,
  (n) => `Góc tim có slot, dành riêng cho ${n} thôi 💘`,
  (n) => `Yêu ${n} không cần lý do, chỉ cần lý trí nghỉ trưa 😌`,
];
const promises = [
  (n) => `Hứa với ${n}: hôm nay anh rửa chén, ngày mai cũng rửa chén (run tay nhưng rửa) 🧽`,
  (n) => `Hứa: buồn thì chở đi ăn, vui thì chở đi chơi, mệt thì chở đi ngủ (về nhà) 🚗`,
  (n) => `Hứa chăm đủ 3 bữa: sáng nịnh, trưa dỗ, tối ôm 🤗`,
];

// ==== DATE HELPERS ====
function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  const d = Math.floor((b - a) / MS);
  return d;
}
function anniversaryInfo(today = new Date()) {
  // Tính từ ngày cưới 17/08/2025
  const base = new Date(WEDDING_DATE_ISO + "T00:00:00");
  const since = daysBetween(base, today);

  // next anniversary
  const tYear = today.getFullYear();
  let next = new Date(`${tYear}-08-17T00:00:00`);
  if (next < today) next = new Date(`${tYear + 1}-08-17T00:00:00`);
  const until = daysBetween(today, next);
  return { since, nextDate: next.toISOString().slice(0, 10), until };
}

// ==== COMMANDS ====
// /start
bot.start((ctx) => {
  const n = getNick(ctx.chat.id);
  const { since, nextDate, until } = anniversaryInfo(new Date());
  ctx.reply(
    [
      `Chào vợ iu ${n} 🌸`,
      `• /chi – một câu khen ngọt lịm`,
      `• /love – một câu yêu thương`,
      `• /promise – một lời hứa xịn`,
      `• /grat [nội dung] – bỏ vào “hũ biết ơn”`,
      `• /gratlist – xem hũ (tối đa 50 mẩu)`,
      `• /gratclear – dọn hũ (khi đầy)`,
      `• /chipic [n] – gửi ảnh kỷ niệm (n<=10)`,
      `• /addchipic – reply vào ảnh để thêm vào kho`,
      `• /listchipic – xem số ảnh kỷ niệm`,
      `• /delchipic [index] – xoá 1 ảnh`,
      `• /dinner A | B | C – để anh chọn món tối`,
      `• /mood [1..5] – lưu mood hôm nay, /moodavg – xem trung bình`,
      `• /anniversary – xem đã bên nhau bao ngày & còn bao ngày tới kỷ niệm`,
      `• /setnick [tên] – đổi cách xưng hô (mặc định: Yến Chi)`,
      "",
      `Đã bên nhau: ${since} ngày. Kỷ niệm tiếp theo: ${nextDate} (còn ${until} ngày). 💞`,
    ].join("\n")
  );
});

// /help
bot.command("help", (ctx) => {
  ctx.reply(
    [
      "Lệnh cho nàng đây:",
      "/chi – khen",
      "/love – câu yêu",
      "/promise – lời hứa",
      "/grat [nội dung] – thêm vào hũ biết ơn",
      "/gratlist – xem hũ",
      "/gratclear – dọn hũ",
      "/chipic [n<=10] – gửi ảnh kỷ niệm",
      "/addchipic – reply ảnh để thêm",
      "/listchipic – đếm ảnh kỷ niệm",
      "/delchipic [index] – xoá 1 ảnh",
      "/dinner A | B | C – để bot chọn món",
      "/mood [1..5] – lưu mood",
      "/moodavg – mood trung bình",
      "/anniversary – ngày kỷ niệm",
      "/setnick [tên] – đổi cách gọi",
    ].join("\n")
  );
});

// /setnick [tên]
bot.command("setnick", (ctx) => {
  const args = getArgs(ctx, "setnick");
  if (!args) return ctx.reply("Dùng: /setnick [tên], ví dụ: /setnick Vợ iu ❤️");
  state.nickMap.set(ctx.chat.id, args);
  saveState();
  ctx.reply(`Ok, từ giờ anh sẽ gọi là: ${args} 💖`);
});

// /chi – compliment vợ
bot.command("chi", (ctx) => {
  const n = getNick(ctx.chat.id);
  ctx.reply(pick(compliments)(n));
});

// /love – câu yêu thương
bot.command("love", (ctx) => {
  const n = getNick(ctx.chat.id);
  ctx.reply(pick(loveLines)(n));
});

// /promise – lời hứa
bot.command("promise", (ctx) => {
  const n = getNick(ctx.chat.id);
  ctx.reply(pick(promises)(n));
});

// Hũ biết ơn: /grat, /gratlist, /gratclear
bot.command("grat", (ctx) => {
  const msg = getArgs(ctx, "grat");
  if (!msg) return ctx.reply("Viết điều em biết ơn hôm nay đi nào 🫶\nVD: /grat Anh rửa chén xịn quá");
  const jar = state.gratitude.get(ctx.chat.id) || [];
  jar.push(msg);
  // Limit 50
  while (jar.length > 50) jar.shift();
  state.gratitude.set(ctx.chat.id, jar);
  saveState();
  ctx.reply(`Bỏ vào hũ rồi nè. Hiện có ${jar.length}/50 mẩu 🤍`);
});
bot.command("gratlist", (ctx) => {
  const jar = state.gratitude.get(ctx.chat.id) || [];
  if (jar.length === 0) return ctx.reply("Hũ đang trống tinh tươm ✨\nGõ /grat để bỏ mẩu đầu tiên nha.");
  const lines = jar.map((x, i) => `${i + 1}. ${x}`);
  ctx.reply(["Hũ biết ơn:", ...lines].join("\n"));
});
bot.command("gratclear", (ctx) => {
  state.gratitude.set(ctx.chat.id, []);
  saveState();
  ctx.reply("Đã dọn hũ biết ơn. Mở hũ mới nhé 🌟");
});

// Ảnh kỷ niệm: /chipic, /addchipic, /listchipic, /delchipic
bot.command("addchipic", async (ctx) => {
  const reply = ctx.message?.reply_to_message;
  if (!reply) return ctx.reply("Hãy **reply** vào một bức ảnh (photo hoặc file image) để thêm.", { parse_mode: "Markdown" });

  const store = ensurePics(ctx.chat.id);

  // photo (compressed)
  if (reply.photo && reply.photo.length > 0) {
    const best = reply.photo[reply.photo.length - 1];
    if (!store.photoIds.includes(best.file_id)) {
      store.photoIds.push(best.file_id);
    }
    state.pics.set(ctx.chat.id, store);
    saveState();
    return ctx.reply(`Đã thêm 1 ảnh (photo). Tổng: ${store.photoIds.length + store.docImageIds.length + store.urls.length}`);
  }

  // document image/*
  if (reply.document && reply.document.mime_type?.startsWith("image/")) {
    if (!store.docImageIds.includes(reply.document.file_id)) {
      store.docImageIds.push(reply.document.file_id);
    }
    state.pics.set(ctx.chat.id, store);
    saveState();
    return ctx.reply(`Đã thêm 1 ảnh (file image). Tổng: ${store.photoIds.length + store.docImageIds.length + store.urls.length}`);
  }

  return ctx.reply("Tin nhắn được reply không phải ảnh. Gửi ảnh hoặc file ảnh rồi reply /addchipic nha.");
});

bot.command("listchipic", (ctx) => {
  const store = ensurePics(ctx.chat.id);
  const total = store.photoIds.length + store.docImageIds.length + store.urls.length;
  ctx.reply(
    [
      `Kho ảnh kỷ niệm: ${total} tấm`,
      `• photo: ${store.photoIds.length}`,
      `• file image: ${store.docImageIds.length}`,
      `• url: ${store.urls.length}`,
      total > 0 ? "Dùng /chipic [n] để gửi, /delchipic [index] để xoá." : "Dùng /addchipic (reply ảnh) để thêm nha.",
    ].join("\n")
  );
});

bot.command("delchipic", (ctx) => {
  const arg = getArgs(ctx, "delchipic");
  const idx = parseInt(arg, 10);
  if (isNaN(idx) || idx < 1) return ctx.reply("Dùng: /delchipic [index], ví dụ: /delchipic 3");

  const store = ensurePics(ctx.chat.id);
  const flat = [
    ...store.photoIds.map((v) => ({ t: "p", v })),
    ...store.docImageIds.map((v) => ({ t: "d", v })),
    ...store.urls.map((v) => ({ t: "u", v })),
  ];
  if (idx > flat.length) return ctx.reply(`Chỉ có ${flat.length} ảnh.`);
  const { t, v } = flat[idx - 1];

  if (t === "p") store.photoIds = store.photoIds.filter((x) => x !== v);
  else if (t === "d") store.docImageIds = store.docImageIds.filter((x) => x !== v);
  else store.urls = store.urls.filter((x) => x !== v);

  state.pics.set(ctx.chat.id, store);
  saveState();
  ctx.reply(`Đã xoá ảnh ở vị trí ${idx}.`);
});

bot.command("chipic", async (ctx) => {
  const n = getNick(ctx.chat.id);
  const args = getArgs(ctx, "chipic");
  let count = parseInt(args, 10);
  if (isNaN(count) || count < 1) count = 1;
  if (count > 10) count = 10;

  const store = ensurePics(ctx.chat.id);
  const stock = [
    ...store.photoIds.map((x) => ({ type: "photo", value: x })),
    ...store.docImageIds.map((x) => ({ type: "doc", value: x })),
    ...store.urls.map((x) => ({ type: "url", value: x })),
  ];
  if (stock.length === 0) return ctx.reply("Kho ảnh chưa có gì. Dùng /addchipic để thêm nha.");

  const caption = pick([
    `Khoảnh khắc yêu của ${n} đây nè 📸`,
    `Ảnh kỷ niệm đẹp như ${n} vậy 💞`,
    `Nhìn ảnh là thấy hạnh phúc rồi ${n} ơi ✨`,
  ]);

  const sendOne = async (it, withCaption = false) => {
    try {
      if (it.type === "photo") return await ctx.replyWithPhoto(it.value, { caption: withCaption ? caption : undefined });
      if (it.type === "doc") return await ctx.replyWithDocument(it.value, { caption: withCaption ? caption : undefined });
      return await ctx.replyWithPhoto(Input.fromURL(it.value), { caption: withCaption ? caption : undefined });
    } catch (e) {
      console.error("sendOne error:", e.message);
      return ctx.reply("Gửi ảnh lỗi nhẹ, thử tấm khác nha.");
    }
  };

  if (count === 1) {
    const one = pick(stock);
    return sendOne(one, true);
  }
  for (let i = 0; i < count; i++) {
    const one = pick(stock);
    // caption cho tấm đầu tiên
    // (album mediaGroup không ổn với document ⇒ gửi từng tấm)
    await sendOne(one, i === 0);
  }
});

// Dinner chooser: /dinner A | B | C
bot.command("dinner", (ctx) => {
  const raw = getArgs(ctx, "dinner");
  const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return ctx.reply("Dùng: /dinner A | B | C");
  ctx.reply(`Tối nay mình đi: ${pick(parts)} 🍽️`);
});

// Mood: /mood [1..5], /moodavg
bot.command("mood", (ctx) => {
  const raw = getArgs(ctx, "mood");
  const v = parseInt(raw, 10);
  if (isNaN(v) || v < 1 || v > 5) return ctx.reply("Chấm mood từ 1..5 nhé. VD: /mood 5");
  const arr = state.moods.get(ctx.chat.id) || [];
  arr.push(v);
  // giữ tối đa 100 bản ghi
  while (arr.length > 100) arr.shift();
  state.moods.set(ctx.chat.id, arr);
  saveState();
  ctx.reply(`Đã lưu mood: ${v}/5. Gõ /moodavg để xem trung bình nha.`);
});
bot.command("moodavg", (ctx) => {
  const arr = state.moods.get(ctx.chat.id) || [];
  if (arr.length === 0) return ctx.reply("Chưa có dữ liệu mood. Dùng /mood 1..5 để lưu nhé.");
  const avg = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
  ctx.reply(`Mood trung bình: ${avg}/5 (trong ${arr.length} lần) 💟`);
});

// Anniversary
bot.command("anniversary", (ctx) => {
  const { since, nextDate, until } = anniversaryInfo(new Date());
  ctx.reply(`Đã bên nhau: ${since} ngày.\nKỷ niệm tiếp theo: ${nextDate} (còn ${until} ngày). 💑`);
});

// Một vài tiện ích nhỏ: /echo, /ping, /uptime
bot.command("echo", (ctx) => {
  const raw = getArgs(ctx, "echo");
  if (!raw) return ctx.reply("Dùng: /echo [nội dung]");
  ctx.reply(escapeMD(raw), { parse_mode: "MarkdownV2" });
});
bot.command("ping", async (ctx) => {
  const t0 = Date.now();
  const sent = await ctx.reply("Pong 🏓");
  const dt = Date.now() - t0;
  try { await ctx.telegram.editMessageText(sent.chat.id, sent.message_id, undefined, `Pong 🏓 ${dt}ms`); } catch {}
});
const startedAt = Date.now();
bot.command("uptime", (ctx) => {
  const ms = Date.now() - startedAt;
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  ctx.reply(`Bot đã chạy: ${h}h ${m}m ${s}s`);
});

// ==== SERVER / WEBHOOK ====
const app = express();
app.use(express.json());
app.get("/", (_req, res) => res.send("Wife Bot is up."));
app.get(WEBHOOK_SECRET_PATH, (_req, res) => res.send("Webhook endpoint is alive (POST only)."));
app.use(bot.webhookCallback(WEBHOOK_SECRET_PATH));

async function setCommands() {
  try {
    await bot.telegram.setMyCommands([
      { command: "start", description: "Bắt đầu" },
      { command: "help", description: "Danh sách lệnh" },
      { command: "chi", description: "Khen vợ" },
      { command: "love", description: "Câu yêu thương" },
      { command: "promise", description: "Lời hứa ngọt" },
      { command: "grat", description: "Bỏ vào hũ biết ơn" },
      { command: "gratlist", description: "Xem hũ biết ơn" },
      { command: "gratclear", description: "Dọn hũ biết ơn" },
      { command: "chipic", description: "Gửi ảnh kỷ niệm" },
      { command: "addchipic", description: "Reply ảnh để thêm vào kho" },
      { command: "listchipic", description: "Đếm ảnh kỷ niệm" },
      { command: "delchipic", description: "Xoá 1 ảnh" },
      { command: "dinner", description: "Chọn món tối" },
      { command: "mood", description: "Lưu mood 1..5" },
      { command: "moodavg", description: "Mood trung bình" },
      { command: "anniversary", description: "Ngày kỷ niệm" },
      { command: "setnick", description: "Đổi cách xưng hô" },
      { command: "echo", description: "Lặp lại an toàn" },
      { command: "ping", description: "Kiểm tra phản hồi" },
      { command: "uptime", description: "Thời gian chạy" },
    ]);
  } catch (e) {
    console.error("setMyCommands error:", e);
  }
}

app.listen(PORT, async () => {
  console.log(`Server listening on ${PORT}`);
  await setCommands();

  if (!PUBLIC_URL) {
    console.warn("PUBLIC_URL is empty → Set trên Render rồi redeploy. Webhook chưa được set.");
    return;
  }
  const hookUrl = `${PUBLIC_URL}${WEBHOOK_SECRET_PATH}`;
  try {
    await bot.telegram.deleteWebhook();
    await bot.telegram.setWebhook(hookUrl);
    console.log("Webhook set to:", hookUrl);
  } catch (e) {
    console.error("setWebhook error:", e.response?.description || e.message);
  }
});
