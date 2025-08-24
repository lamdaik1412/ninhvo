import { Telegraf } from "telegraf";
import { loadState, saveState } from "./state.js";
import { registerBasic } from "./features/basic.js";
import { registerCompliments } from "./features/compliments.js";
import { registerGratitude } from "./features/gratitude.js";
import { registerPhotos } from "./features/photos.js";
import { registerDinnerPoll } from "./features/dinner_poll.js";
import { registerMood } from "./features/mood.js";
import { registerNotesShopping } from "./features/notes_shopping.js";
import { registerTimer } from "./features/timer.js";
import { registerPoemStory } from "./features/poem_story.js";
import { registerMisc } from "./features/misc.js";
import * as utils from "./utils.js";
import * as content from "./content.js";

export async function buildBot({ PUBLIC_URL = "", WEBHOOK_SECRET_PATH }) {
  let hookPath =
    WEBHOOK_SECRET_PATH || "/hook-" + Math.random().toString(36).slice(2);
  if (!hookPath.startsWith("/")) hookPath = "/" + hookPath;
  if (PUBLIC_URL.endsWith("/")) PUBLIC_URL = PUBLIC_URL.slice(0, -1);

  console.log("ENV CHECK:");
  console.log("PUBLIC_URL         =", PUBLIC_URL || "(empty)");
  console.log("WEBHOOK_SECRET_PATH=", hookPath);

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  // error/log middlewares
  bot.catch((err, ctx) => {
    console.error("Bot error:", err);
    try {
      ctx.reply("Ui, bot bị vấp xíu. Mình thử lại nha 🤍");
    } catch {}
  });
  bot.use(async (ctx, next) => {
    const user = ctx.from
      ? `${ctx.from.username || ctx.from.first_name}(${ctx.from.id})`
      : "unknown";
    console.log(
      `[Update] ${new Date().toISOString()} - ${user} - ${ctx.updateType}`
    );
    await next();
  });

  // shared state across features
  const state = loadState();

  // register features
  registerBasic(bot, { state, utils, content });
  registerCompliments(bot, { state, utils, content });
  registerGratitude(bot, { state, utils, content });
  registerPhotos(bot, { state, utils, content });
  registerDinnerPoll(bot, { state, utils, content });
  registerMood(bot, { state, utils, content });
  registerNotesShopping(bot, { state, utils, content });
  registerTimer(bot, { state, utils, content });
  registerPoemStory(bot, { state, utils, content });
  registerMisc(bot, { state, utils, content });

  // autosave on exit
  process.on("SIGINT", () => {
    saveState(state);
    process.exit();
  });
  process.on("SIGTERM", () => {
    saveState(state);
    process.exit();
  });

  return { bot, hookPath };
}

export async function setCommands(bot) {
  try {
    await bot.telegram.setMyCommands([
      { command: "start", description: "Bắt đầu" },
      { command: "help", description: "Danh sách lệnh" },
      { command: "setnick", description: "Đổi cách xưng hô" },
      { command: "anniversary", description: "Ngày kỷ niệm" },

      { command: "chi", description: "Khen vợ (50 câu xoay vòng)" },
      { command: "love", description: "Câu yêu thương" },
      { command: "promise", description: "Lời hứa ngọt" },
      { command: "sorry", description: "Xin lỗi dễ thương" },
      { command: "dateidea", description: "Gợi ý hẹn hò" },
      { command: "coupon", description: "Tạo phiếu quà" },
      { command: "truth", description: "Câu hỏi thật lòng" },
      { command: "dare", description: "Thử thách đáng yêu" },
      { command: "chore", description: "Chọn việc nhà" },

      { command: "grat", description: "Bỏ vào hũ biết ơn" },
      { command: "gratlist", description: "Xem hũ biết ơn" },
      { command: "gratclear", description: "Dọn hũ biết ơn" },

      { command: "chipic", description: "Gửi ảnh kỷ niệm" },
      { command: "addchipic", description: "Reply ảnh để thêm vào kho" },
      { command: "listchipic", description: "Đếm ảnh kỷ niệm" },
      { command: "delchipic", description: "Xoá 1 ảnh" },

      { command: "dinner", description: "Chọn món tối (A | B | C)" },
      { command: "poll", description: "Tạo poll nhanh" },

      { command: "mood", description: "Lưu mood 1..5" },
      { command: "moodavg", description: "Mood trung bình" },

      { command: "note", description: "Ghi note" },
      { command: "notelist", description: "Xem note" },
      { command: "notedel", description: "Xoá note" },
      { command: "buy", description: "Thêm shopping list" },
      { command: "buylist", description: "Xem shopping list" },
      { command: "buydel", description: "Xoá item mua sắm" },

      { command: "timer", description: "Hẹn giờ 10m/30s/1h" },
      { command: "poem", description: "Thơ 4 câu" },
      { command: "story", description: "Chuyện yêu 3 câu" },

      { command: "echo", description: "Lặp lại an toàn" },
      { command: "ping", description: "Kiểm tra phản hồi" },
      { command: "uptime", description: "Thời gian chạy" },
    ]);
  } catch (e) {
    console.error("setMyCommands error:", e);
  }
}

export async function setWebhook(bot, PUBLIC_URL, hookPath) {
  const hookUrl = `${PUBLIC_URL}${hookPath}`;
  try {
    await bot.telegram.deleteWebhook();
    await bot.telegram.setWebhook(hookUrl);
    console.log("Webhook set to:", hookUrl);
  } catch (e) {
    console.error("setWebhook error:", e.response?.description || e.message);
  }
}
