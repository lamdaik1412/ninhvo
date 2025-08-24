export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function getArgs(ctx, cmd) {
  const t = ctx.message?.text || "";
  const p = `/${cmd}`;
  if (!t.startsWith(p)) return "";
  return t.slice(p.length).trim();
}
export function escapeMD(s = "") {
  return s.replace(/([_*\[\]()~`>#+=|{}.!\\-])/g, "\\$1");
}

export const clampInt = (n, lo, hi) => Math.max(lo, Math.min(hi, n | 0));
export const isPhotoLike = (m) =>
  (m?.photo && m.photo.length) ||
  (m?.document && m.document.mime_type?.startsWith("image/"));

export function parseDuration(s) {
  const m = s.match(/^(\d+)([smh])$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit === "s") return n * 1000;
  if (unit === "m") return n * 60 * 1000;
  if (unit === "h") return n * 60 * 60 * 1000;
  return null;
}

// shuffle-bag per chat & key (no immediate repeat)
export function bagNext(state, chatId, key, arrayLen) {
  let chatBags = state.bags.get(chatId);
  if (!chatBags) {
    chatBags = {};
    state.bags.set(chatId, chatBags);
  }
  if (
    !chatBags[key] ||
    !Array.isArray(chatBags[key].pool) ||
    chatBags[key].pool.length === 0
  ) {
    const pool = Array.from({ length: arrayLen }, (_, i) => i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const last = chatBags[key]?.last;
    if (arrayLen > 1 && last !== undefined && pool[0] === last) {
      const k = Math.floor(Math.random() * (pool.length - 1)) + 1;
      [pool[0], pool[k]] = [pool[k], pool[0]];
    }
    chatBags[key] = { pool, last: last ?? -1 };
  }
  const idx = chatBags[key].pool.shift();
  chatBags[key].last = idx;
  state.bags.set(chatId, chatBags);
  return idx;
}
export const bagPick = (state, ctx, key, arr) =>
  arr[bagNext(state, ctx.chat.id, key, arr.length)];

export function getNick(state, chatId) {
  return state.nickMap.get(chatId) || "Vợ yêu";
}

export function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  return Math.floor((b - a) / MS);
}
export function anniversaryInfo(state, today = new Date()) {
  const base = new Date(state.weddingDateISO + "T00:00:00");
  const since = daysBetween(base, today);
  const tYear = today.getFullYear();
  let next = new Date(`${tYear}-08-17T00:00:00`);
  if (next < today) next = new Date(`${tYear + 1}-08-17T00:00:00`);
  const until = daysBetween(today, next);
  return { since, nextDate: next.toISOString().slice(0, 10), until };
}

export function nowInTZ(tz = "Asia/Ho_Chi_Minh") {
  const d = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(d)
    .reduce((acc, p) => ((acc[p.type] = p.value), acc), {});
  const ymd = `${parts.year}-${parts.month}-${parts.day}`;
  const hour = parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);
  return { ymd, hour, minute, date: d };
}

export function parseHHmm(s) {
  const m = (s || "").trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  let mm = m[2] ? parseInt(m[2], 10) : 0;
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return { hour: h, minute: mm };
}