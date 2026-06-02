import http from "node:http";
import { config } from "./config.js";
import { handleLineEvent, pushDailySummary } from "./bot.js";
import { verifyLineSignature } from "./line.js";

let lastDailyPushKey = "";

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && requestUrl.pathname === "/health") {
      return send(res, 200, { ok: true, service: "line-lego-bot" });
    }

    if (req.method === "POST" && requestUrl.pathname === "/line/webhook") {
      const rawBody = await readBody(req);
      const signature = req.headers["x-line-signature"];
      if (!verifyLineSignature(rawBody, signature)) return send(res, 401, { ok: false, error: "Invalid LINE signature" });

      const payload = JSON.parse(rawBody);
      await Promise.all((payload.events || []).map(handleLineEvent));
      return send(res, 200, { ok: true });
    }

    if (req.method === "POST" && requestUrl.pathname === "/tasks/daily-summary") {
      if (!isAuthorizedCron(req, requestUrl)) return send(res, 401, { ok: false, error: "Invalid cron secret" });
      await pushDailySummary();
      return send(res, 200, { ok: true });
    }

    return send(res, 404, { ok: false, error: "Not found" });
  } catch (error) {
    console.error(error);
    return send(res, 500, { ok: false, error: error.message });
  }
});

server.listen(config.port, () => {
  console.log(`LINE LEGO Bot listening on http://localhost:${config.port}`);
  console.log(`Daily push: ${config.enableDailyPush ? config.dailyPushTime : "disabled"}`);
});

setInterval(async () => {
  if (!config.enableDailyPush) return;
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: config.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const currentTime = `${value.hour}:${value.minute}`;
  const key = `${value.year}-${value.month}-${value.day} ${currentTime}`;
  if (currentTime === config.dailyPushTime && key !== lastDailyPushKey) {
    lastDailyPushKey = key;
    await pushDailySummary();
  }
}, 30000);

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function send(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function isAuthorizedCron(req, requestUrl) {
  if (!config.cronSecret) return true;
  const authorization = req.headers.authorization || "";
  if (authorization === `Bearer ${config.cronSecret}`) return true;
  return requestUrl.searchParams.get("secret") === config.cronSecret;
}
