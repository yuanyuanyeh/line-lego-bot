import { buildDailySummary } from "./bot.js";
import { formatPriceLookup, lookupPrice } from "./price.js";

const command = process.argv[2] || "test";

if (command === "summary") {
  console.log(await buildDailySummary());
} else if (command === "price") {
  console.log(formatPriceLookup(lookupPrice(process.argv[3] || "10333")));
} else if (command === "test") {
  console.log("== Daily summary ==");
  console.log(await buildDailySummary());
  console.log("\n== Price lookup ==");
  console.log(formatPriceLookup(lookupPrice("10333")));
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
