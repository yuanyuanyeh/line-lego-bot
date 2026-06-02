import { collectNews } from "./collectors.js";
import { replyMessage, pushMessage } from "./line.js";
import { formatPriceLookup, loadWatchlist, lookupPrice } from "./price.js";
import { summarizeDaily } from "./summarizer.js";
import { config } from "./config.js";

export async function buildDailySummary() {
  const [items, watchlist] = await Promise.all([collectNews(), Promise.resolve(loadWatchlist())]);
  return summarizeDaily(items, watchlist);
}

export async function pushDailySummary() {
  const summary = await buildDailySummary();
  return pushMessage(config.lineUserId, summary);
}

export async function handleLineEvent(event) {
  if (event.type !== "message" || event.message?.type !== "text") return;
  if (event.source?.userId) {
    console.log(`LINE source userId: ${event.source.userId}`);
  }
  const text = event.message.text.trim();

  if (/^(help|幫助|說明)$/i.test(text)) {
    return replyMessage(event.replyToken, helpText());
  }

  if (/^(whoami|我是誰|userId)$/i.test(text)) {
    const userId = event.source?.userId || "unknown";
    return replyMessage(event.replyToken, `你的 LINE userId 已寫入 Render Logs。\nuserId: ${userId}`);
  }

  if (/^(summary|今日|摘要)$/i.test(text)) {
    return replyMessage(event.replyToken, await buildDailySummary());
  }

  const priceMatch = text.match(/^(查|price)\s*([0-9]{4,6})/i);
  if (priceMatch) {
    return replyMessage(event.replyToken, formatPriceLookup(lookupPrice(priceMatch[2])));
  }

  return replyMessage(event.replyToken, helpText());
}

function helpText() {
  return [
    "LEGO Bot 指令",
    "",
    "今日 / 摘要：取得今日 LEGO 情報",
    "查 10333：查指定盒組價格",
    "help / 說明：查看指令"
  ].join("\n");
}
