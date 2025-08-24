import { anniversaryInfo, getNick } from "../utils.js";

export function registerBasic(bot, { state, utils, content }) {
  bot.start((ctx) => {
    const n = utils.getNick(state, ctx.chat.id);
    const { since, nextDate, until } = utils.anniversaryInfo(state, new Date());
    ctx.reply(
      [
        `Chào vợ iu ${n} 🌸`,
        "",
        "✨ Các lệnh nịnh cơ bản:",
        "/chi – khen (50 câu xoay vòng)",
        "/love – câu yêu thương",
        "/promise – lời hứa",
        "/sorry [lí do] – xin lỗi",
        "/dateidea – gợi ý hẹn hò",
        "/coupon – phiếu quà ngọt",
        "/truth • /dare • /chore",
        "",
        "💰 Xin – Quỹ – Mục tiêu:",
        "/atm [lí do] – đơn xin kinh phí",
        "/cho 200k [ghi chú] – vợ cho tiền",
        "/balance – xem số dư quỹ",
        "/trans – 10 giao dịch gần nhất",
        "/goal [tên] [số tiền] – tạo mục tiêu",
        "/goallist – danh sách mục tiêu",
        "/goalset [i] – chọn mục tiêu",
        "/goalpay [tiền] – nạp vào mục tiêu",
        "/goalclear [i] – xoá mục tiêu",
        "",
        "🎮 Mini-game:",
        "/slot – quay máy xin tiền",
        "/trivia – câu đố tình yêu",
        "/answer [đáp án] – trả lời trivia",
        "",
        "📷 Ảnh kỷ niệm:",
        "/chipic [n] – gửi ảnh",
        "/addchipic (reply ảnh) – thêm ảnh",
        "/listchipic – đếm ảnh",
        "/delchipic [i] – xoá ảnh",
        "",
        "🙏 Hũ biết ơn:",
        "/grat [nội dung] – thêm",
        "/gratlist – xem hũ",
        "/gratclear – dọn hũ",
        "",
        "🍽️ Ăn uống & Poll:",
        "/dinner A | B | C – chọn món",
        '/poll "Q" | A | B – tạo poll',
        "",
        "📊 Mood & Note:",
        "/mood [1..5], /moodavg",
        "/note … • /notelist • /notedel [i]",
        "/buy … • /buylist • /buydel [i]",
        "",
        "⏰ Hẹn giờ & Nhắc nhở:",
        "/timer 10m [nội dung]",
        "/habitstart • /habitstop",
        "/habitadd HH:mm [msg]",
        "/habitlist • /habitdel [i]",
        "",
        "🎁 Điểm & Shop:",
        "/votepoint [1..10] – vợ chấm điểm",
        "/points – xem điểm",
        "/shop – xem quà",
        "/redeem [mã] – đổi quà",
        "/vouchers – xem voucher",
        "",
        "💑 Khác:",
        "/anniversary – ngày kỷ niệm",
        "/setnick [tên] – đổi cách xưng hô",
        "/echo • /ping • /uptime",
        "",
        `Đã bên nhau: ${since} ngày. Kỷ niệm tiếp theo: ${nextDate} (còn ${until} ngày). 💞`,
      ].join("\n")
    );
  });

  bot.command("help", (ctx) => {
    ctx.reply(
      [
        "📌 Menu nhanh:",
        "— Cơ bản: /chi /love /promise /sorry /dateidea /coupon /truth /dare /chore",
        "— Xin tiền: /atm /cho /balance /trans",
        "— Mục tiêu: /goal /goallist /goalset /goalpay /goalclear",
        "— Mini-game: /slot /trivia /answer",
        "— Ảnh: /chipic /addchipic /listchipic /delchipic",
        "— Biết ơn: /grat /gratlist /gratclear",
        "— Ăn uống: /dinner /poll",
        "— Mood: /mood /moodavg",
        "— Note/Mua sắm: /note /notelist /notedel /buy /buylist /buydel",
        "— Nhắc nhở: /timer /habitstart /habitadd /habitlist",
        "— Shop: /votepoint /points /shop /redeem /vouchers",
        "— Khác: /anniversary /setnick /echo /ping /uptime",
      ].join("\n")
    );
  });
}
