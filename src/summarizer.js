export function summarizeDaily(items, watchlist = []) {
  const today = new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeZone: "Asia/Taipei"
  }).format(new Date());

  const buckets = {
    "新品/上市": [],
    "價格/折扣": [],
    "Review": [],
    "其他消息": []
  };

  for (const item of items) {
    buckets[classify(item)].push(item);
  }

  const lines = [`LEGO 今日情報 ${today}`, ""];
  for (const [bucket, bucketItems] of Object.entries(buckets)) {
    if (!bucketItems.length) continue;
    lines.push(bucket);
    for (const item of bucketItems.slice(0, 3)) {
      lines.push(`- ${item.title}`);
      lines.push(`  ${item.source}: ${item.url}`);
    }
    lines.push("");
  }

  if (watchlist.length) {
    lines.push("追蹤盒組");
    for (const set of watchlist.slice(0, 5)) {
      lines.push(`- ${set.setNumber} ${set.name} 目標價 ${set.currency || "USD"} ${set.targetPrice}`);
    }
    lines.push("");
  }

  lines.push("查價：在 LINE 輸入「查 10333」");
  return lines.join("\n").trim();
}

function classify(item) {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  if (/(sale|discount|price|deal|offer|clearance|折扣|價格|特價)/.test(text)) return "價格/折扣";
  if (/(review|hands-on|評測|開箱)/.test(text)) return "Review";
  if (/(new set|revealed|launch|release|上市|新品|發表)/.test(text)) return "新品/上市";
  return "其他消息";
}
