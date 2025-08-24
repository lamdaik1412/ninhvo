import { nowInTZ, parseHHmm } from "../utils.js";
const TZ = "Asia/Ho_Chi_Minh";
const DEFAULTS = [
  { h: 8, m: 0, msg: "Nhắc nhẹ: khen 3 câu trước khi xin gì đó nha 😌" },
  { h: 20, m: 0, msg: "Tổng kết ngày: nói 1 câu cảm ơn vợ trước khi ngủ 💖" },
];

function ensureHabits(state, chatId) {
  const cur = state.habits.get(chatId);
  if (cur) return cur;
  const seeded = { enabled: false, times: [...DEFAULTS], lastYMDs: {} };
  state.habits.set(chatId, seeded);
  return seeded;
}

export function registerReminders(bot, { state }) {
  bot.command("habitstart", (ctx) => {
    const h = ensureHabits(state, ctx.chat.id);
    h.enabled = true;
    state.habits.set(ctx.chat.id, h);
    ctx.reply(
      `Đã bật nhắc nịnh (${h.times
        .map((t) => `${t.h}:${t.m.toString().padStart(2, "0")}`)
        .join(", ")}).`
    );
  });

  bot.command("habitstop", (ctx) => {
    const h = ensureHabits(state, ctx.chat.id);
    h.enabled = false;
    state.habits.set(ctx.chat.id, h);
    ctx.reply("Đã tắt nhắc nịnh.");
  });

  // /habitadd 07:30 Nhắc uống nước rồi khen 1 câu
  bot.command("habitadd", (ctx) => {
    const raw = (ctx.message?.text || "").split(" ").slice(1);
    const time = raw.shift();
    const parsed = parseHHmm(time);
    if (!parsed) return ctx.reply("Dùng: /habitadd HH:mm [nội dung]");
    const msg = raw.join(" ") || "Nhắc nịnh vợ nè 💞";
    const h = ensureHabits(state, ctx.chat.id);
    h.times.push({ h: parsed.hour, m: parsed.minute, msg });
    state.habits.set(ctx.chat.id, h);
    ctx.reply(
      `Đã thêm: ${parsed.hour}:${parsed.minute
        .toString()
        .padStart(2, "0")} – ${msg}`
    );
  });

  bot.command("habitlist", (ctx) => {
    const h = ensureHabits(state, ctx.chat.id);
    if (!h.times.length) return ctx.reply("Chưa có lịch nào.");
    const lines = h.times.map(
      (t, i) => `${i + 1}. ${t.h}:${t.m.toString().padStart(2, "0")} – ${t.msg}`
    );
    ctx.reply(["Lịch nhắc:", ...lines].join("\n"));
  });

  bot.command("habitdel", (ctx) => {
    const idx = parseInt((ctx.message?.text || "").split(" ")[1], 10);
    const h = ensureHabits(state, ctx.chat.id);
    if (isNaN(idx) || idx < 1 || idx > h.times.length)
      return ctx.reply(`Chọn 1..${h.times.length}`);
    const removed = h.times.splice(idx - 1, 1)[0];
    state.habits.set(ctx.chat.id, h);
    ctx.reply(
      `Đã xoá: ${removed.h}:${removed.m.toString().padStart(2, "0")} – ${
        removed.msg
      }`
    );
  });

  // tick
  setInterval(async () => {
    const { ymd, hour, minute } = nowInTZ(TZ);
    for (const [chatId, h] of state.habits.entries()) {
      if (!h?.enabled) continue;
      for (const t of h.times) {
        if (hour === t.h && minute === t.m) {
          const key = `${ymd}-${t.h}:${t.m}`;
          if (h.lastYMDs?.[key]) continue;
          try {
            await bot.telegram.sendMessage(chatId, t.msg);
            h.lastYMDs[key] = 1;
            state.habits.set(chatId, h);
          } catch (e) {
            console.error("Habit send error:", e.message);
          }
        }
      }
    }
  }, 20 * 1000);
}
