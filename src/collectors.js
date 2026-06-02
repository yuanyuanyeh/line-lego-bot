import { config } from "./config.js";
import { requestText } from "./http.js";

const FEEDS = [
  { source: "Brickset", url: "https://brickset.com/feed" },
  { source: "Brickset New Sets", url: "https://brickset.com/feed/category-new-sets" },
  { source: "The Brothers Brick", url: "https://www.brothers-brick.com/feed/" },
  { source: "Toys N Bricks", url: "https://www.toysnbricks.com/feed/" },
  { source: "Google News", url: "https://news.google.com/rss/search?q=LEGO%20new%20sets%20review%20price&hl=en-US&gl=US&ceid=US:en" }
];

export async function collectNews() {
  const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
  const items = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  return dedupe(items)
    .sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0))
    .slice(0, config.maxNewsItems);
}

async function fetchFeed(feed) {
  const xml = await requestText(feed.url);
  return parseRss(xml).map((item) => ({ ...item, source: feed.source }));
}

function parseRss(xml) {
  const itemBlocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  return itemBlocks.map((block) => ({
    title: cleanXml(readTag(block, "title")),
    url: cleanXml(readTag(block, "link")),
    published: cleanXml(readTag(block, "pubDate")),
    summary: cleanXml(readTag(block, "description"))
  })).filter((item) => item.title && item.url);
}

function readTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? match[1] : "";
}

function cleanXml(value) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(parseInt(decimal, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupe(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = `${item.title.toLowerCase()}|${item.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}
