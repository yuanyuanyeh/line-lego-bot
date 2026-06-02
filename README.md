# LINE LEGO Bot MVP

這是一版免費試用取向的 LINE Bot：每天整理 LEGO 消息，並支援在 LINE 輸入 `查 10333` 查指定盒組。

## 目前功能

- LINE webhook：接收文字訊息並回覆。
- 指令：
  - `今日` / `摘要`：抓 RSS 並產生今日 LEGO 摘要。
  - `查 10333`：回傳 demo 最低價與 LEGO / BrickLink / Brickset / eBay / Amazon 搜尋連結。
  - `help` / `說明`：顯示指令。
- 每日推送：可用 `ENABLE_DAILY_PUSH=true` 和 `DAILY_PUSH_TIME=08:00` 開啟。
- 無 npm 依賴：只用 Node.js 內建模組，方便先試。

## 資料來源

新聞 MVP 使用公開 RSS：

- Brickset
- Brickset New Sets
- The Brothers Brick
- Toys N Bricks
- Google News RSS query

價格 MVP 目前使用 `data/demo-prices.json` 的 demo 價格，加上各市場搜尋連結。正式版建議改接 eBay Browse API、Amazon Product Advertising API、BrickLink API 或你允許的台灣電商來源。

## 設定

1. 建立 LINE Official Account。
2. 到 LINE Developers 建立 Messaging API channel。
3. 複製 `.env.example` 成 `.env`。
4. 填入：

```env
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
LINE_USER_ID=...
CRON_SECRET=...
PORT=3000
TIMEZONE=Asia/Taipei
DAILY_PUSH_TIME=08:00
ENABLE_DAILY_PUSH=false
```

## 本機測試

```bash
npm run test
npm run summary
npm run price -- 10333
```

如果你的環境沒有 npm，也可以直接：

```bash
node src/cli.js test
node src/server.js
```

## LINE Webhook 測試

啟動服務：

```bash
node src/server.js
```

用 ngrok 或 Cloudflare Tunnel 將本機 `http://localhost:3000` 暴露成 HTTPS，然後在 LINE Developers 設定 webhook：

```text
https://your-tunnel-url/line/webhook
```

LINE Developers 裡也要開啟：

- Use webhook: Enabled
- Auto-reply messages: Disabled

## 每日推送

如果要用本服務內建排程，設定：

```env
ENABLE_DAILY_PUSH=true
DAILY_PUSH_TIME=08:00
```

另一種更穩的免費方案，是把服務部署在 Render/Fly.io/Railway free tier 或自己的 NAS，然後用 GitHub Actions 或 cron 每天呼叫：

```text
POST https://your-domain/tasks/daily-summary
```

如果有設定 `CRON_SECRET`，呼叫每日推送時要帶其中一種：

```text
POST https://your-domain/tasks/daily-summary?secret=你的CRON_SECRET
```

或：

```text
Authorization: Bearer 你的CRON_SECRET
```

## 部署到 Render

### 方法 A：Blueprint

1. 把 `line-lego-bot` 專案推到 GitHub repo。
2. 到 Render 選 New > Blueprint。
3. 選擇你的 GitHub repo。
4. Render 會讀取 `render.yaml` 建立 Web Service。
5. 在 Render dashboard 填入 secret env vars：
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_CHANNEL_SECRET`
   - `LINE_USER_ID`
6. 部署完成後，Render 會給你一個網址，例如：

```text
https://line-lego-bot.onrender.com
```

LINE Developers webhook 設定：

```text
https://line-lego-bot.onrender.com/line/webhook
```

### 方法 B：手動建立 Web Service

Render 設定：

```text
Runtime: Node
Build Command: 留空
Start Command: npm start
```

Environment variables：

```env
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
LINE_USER_ID=...
CRON_SECRET=一串夠長的隨機字串
TIMEZONE=Asia/Taipei
DAILY_PUSH_TIME=08:00
ENABLE_DAILY_PUSH=false
MAX_NEWS_ITEMS=8
```

### Render 免費方案注意事項

Render Free Web Service 可能會睡眠，所以不建議只靠服務內建 `ENABLE_DAILY_PUSH=true` 的 `setInterval` 做每日通知。比較穩的做法是：

1. 保持 `ENABLE_DAILY_PUSH=false`。
2. 用 Render Cron Job、cron-job.org、GitHub Actions 或其他排程，每天呼叫：

```text
POST https://你的Render網址/tasks/daily-summary?secret=你的CRON_SECRET
```

這樣即使服務睡著，外部排程也可以叫醒服務並推送摘要。

## 下一步

- 接真實價格 provider。
- 增加幣別、含運費、全新/二手條件。
- 增加 watchlist 的降價提醒。
- 把摘要改成 Flex Message 卡片格式。
- 加入資料庫保存歷史價格趨勢。
