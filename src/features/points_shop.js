import { fmtMoney } from "../utils.js";

const SHOP = [
  { code: "R1", name: "Xin 100k được xét duyệt ưu tiên", cost: 5 },
  { code: "R2", name: "Xin 200k (cần kèm 1 câu thơ)", cost: 9 },
  { code: "R3", name: "Miễn rửa chén 1 ngày", cost: 7 },
  { code: "R4", name: "Được chọn món ăn tối", cost: 4 },
  { code: "R5", name: "1 buổi xem phim do bạn chọn", cost: 6 },
];

function ensurePoints(state, chatId) {
  const cur = state.points.get(chatId);
  if (cur) return cur;
  const seeded = { score: 0, vouchers: [] };
  state.points.set(chatId, seeded);
  return seeded;
}

export function registerPointsShop(bot, { state }) {
  // /votepoint 3  (vợ chấm điểm cho chồng vì ngoan)
  bot.command("votepoint", (ctx) => {
    const v = parseInt((ctx.message?.text || "").split(" ")[1], 10);
    if (isNaN(v) || v < 1 || v > 10)
      return ctx.reply("Dùng: /votepoint [1..10]");
    const p = ensurePoints(state, ctx.chat.id);
    p.score += v;
    state.points.set(ctx.chat.id, p);
    ctx.reply(`Cộng ${v} điểm. Tổng: ${p.score} điểm. /shop để xem quà.`);
  });

  bot.command("points", (ctx) => {
    const p = ensurePoints(state, ctx.chat.id);
    ctx.reply(`Điểm hiện tại: *${p.score}*`, { parse_mode: "Markdown" });
  });

  bot.command("shop", (ctx) => {
    const lines = SHOP.map((x) => `• ${x.code} – ${x.name} (${x.cost}điểm)`);
    ctx.reply(
      ["Shop quà đổi điểm:", ...lines, "", "Đổi bằng: /redeem R1"].join("\n")
    );
  });

  bot.command("redeem", (ctx) => {
    const code = (ctx.message?.text || "").split(" ")[1]?.toUpperCase();
    if (!code) return ctx.reply("Dùng: /redeem R1");
    const item = SHOP.find((x) => x.code === code);
    if (!item) return ctx.reply("Mã quà không tồn tại. /shop");
    const p = ensurePoints(state, ctx.chat.id);
    if (p.score < item.cost)
      return ctx.reply(`Thiếu điểm. Cần ${item.cost}, hiện có ${p.score}.`);
    p.score -= item.cost;
    p.vouchers.push(code);
    state.points.set(ctx.chat.id, p);
    ctx.reply(
      `Đổi thành công: ${item.code} – ${item.name}\nVoucher: ${item.code}\nDùng khi xin tiền/đòi quyền lợi nha 😎`
    );
  });

  bot.command("vouchers", (ctx) => {
    const p = ensurePoints(state, ctx.chat.id);
    if (!p.vouchers.length) return ctx.reply("Chưa có voucher nào.");
    ctx.reply(
      ["Voucher đã đổi:", ...p.vouchers.map((v, i) => `${i + 1}. ${v}`)].join(
        "\n"
      )
    );
  });
}
