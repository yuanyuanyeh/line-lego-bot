import crypto from "node:crypto";
import { config } from "./config.js";
import { requestJson } from "./http.js";

const LINE_API = "https://api.line.me/v2/bot/message";

export function verifyLineSignature(rawBody, signature) {
  if (!config.lineChannelSecret) return false;
  const digest = crypto
    .createHmac("sha256", config.lineChannelSecret)
    .update(rawBody)
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature || ""));
}

export async function replyMessage(replyToken, text) {
  if (!config.lineChannelAccessToken) return dryRun("reply", text);
  return requestJson(
    `${LINE_API}/reply`,
    authOptions(),
    {
      replyToken,
      messages: [{ type: "text", text: clipLineText(text) }]
    }
  );
}

export async function pushMessage(to, text) {
  if (!config.lineChannelAccessToken || !to) return dryRun("push", text);
  return requestJson(
    `${LINE_API}/push`,
    authOptions(),
    {
      to,
      messages: [{ type: "text", text: clipLineText(text) }]
    }
  );
}

function authOptions() {
  return {
    method: "POST",
    headers: { Authorization: `Bearer ${config.lineChannelAccessToken}` }
  };
}

function dryRun(kind, text) {
  console.log(`[LINE ${kind} dry-run]\n${text}`);
  return { dryRun: true };
}

function clipLineText(text) {
  return text.length > 4900 ? `${text.slice(0, 4890)}\n...` : text;
}
