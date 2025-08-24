import express from "express";
import { buildBot, setCommands, setWebhook } from "./bot.js";

const {
  TELEGRAM_BOT_TOKEN,
  PUBLIC_URL = "",
  WEBHOOK_SECRET_PATH = "/hook-" + Math.random().toString(36).slice(2),
  PORT = 3000,
} = process.env;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("Missing env TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

const app = express();
app.use(express.json());

const { bot, hookPath } = await buildBot({ PUBLIC_URL, WEBHOOK_SECRET_PATH });

app.get("/", (_req, res) => res.send("Wife Bot is up."));
app.get(hookPath, (_req, res) =>
  res.send("Webhook endpoint is alive (POST only).")
);
app.use(bot.webhookCallback(hookPath));

app.listen(PORT, async () => {
  console.log(`Server listening on ${PORT}`);
  await setCommands(bot);

  if (!PUBLIC_URL) {
    console.warn(
      "PUBLIC_URL is empty → Set trên Render rồi redeploy. Webhook chưa được set."
    );
    return;
  }
  await setWebhook(bot, PUBLIC_URL, hookPath);
});
