import { parseMoney, fmtMoney } from "../utils.js";

function ensureWallet(state, chatId) {
  const cur = state.finance.get(chatId);
  if (cur) return cur;
  const seeded = { balance: 0, txns: [] };
  state.finance.set(chatId, seeded);
  return seeded;
}
function ensureGoals(state, chatId) {
  const cur = state.goals.get(chatId);
  if (cur) return cur;
  const seeded = { items: [], activeIndex: null };
  state.goals.set(chatId, seeded);
  return seeded;
}

export function registerFinance(bot, { state, utils }) {
  // /cho 200k [ghi chú]
  bot.command("cho", (ctx) => {
    const args = (ctx.message?.text || "").split(" ").slice(1);
    if (!args.length) return ctx.reply("Dùng: /cho 200k [ghi chú]");
    const v = parseMoney(args[0]);
    if (!v || v <= 0)
      return ctx.reply("Tiền không hợp lệ. Ví dụ: 200k, 150000, 1m");
    const note = args.slice(1).join(" ");

    const w = ensureWallet(state, ctx.chat.id);
    w.balance += v;
    w.txns.push({ ts: Date.now(), amount: v, note });
    state.finance.set(ctx.chat.id, w);

    ctx.reply(
      `Đã ghi nhận: +${fmtMoney(v)}đ. Số dư quỹ: ${fmtMoney(w.balance)}đ`
    );
  });

  bot.command("balance", (ctx) => {
    const w = ensureWallet(state, ctx.chat.id);
    ctx.reply(`Số dư quỹ vợ phát: *${fmtMoney(w.balance)}đ*`, {
      parse_mode: "Markdown",
    });
  });

  bot.command("trans", (ctx) => {
    const w = ensureWallet(state, ctx.chat.id);
    if (w.txns.length === 0) return ctx.reply("Chưa có giao dịch.");
    const recent = w.txns
      .slice(-10)
      .reverse()
      .map((t, i) => {
        const d = new Date(t.ts);
        return `${i + 1}. ${d.toLocaleString("vi-VN")} +${fmtMoney(
          t.amount
        )}đ ${t.note ? "— " + t.note : ""}`;
      });
    ctx.reply(["10 giao dịch gần nhất:", ...recent].join("\n"));
  });

  // Goals
  // /goal [tên] [số tiền] — đặt mục tiêu mới & active
  bot.command("goal", (ctx) => {
    const raw = (ctx.message?.text || "").slice(5).trim();
    // tách đuôi số tiền
    const m = raw.match(/(.*)\s(\d+[kKmMbB]?|\d{4,})$/);
    if (!m)
      return ctx.reply("Dùng: /goal iPad 20tr | /goal Nhẫn 5m | /goal Tour 3m");
    const name = m[1].trim();
    const amount = parseMoney(m[2].replace(/tr$/i, "000000")); // hỗ trợ “20tr”
    if (!amount) return ctx.reply("Số tiền mục tiêu không hợp lệ.");

    const g = ensureGoals(state, ctx.chat.id);
    g.items.push({ name, target: amount, saved: 0 });
    g.activeIndex = g.items.length - 1;
    state.goals.set(ctx.chat.id, g);

    ctx.reply(
      `Đã tạo mục tiêu: *${name}* – ${fmtMoney(amount)}đ (đang active)`,
      { parse_mode: "Markdown" }
    );
  });

  bot.command("goallist", (ctx) => {
    const g = ensureGoals(state, ctx.chat.id);
    if (g.items.length === 0) return ctx.reply("Chưa có mục tiêu.");
    const lines = g.items.map((it, i) => {
      const pct = (it.saved / it.target) * 100 || 0;
      return `${g.activeIndex === i ? "⭐ " : "• "}${i + 1}. ${
        it.name
      } – ${fmtMoney(it.saved)}/${fmtMoney(it.target)}đ (${pct.toFixed(1)}%)`;
    });
    ctx.reply(["Mục tiêu:", ...lines].join("\n"));
  });

  // /goalset [index] — chọn active
  bot.command("goalset", (ctx) => {
    const idx = parseInt((ctx.message?.text || "").split(" ")[1], 10);
    const g = ensureGoals(state, ctx.chat.id);
    if (isNaN(idx) || idx < 1 || idx > g.items.length)
      return ctx.reply(`Chọn từ 1..${g.items.length}`);
    g.activeIndex = idx - 1;
    state.goals.set(ctx.chat.id, g);
    ctx.reply(`Đã chọn mục tiêu #${idx}: ${g.items[idx - 1].name}`);
  });

  // /goalpay 200k — nạp vào mục tiêu active (trừ từ quỹ)
  bot.command("goalpay", (ctx) => {
    const v = parseMoney((ctx.message?.text || "").split(" ")[1]);
    if (!v) return ctx.reply("Dùng: /goalpay 200k");
    const w = ensureWallet(state, ctx.chat.id);
    const g = ensureGoals(state, ctx.chat.id);
    if (w.balance < v)
      return ctx.reply(`Không đủ quỹ (hiện: ${fmtMoney(w.balance)}đ).`);
    if (g.activeIndex == null)
      return ctx.reply(
        "Chưa chọn mục tiêu active. /goallist rồi /goalset [index]"
      );

    w.balance -= v;
    w.txns.push({ ts: Date.now(), amount: -v, note: "Nạp mục tiêu" });
    const it = g.items[g.activeIndex];
    it.saved += v;

    state.finance.set(ctx.chat.id, w);
    state.goals.set(ctx.chat.id, g);

    const pct = ((it.saved / it.target) * 100).toFixed(1);
    ctx.reply(
      `Đã nạp ${fmtMoney(v)}đ vào *${it.name}*. Tiến độ: ${fmtMoney(
        it.saved
      )}/${fmtMoney(it.target)}đ (${pct}%).`,
      { parse_mode: "Markdown" }
    );
  });

  // /goalclear — xóa mục tiêu (cần index): /goalclear 2
  bot.command("goalclear", (ctx) => {
    const idx = parseInt((ctx.message?.text || "").split(" ")[1], 10);
    const g = ensureGoals(state, ctx.chat.id);
    if (isNaN(idx) || idx < 1 || idx > g.items.length)
      return ctx.reply(`Chọn từ 1..${g.items.length}`);
    const removed = g.items.splice(idx - 1, 1)[0];
    if (g.activeIndex >= g.items.length)
      g.activeIndex = g.items.length ? g.items.length - 1 : null;
    state.goals.set(ctx.chat.id, g);
    ctx.reply(`Đã xoá mục tiêu: ${removed.name}`);
  });
}
