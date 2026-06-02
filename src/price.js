import fs from "node:fs";
import { dataPath } from "./config.js";

export function loadWatchlist() {
  return readJson("watchlist.json", []);
}

export function lookupPrice(setNumber) {
  const prices = readJson("demo-prices.json", {});
  const offers = prices[setNumber] || [];
  const links = marketplaceLinks(setNumber);
  const best = offers
    .filter((offer) => typeof offer.price === "number")
    .sort((a, b) => a.price - b.price)[0];

  return { setNumber, best, offers, links };
}

export function formatPriceLookup(result) {
  const lines = [`LEGO ${result.setNumber} 查價`];
  if (result.best) {
    lines.push("");
    lines.push(`目前 demo 最低價：${result.best.currency} ${result.best.price}`);
    lines.push(`來源：${result.best.market} (${result.best.condition})`);
    lines.push(result.best.url);
    if (result.best.note) lines.push(result.best.note);
  } else {
    lines.push("");
    lines.push("目前沒有本地 demo 價格。可先用下列連結查即時市場價格：");
  }
  lines.push("");
  lines.push("市場搜尋");
  for (const link of result.links) lines.push(`- ${link.name}: ${link.url}`);
  return lines.join("\n");
}

function marketplaceLinks(setNumber) {
  const query = encodeURIComponent(`LEGO ${setNumber}`);
  return [
    { name: "LEGO official", url: `https://www.lego.com/search?q=${setNumber}` },
    { name: "BrickLink", url: `https://www.bricklink.com/v2/search.page?q=${query}` },
    { name: "Brickset", url: `https://brickset.com/search?query=${setNumber}` },
    { name: "eBay", url: `https://www.ebay.com/sch/i.html?_nkw=${query}` },
    { name: "Amazon", url: `https://www.amazon.com/s?k=${query}` }
  ];
}

function readJson(fileName, fallback) {
  try {
    return JSON.parse(fs.readFileSync(dataPath(fileName), "utf8"));
  } catch {
    return fallback;
  }
}
