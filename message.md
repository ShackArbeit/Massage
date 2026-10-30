# 進度紀錄與續作指南

> 最後更新：2026-10-30
> 下次開啟 Claude Code 時，請說：「**請先讀 message.md 和 CLAUDE.md，從『下次要做的事』繼續**」。

---

## 一、目前狀態總覽

| 階段 | 內容 | 狀態 |
|---|---|---|
| 1 | 骨架（Vite + React + TS + Tailwind、Firebase 設定、模擬器） | ✅ 完成 |
| 2 | 題庫、驗證、條件顯示、全部表單元件 | ✅ 完成 |
| 3 | 簽名 Modal、圖片壓縮、寫入 Firestore、感謝頁 | ✅ 完成 |
| 4 | 翻譯 Cloud Function（Gemini）、德文預覽／編輯、過期標記 | ✅ 完成（本機用模擬翻譯驗證） |
| 5 | 後台：Google 登入守門、列表、詳細頁、刪除 | ✅ 完成 |
| 6 | 列印版型（A4、頁尾編號與頁碼） | ✅ 完成（已用 Edge 產生 PDF 驗證） |
| 7 | 安全與部署 | 🟡 **已部署，但 App Check 註冊未完成 → 正式站翻譯失敗** |
| 8 | 批次列印、CSV 匯出（加分項） | ⬜ 未開始 |

**正式網址：** https://massage-37b8c.web.app （後台：/admin）

---

## 二、⚠ 目前卡住的問題（下次第一件事）

**症狀：** 正式網站按「翻成德文」→ 顯示「翻譯失敗」。

**原因（已確認）：** App Check 回傳
`App not registered: 1:441541660223:web:5acf26b29888ebb148f28a`
→ Firebase Console 的 App Check 中，Web App 尚未成功註冊 reCAPTCHA Enterprise，所以前端拿不到 App Check token，翻譯函式回 401。

**疑點：** 目前用的金鑰 `6LfGZwcuAAAAAKk756GUGGjtvHtA1MdwHhnM9GLg` 在建立時有顯示 Secret key，可能是「舊版相容型」金鑰，Firebase 可能不接受。

**你要做的：**
1. Firebase Console → App Check → **應用程式（Apps）** → 你的 Web App → reCAPTCHA Enterprise → 貼上金鑰 ID → 儲存，**留意有沒有錯誤訊息**。
2. 若出現「reCAPTCHA Classic is deprecated」或其他錯誤：到 Google Cloud Console → Fraud Defense（reCAPTCHA）**建立新金鑰**（網站類型、網域 `massage-37b8c.web.app`、`massage-37b8c.firebaseapp.com`、不要選舊版／Classic、不要勾 checkbox）。正確的金鑰**只有 ID、沒有 Secret key**。用新 ID 註冊，並把新 ID 告訴 Claude。
3. 若提示要啟用 reCAPTCHA Enterprise API，按啟用。

**Claude 收到後要做的：**
- 用以下指令確認註冊成功（訊息應從 `App not registered` 變成 token 無效之類）：
  ```bash
  curl -s -X POST "https://content-firebaseappcheck.googleapis.com/v1/projects/massage-37b8c/apps/1:441541660223:web:5acf26b29888ebb148f28a:exchangeRecaptchaEnterpriseToken?key=AIzaSyA8l1YQT7QXrnR848IgRsLDSBUcnnZWhGs" -H "Content-Type: application/json" -d '{"recaptchaEnterpriseToken":"fake"}'
  ```
- 若換了新金鑰：更新根目錄 `.env.local` 的 `VITE_RECAPTCHA_SITE_KEY`。
- **重新部署**（本機有尚未部署的除錯改動，見第四節）：`npm run deploy`（需使用者同意）。
- 用正式網站測翻譯；失敗時查記錄：`npx firebase functions:log --only translateToGerman`。

---

## 三、下次要做的事（依序）

1. 解決上面的 App Check 註冊問題，重新部署。
2. **真機完整測試（MVP 驗收）：** 手機開正式網址 → 填寫 → 翻譯（應出現真正的德文）→ 簽名 → 送出 → 電腦登入 /admin 看到該筆 → 列印／另存 PDF（列印對話框取消勾選「頁首及頁尾」，建議用 Chrome／Edge）。
3. 測通後，Firebase Console → App Check → API → **Cloud Firestore → 強制執行**（先看已驗證請求比例接近 100% 再開）。
4. Google Cloud Console → 帳單 → **預算與快訊**（例如每月 NT$300，50/90/100% 通知）。
5. （選做）第 8 階段：批次列印、CSV 匯出。

---

## 四、本機有、但尚未部署到正式站的改動

- `web/src/lib/translate.ts`：翻譯失敗時在 Chrome Console 輸出診斷（錯誤代碼、endpoint、details），畫面錯誤訊息附錯誤代碼。
- `web/src/lib/firebase.ts`：載入時在 Console 印出連線模式與 App Check 狀態；改用 `ReCaptchaEnterpriseProvider`（此項已部署）。
- `functions/src/index.ts`：失敗時記錄錯誤原因；模擬器中把原因回傳前端。

