import { nowInTZ, parseHHmm } from "../utils.js";

// Tin nhắn cố định theo yêu cầu
const MESSAGE = "Chương trình nịnh vợ ngày mới xin được phép bắt đầu";
const TZ = "Asia/Ho_Chi_Minh";

function ensureDaily(state, chatId) {
  const cur = state.daily.get(chatId);
  if (cur) return cur;
  const seeded = { enabled: false, hour: 8, minute: 0, lastYMD: "" };
  state.daily.set(chatId, seeded);
  return seeded;
}

export function registerDaily(bot, { state }) {
  // /nvstart — bật
  bot.command("nvstart", (ctx) => {
    const d = ensureDaily(state, ctx.chat.id);
    d.enabled = true;
    state.daily.set(ctx.chat.id, d);
    ctx.reply(
      `Đã bật phát thanh mỗi ngày ${d.hour
        .toString()
        .padStart(2, "0")}:${d.minute.toString().padStart(2, "0")} (giờ VN).`
    );
  });

  // /nvstop — tắt
  bot.command("nvstop", (ctx) => {
    const d = ensureDaily(state, ctx.chat.id);
    d.enabled = false;
    state.daily.set(ctx.chat.id, d);
    ctx.reply("Đã tắt phát thanh hằng ngày.");
  });

  // /nvtime HH:mm — đổi giờ
  bot.command("nvtime", (ctx) => {
    const arg = (ctx.message?.text || "").split(" ").slice(1).join(" ");
    const parsed = parseHHmm(arg);
    if (!parsed)
      return ctx.reply("Dùng: /nvtime HH:mm (ví dụ 8:00, 7:30, 20:15)");
    const d = ensureDaily(state, ctx.chat.id);
    d.hour = parsed.hour;
    d.minute = parsed.minute;
    state.daily.set(ctx.chat.id, d);
    ctx.reply(
      `Đã đặt giờ: ${d.hour.toString().padStart(2, "0")}:${d.minute
        .toString()
        .padStart(2, "0")} (giờ VN).`
    );
  });

  // Scheduler: kiểm tra mỗi 20 giây
  setInterval(async () => {
    const { ymd, hour, minute } = nowInTZ(TZ);

    for (const [chatId, d] of state.daily.entries()) {
      if (!d?.enabled) continue;
      if (hour === (d.hour | 0) && minute === (d.minute | 0)) {
        if (d.lastYMD !== ymd) {
          try {
            await bot.telegram.sendMessage(chatId, MESSAGE);
            d.lastYMD = ymd;
            state.daily.set(chatId, d);
          } catch (e) {
            // ví dụ bot bị hạn chế chat đó
            console.error("Daily send error:", e.message);
          }
        }
      }
    }
  }, 20 * 1000);
}
