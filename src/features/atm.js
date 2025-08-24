import { parseMoney, fmtMoney, bagPick, getNick } from "../utils.js";

const SUGGEST = [100_000, 200_000, 300_000, 500_000];

export function registerATM(bot, { state, utils }) {
  bot.command("atm", (ctx) => {
    const n = utils.getNick(state, ctx.chat.id);
    const raw = (ctx.message?.text || "").split(" ").slice(1).join(" ").trim();
    // cố gắng bắt số tiền trong câu
    const m = raw.match(/(\d+[kKmMbB]?)/);
    const amount = m ? utils.parseMoney(m[1]) : utils.pick(SUGGEST);
    const reason =
      raw.replace(m?.[1] || "", "").trim() || "mục đích cao cả: làm vợ vui";

    const lines = [
      `🧾 *ĐƠN XIN KINH PHÍ TỪ QUỸ TÌNH YÊU*`,
      `Kính gửi: ${n} yêu dấu 💌`,
      `Số tiền đề nghị: *${fmtMoney(amount)}đ*`,
      `Lý do: ${reason}`,
      `Cam kết: hoàn trả bằng nụ hôn + rửa chén + khen 3 câu.`,
      `Xác nhận tình thương thay chữ ký.`,
    ];
    ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
  });
}
