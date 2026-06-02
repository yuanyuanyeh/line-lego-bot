import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(__dirname, "..");

loadDotEnv(path.join(rootDir, ".env"));

export const config = {
  lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  lineChannelSecret: process.env.LINE_CHANNEL_SECRET || "",
  lineUserId: process.env.LINE_USER_ID || "",
  cronSecret: process.env.CRON_SECRET || "",
  port: Number(process.env.PORT || 3000),
  timezone: process.env.TIMEZONE || "Asia/Taipei",
  dailyPushTime: process.env.DAILY_PUSH_TIME || "08:00",
  enableDailyPush: String(process.env.ENABLE_DAILY_PUSH || "false").toLowerCase() === "true",
  maxNewsItems: Number(process.env.MAX_NEWS_ITEMS || 8)
};

export function dataPath(fileName) {
  return path.join(rootDir, "data", fileName);
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
