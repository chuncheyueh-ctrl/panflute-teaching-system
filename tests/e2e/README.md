# 瀏覽器端對端測試

用本機的 Google Chrome（headless）測試 `public/legacy-app/index.html`。雲端是假的，不會碰到正式的 Firebase。

```bash
npm run test:e2e            # 跑整批（共用一個 Chrome、依本機資源自動並行）
npm run test:e2e -- b1 d2   # 只跑指定的測試
node tests/e2e/b1.mjs       # 單獨跑一個（自己開、自己關 Chrome）
npm run check:syntax        # 檢查 App 內所有 inline script 的語法
```

- 截圖、log、暫存瀏覽器資料都放在系統暫存區的 `panflute-e2e/`，可以用 `E2E_WORK` 改位置。
- `TEST_JOBS` 可以覆寫並行數，`TEST_HARD_TIMEOUT_MS` 可以覆寫單一測試的逾時時間（預設 240 秒）。
- `old.html` 是改用 IndexedDB 之前的舊版 App（git commit `0b1a889`），用來測試從舊版升級。
- 資源管理原則寫在專案的 `CLAUDE.md`。

| 測試 | 內容 |
|---|---|
| n1、n3 | 課程紀錄的多裝置同步與打字情境 |
| n2、n4 | 從舊版升級到 IndexedDB、救援還原 |
| n5 | 課程同步狀態列（離線） |
| b1、b2 | 考試成績依分數／名次發點數 |
| s3 | 缺考／補考、匯出 CSV、列印、進步名單 |
| d2 | 尚未上傳的提醒 |
| c1 | 一鍵壓縮舊照片 |
| p1 | 大頭貼延遲載入與縮圖 |
| tt | 成功訊息的小提示 |
| sp | 存檔合併與加點速度相關的資料正確性 |
| sc3 | 開始上課：下方面板、點小卡 +1、版面 |
| sa | 開始上課：全班出席、出席狀態切換、到課人數 |
| tl | 開始上課：依課表判斷上課狀態、時間軸對準、教學副駕駛、左側版面 |
| rd | 獎品兌換：扣點數、取消兌換加回、點數不足、未扣點清單與全部補扣 |
| dc | 換日：App 開著到隔天，開始上課日期跟著換成今天；自己選的日期不動 |
| fg | 忘帶紀錄：點名頁按鈕扣點／取消、常忘帶提醒、開始上課面板、忘帶統計、重新整理後保留 |
