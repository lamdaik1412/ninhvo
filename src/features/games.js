import { bagPick } from "../utils.js";

const REELS = ["❤️", "💎", "💵", "⭐", "🍬", "🥤", "🎁"];
const TRIVIA = [
  { q: "Ngày cưới của mình là ngày nào?", a: "17/8/2025" },
  { q: "Món vợ thích nhất?", a: "trà sữa" },
  { q: "Tên thú cưng/biệt danh dễ thương?", a: "tuỳ nhà bạn" },
  { q: "Lần đầu hẹn hò ở đâu?", a: "cầu/ban công/quán..." },
];

export function registerGames(bot, { state, utils }) {
  // Slot
  bot.command("slot", async (ctx) => {
    const r = () => utils.pick(REELS);
    const a = r(),
      b = r(),
      c = r();
    const line = `${a} | ${b} | ${c}`;
    let msg = `🎰 ${line}\n`;
    if (a === b && b === c)
      msg += "JACKPOT! Được xin tiền một cách đường hoàng 😎";
    else if (a === b || b === c || a === c)
      msg += "Gần trúng rồi! Xin nhẹ thôi nha 🤭";
    else msg += "Hơi đen xíu, nịnh thêm câu đã nào 😅";
    ctx.reply(msg);
  });

  // Trivia ask
  bot.command("trivia", (ctx) => {
    const q = bagPick(state, ctx, "trivia_q", TRIVIA);
    state.trivia.set(ctx.chat.id, { pending: q });
    ctx.reply(`❓ ${q.q}\nTrả lời bằng: /answer [đáp án]`);
  });

  // Trivia answer
  bot.command("answer", (ctx) => {
    const cur = state.trivia.get(ctx.chat.id);
    const ans = (ctx.message?.text || "")
      .split(" ")
      .slice(1)
      .join(" ")
      .trim()
      .toLowerCase();
    if (!cur?.pending)
      return ctx.reply("Không có câu hỏi nào đang mở. Gõ /trivia để bắt đầu.");
    const ok = ans && cur.pending.a.toLowerCase().includes(ans);
    state.trivia.set(ctx.chat.id, {});
    if (ok) {
      // thưởng điểm luôn
      const p = state.points.get(ctx.chat.id) || { score: 0, vouchers: [] };
      p.score += 2;
      state.points.set(ctx.chat.id, p);
      ctx.reply(`✅ Đúng rồi! +2 điểm. /points để xem điểm, /shop để đổi quà.`);
    } else {
      ctx.reply(`❌ Chưa đúng lắm. Đáp án gợi ý: ${cur.pending.a}`);
    }
  });
}