→ 下次 `npm run deploy` 會一起上線。

---

## 五、本機開發與測試方式

**需要兩個終端機（都在 `C:\Users\user\Desktop\Massage`）：**

```powershell
# 終端機 1：模擬器（需要 Java；若 java 找不到，先執行下一行或把它加進永久 PATH）
$env:Path = "C:\Program Files\Java\latest\jdk-27.0.1.0.3\bin;" + $env:Path
npm run emulators

# 終端機 2：前端
npm run dev
```

- 問卷：http://localhost:5173 （手機同 Wi-Fi：http://172.20.10.3:5173）
- 後台：http://localhost:5173/admin （模擬器的假 Google 登入 → Add new account → 填 `g0972222165@gmail.com`）
- 模擬器管理介面：http://localhost:4000
- **本機翻譯是模擬的**，會回傳 `[DE-Test] 原文`，這是正常的（不呼叫 Gemini、不花錢）。由 `functions/.env.local` 的 `TRANSLATE_PROVIDER=mock` 控制。

**常用指令：**

| 指令 | 用途 |
|---|---|
| `npm run dev` | 前端開發伺服器 |
| `npm run emulators` | 產生 rules + 編譯 functions + 啟動模擬器 |
| `npm run rules` | 由題庫重新產生 `firestore.rules` |
| `npm run build` | 正式建置 |
| `npm run deploy` | 產生 rules 後部署全部（Rules + Hosting + Functions） |
| `npx firebase functions:log --only translateToGerman` | 看雲端翻譯函式記錄 |

---

## 六、重要設定與決策紀錄

**Firebase 專案：** `massage-37b8c`（Blaze 方案），Firestore 在 `asia-east1`，管理員 `g0972222165@gmail.com`。

**環境變數檔（皆不進版控，除了標註者）：**
- `.env.local`：Firebase 設定、管理員 email、App Check 網站金鑰、`VITE_USE_EMULATORS=true`
- `.env.production.local`：`VITE_USE_EMULATORS=false`（正式建置時覆寫）
- `functions/.env`：`TRANSLATE_PROVIDER=gemini`、`GEMINI_MODEL=gemini-2.5-flash`、`GEMINI_LOCATION=global`（**非機密，可進版控**）
- `functions/.env.local`：`TRANSLATE_PROVIDER=mock`（僅模擬器）
- reCAPTCHA 的 Secret key **不需要也沒有存**在任何檔案。

**與 CLAUDE.md 不同或補充的決定：**
- Functions 改用 **Node 22**（Node 20 已於 2026-10-30 停用，經同意，CLAUDE.md 已更新）。
- App Check 改用 **reCAPTCHA Enterprise（Google Cloud Fraud Defense）**，Classic v3 已不接受新註冊（CLAUDE.md 已更新）。
- `firestore.rules` 由 `web/scripts/build-rules.mjs` **從題庫自動產生**（欄位白名單、選項代碼、長度、範圍），內含管理員 email，故不進版控。改題目後執行 `npm run rules` 即可。
- `signedAt` 以 `createdAt`（serverTimestamp）代替。
- `relationship` 選「其他」有文字欄；`duration` 選「其他」沒有。
- 簽名：裁掉空白、寬約 600px、目標 ≤100KB；Rules 上限 150,000 字元。
- 頻率限制計數存在 `rateLimits` 集合（只存來源 IP 的雜湊），用戶端一律無法存取。
- 隱私聲明：資料永久保存，刪除請求聯絡 `VITE_CONTACT_EMAIL`（留空則用管理員 email）。

---

## 七、主要檔案位置

```
functions/src/index.ts        翻譯 callable（App Check、輸入驗證、頻率限制）
functions/src/translate.ts    Provider 介面、Gemini 與 Mock 實作、system prompt
functions/src/rateLimit.ts    每小時 30 次限制
web/src/survey/questions.ts   ★ 題庫（單一真相來源）
web/src/survey/conditions.ts  條件顯示、清除隱藏值
web/src/survey/schema.ts      zod 驗證與中德錯誤訊息
web/src/survey/submission.ts  表單 → Firestore 文件
web/src/survey/answers.ts     Firestore 文件 → 顯示用答案（後台與列印共用）
web/src/components/form/      所有表單元件
web/src/components/SignatureModal.tsx
web/src/components/print/PrintSheet.tsx + web/src/styles/print.css
web/src/pages/                SurveyPage, ThanksPage, AdminLayout, AdminLogin, AdminList, AdminDetail
web/scripts/build-rules.mjs   產生 firestore.rules
```

**備註：** 專案目前**不是 git repository**。若要版本控制，可請 Claude 執行 `git init`（`.gitignore` 已設定好，個資與金鑰不會被提交）。
