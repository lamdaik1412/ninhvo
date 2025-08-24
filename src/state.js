import fs from "fs";
const SAVE_FILE = "./data/wife_bot_state.json";

export function loadState() {
  const state = {
    nickMap: new Map(),
    gratitude: new Map(),
    pics: new Map(),
    moods: new Map(),
    lists: new Map(),
    notes: new Map(),
    bags: new Map(),
    timers: new Map(),
    daily: new Map(),
    finance: new Map(), // chatId -> { balance: number, txns: [{ts, amount, note}] }
    goals: new Map(), // chatId -> { items: [{name, target, saved}], activeIndex: number|null }
    points: new Map(), // chatId -> { score: number, vouchers: string[] }
    trivia: new Map(), // chatId -> { pending?: {q, a} }
    habits: new Map(), // chatId -> { enabled: true, times: [{h,m,msg}], lastYMDs: Set<string> }
    // =================
    weddingDateISO: "2025-08-17",
  };
  try {
    if (!fs.existsSync("./data")) fs.mkdirSync("./data");
    if (!fs.existsSync(SAVE_FILE)) return state;
    const j = JSON.parse(fs.readFileSync(SAVE_FILE, "utf8"));
    (j.nickMap || []).forEach(([k, v]) => state.nickMap.set(Number(k), v));
    (j.gratitude || []).forEach(([k, v]) => state.gratitude.set(Number(k), v));
    (j.pics || []).forEach(([k, v]) => state.pics.set(Number(k), v));
    (j.moods || []).forEach(([k, v]) => state.moods.set(Number(k), v));
    (j.lists || []).forEach(([k, v]) => state.lists.set(Number(k), v));
    (j.notes || []).forEach(([k, v]) => state.notes.set(Number(k), v));
    (j.bags || []).forEach(([k, v]) => state.bags.set(Number(k), v));
    (j.timers || []).forEach(([k, v]) => state.timers.set(Number(k), v));
    (j.daily || []).forEach(([k, v]) => state.daily.set(Number(k), v));
    (j.finance || []).forEach(([k, v]) => state.finance.set(Number(k), v));
    (j.goals || []).forEach(([k, v]) => state.goals.set(Number(k), v));
    (j.points || []).forEach(([k, v]) => state.points.set(Number(k), v));
    (j.trivia || []).forEach(([k, v]) => state.trivia.set(Number(k), v));
    (j.habits || []).forEach(([k, v]) => state.habits.set(Number(k), v));
  } catch (e) {
    console.warn("Load state error:", e.message);
  }
  return state;
}

export function saveState(state) {
  try {
    const j = {
      nickMap: Array.from(state.nickMap.entries()),
      gratitude: Array.from(state.gratitude.entries()),
      pics: Array.from(state.pics.entries()),
      moods: Array.from(state.moods.entries()),
      lists: Array.from(state.lists.entries()),
      notes: Array.from(state.notes.entries()),
      bags: Array.from(state.bags.entries()),
      timers: Array.from(state.timers.entries()),
      daily: Array.from(state.daily.entries()),
      finance: Array.from(state.finance.entries()),
      goals: Array.from(state.goals.entries()),
      points: Array.from(state.points.entries()),
      trivia: Array.from(state.trivia.entries()),
      habits: Array.from(state.habits.entries()),
    };
    fs.writeFileSync(SAVE_FILE, JSON.stringify(j));
  } catch (e) {
    console.warn("Save state error:", e.message);
  }
}
