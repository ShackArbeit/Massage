# 按摩體驗回饋問卷系統

中德雙語的按摩體驗回饋問卷。受試者在前台填寫、翻譯意見並手寫簽名；管理員在後台查看、列印資料，或匯出 CSV。

- 正式網站：https://massage-37b8c.web.app
- 正式後台：https://massage-37b8c.web.app/admin
- 完整規格：`CLAUDE.md`

## 目錄

1. [本機啟動](#本機啟動)
2. [常用指令](#常用指令)
3. [部署](#部署)
4. [查看每次部署的變化](#查看每次部署的變化)
5. [系統架構](#系統架構)
6. [專案結構](#專案結構)
7. [檔案之間的關係](#檔案之間的關係)
8. [主要流程](#主要流程)
9. [常見修改](#常見修改)
10. [設定檔](#設定檔)

---

## 本機啟動

### 環境需求

- Node.js 22 以上
- Java（JDK 21 以上，Firestore 模擬器需要）
- 根目錄的 `.env.local`，以及 `functions/.env.local`

Firebase CLI 已裝在專案內，用 `npx firebase` 執行。第一次使用請先登入：

```powershell
npx firebase login
```

### 安裝套件

第一次使用，或套件有變動時，在專案根目錄執行：

```powershell
npm install
npm --prefix web install
npm --prefix functions install
```

### 啟動

需要開兩個終端機，都先切到專案根目錄 `C:\Users\user\Desktop\Massage`。

**終端機 1：模擬器**

```powershell
npm run emulators
```

看到 `All emulators ready!` 就表示啟動完成。如果找不到 `java`，先執行下面這行，或把 Java 加進永久 PATH：

```powershell
$env:Path = "C:\Program Files\Java\latest\jdk-27.0.1.0.3\bin;" + $env:Path
```

**終端機 2：前端**

```powershell
npm run dev
```

### 本機網址

| 用途 | 網址 |
|---|---|
| 問卷 | http://localhost:5173 |
| 後台 | http://localhost:5173/admin |
| 模擬器管理介面（查看資料） | http://localhost:4000 |
| 手機測試（同一個 Wi-Fi） | `npm run dev` 顯示的 `Network` 網址 |

手機連不上時，請確認 Windows 防火牆有允許連線。

### 本機與正式環境的差異

| 項目 | 本機 | 正式環境 |
|---|---|---|
| 翻譯 | 模擬翻譯，回傳 `[DE-Test] 原文`，不產生費用 | Vertex AI Gemini |
| 後台登入 | 模擬器的假登入視窗：按 Add new account，Email 填 `VITE_ADMIN_EMAIL` 的帳號 | 真正的 Google 登入 |
| 資料 | 存在模擬器，關閉後消失 | 存在雲端 Firestore |
| App Check | 不啟用 | 強制驗證 |

---

## 常用指令

都在專案根目錄執行。

| 指令 | 用途 |
|---|---|
| `npm run dev` | 啟動前端 |
| `npm run emulators` | 產生 Rules、編譯函式並啟動模擬器 |
| `npm run rules` | 由題庫重新產生 `firestore.rules` |
| `npm run build` | 正式建置 |
| `npm run deploy` | 部署全部（Rules、網站、翻譯函式） |
| `npx firebase deploy --only hosting` | 只部署網站 |
| `npx firebase deploy --only functions` | 只部署翻譯函式 |
| `npx firebase functions:log --only translateToGerman` | 查看雲端翻譯函式記錄 |

---

## 部署

正式網站跑的是上次上傳到雲端的版本，修改電腦上的程式碼不會影響雲端，所以要部署才會上線。

### 網址與部署位置

`massage-37b8c.web.app` 是 Firebase Hosting 依專案 ID 提供的預設網址，專案 ID 設定在 `.firebaserc`。

Firebase 專案本身就是一個 GCP 專案，所以兩邊看到的是同一個 `massage-37b8c`：

| 部分 | 使用的服務 | 實際運作位置 |
|---|---|---|
| 網站 | Firebase Hosting | Firebase 全球 CDN |
| 資料庫 | Firestore | GCP `asia-east1` |
| 翻譯函式 | Cloud Functions 2nd gen | GCP Cloud Run `asia-east1` |
| 翻譯模型 | Vertex AI Gemini | GCP |
| 後台登入 | Firebase Auth | Google 服務 |
| 防濫用 | App Check + Fraud Defense | Firebase + GCP |

### `npm run deploy` 做了什麼

它不是 CI/CD，而是你手動執行的指令，不會自動觸發，也不會自動跑測試。

**在你的電腦上：**

1. 從題庫產生 `firestore.rules`。
2. 編譯翻譯函式。
3. 建置前端，輸出到 `web/dist`。
4. 把結果上傳到雲端。

**在 Google 雲端上：**

1. 發布新的 Firestore Rules。
2. 在 Hosting 發布新版網站。
3. 用 Cloud Build 建置翻譯函式，再部署到 Cloud Run。

### 只部署一部分

| 改了什麼 | 指令 |
|---|---|
| 只改前端 | `npx firebase deploy --only hosting` |
| 只改翻譯函式 | `npx firebase deploy --only functions` |
| 改了題目（`questions.ts`） | `npm run deploy`，因為前端和 Rules 都要更新 |

部署時如果出現 `Timeout after 10000`，改用：

```powershell
$env:FUNCTIONS_DISCOVERY_TIMEOUT="60"; npm run deploy
```

---

## 查看每次部署的變化

Firebase Console 沒有一個頁面能看完整次部署，要依部署內容分開看。

| 想看什麼 | 位置 | 可以看到 |
|---|---|---|
| 網站 | [Hosting](https://console.firebase.google.com/project/massage-37b8c/hosting) → 版本記錄 | 部署時間、部署者、檔案數量，可回復舊版 |
| Firestore Rules | [Firestore Rules](https://console.firebase.google.com/project/massage-37b8c/firestore/databases/-default-/rules) | 歷次版本與新舊內容差異 |
| 翻譯函式 | [Functions](https://console.firebase.google.com/project/massage-37b8c/functions) | 目前版本、最後部署時間、執行記錄 |
| 函式的版本與環境變數 | [Cloud Run](https://console.cloud.google.com/run?project=massage-37b8c) → `translatetogerman` → 修訂版本 | 每次部署的版本，以及目前的 Gemini 型號 |
| 函式建置過程 | [Cloud Build](https://console.cloud.google.com/cloud-build/builds;region=asia-east1?project=massage-37b8c) | 建置成功或失敗，以及建置記錄 |

Console 看不到程式碼改了什麼。Hosting 只顯示上傳的成品，要比對程式碼請靠 git：部署前先 commit，之後用 `git log`、`git diff` 查看。

---

## 系統架構

```text
受試者（手機／電腦）
   │
   ▼
Firebase Hosting（React 網站）
   │                        │
   │ 翻譯                   │ 送出問卷（App Check + Firestore Rules）
   ▼                        ▼
Cloud Function             Firestore
translateToGerman          submissions
   │  App Check、            ▲
   │  輸入檢查、頻率限制     │ 讀取／刪除（僅管理員）
   ▼                        │
Vertex AI Gemini           管理員 /admin
                           Google 登入 → 列表 → 詳細 → 列印／CSV
```

專案分成三層：

| 層 | 資料夾 | 職責 |
|---|---|---|
| 問卷定義與資料邏輯 | `web/src/survey/` | 題目、條件、驗證、資料轉換，不含畫面 |
| 前端畫面與服務連線 | `web/src/pages/`、`components/`、`lib/` | 畫面呈現，以及呼叫 Firebase |
| 後端 | `functions/src/` | 只負責翻譯 |

核心原則：**題目只定義在 `questions.ts`**。表單、驗證、後台、列印、CSV 和 Firestore Rules 都由它產生。

---

## 專案結構

### 根目錄

```text
├─ CLAUDE.md                 專案規格書
├─ README.md                 本文件
├─ message.md                部署問答
├─ package.json              根目錄指令（dev、rules、emulators、deploy）
├─ firebase.json             Firebase 部署與模擬器設定
├─ .firebaserc               指定 Firebase 專案 ID
├─ firestore.rules           自動產生的 Firestore 安全規則（不進版控）
├─ firestore.indexes.json    Firestore 索引設定
├─ .env.example              環境變數範本
├─ functions/                後端
└─ web/                      前端
```

### 後端 `functions/`

```text
functions/
├─ .env                  部署用設定：翻譯服務、Gemini 型號
├─ .env.local            本機設定：改用模擬翻譯
├─ .env.example          設定範本
├─ package.json          後端套件，指定 Node 22
├─ tsconfig.json         TypeScript 設定
└─ src/
   ├─ index.ts           translateToGerman 入口：App Check、輸入檢查、錯誤處理
   ├─ translate.ts       翻譯服務介面、Gemini 與模擬實作、翻譯指示
   └─ rateLimit.ts       同一來源每小時 30 次的限制
```

### 前端 `web/`

```text
web/
├─ index.html                入口 HTML、載入字型
├─ package.json              前端套件
├─ vite.config.ts            Vite 設定，環境變數從根目錄讀取
├─ tsconfig.json             TypeScript 設定
├─ scripts/
│  └─ build-rules.mjs        由題庫產生 firestore.rules
└─ src/
   ├─ main.tsx               前端入口，載入全域樣式與路由
   ├─ App.tsx                路由表，後台頁面延遲載入
   ├─ index.css              Tailwind 與全域樣式
   ├─ vite-env.d.ts          環境變數型別
   ├─ styles/print.css       A4 列印樣式
   ├─ survey/                問卷定義與資料邏輯
   ├─ lib/                   Firebase 與瀏覽器功能
   ├─ pages/                 頁面
   └─ components/            元件
```

### `web/src/survey/`：問卷定義與資料邏輯

| 檔案 | 職責 |
|---|---|
| `questions.ts` | ★ 題庫：區塊、題目、選項、中德文字，以及表單值型別與預設值 |
| `conditions.ts` | 條件顯示、清除隱藏題的殘留值、送出前移除隱藏題 |
| `schema.ts` | 由題庫產生 zod 驗證，含中德錯誤訊息 |
| `submission.ts` | Firestore 文件型別；表單值 → Firestore 文件 |
| `answers.ts` | Firestore 文件 → 顯示用答案，後台、列印、CSV 共用 |
| `limits.ts` | 簽名長度上限，供 Rules 產生器使用 |

### `web/src/lib/`：服務連線

| 檔案 | 職責 |
|---|---|
| `firebase.ts` | 初始化 Firebase、App Check，並連接模擬器 |
| `auth.ts` | Google 登入、管理員判斷 |
| `translate.ts` | 呼叫翻譯函式、錯誤訊息、Console 診斷 |
| `submit.ts` | 把問卷寫入 Firestore |
| `submissions.ts` | 後台讀取與刪除資料 |
| `image.ts` | 簽名裁切、縮放、壓縮 |
| `csv.ts` | 產生並下載 CSV |
| `draft.ts` | 清除舊版留在瀏覽器的草稿，現在不再保存草稿 |

### `web/src/pages/`：頁面

| 檔案 | 路徑 | 職責 |
|---|---|---|
| `SurveyPage.tsx` | `/` | 問卷主頁：表單狀態、題號、進度、送出 |
| `ThanksPage.tsx` | `/thanks` | 感謝頁 |
| `AdminLayout.tsx` | `/admin/*` | 後台守門、頁首、提供共用資料 |
| `AdminLogin.tsx` | 由 `AdminLayout` 顯示 | 登入與無權限畫面 |
| `AdminList.tsx` | `/admin` | 列表、搜尋、排序、勾選、批次列印、CSV |
| `AdminDetail.tsx` | `/admin/:id` | 詳細資料、單筆列印、刪除 |

### `web/src/components/`：元件

**問卷版面（`form/`）**

| 檔案 | 職責 |
|---|---|
| `SectionCard.tsx` | A～F 區塊卡片，含 B 區收合與略過 |
| `ProgressBar.tsx` | 頂部進度條 |
| `SubmitBar.tsx` | 底部送出列與缺漏清單 |
| `QuestionField.tsx` | ★ 依題型分派到對應元件，並連接表單狀態 |
| `FieldShell.tsx` | 題目外框：題號、標籤、必填記號、錯誤訊息 |
| `Reveal.tsx` | 條件題的展開動畫 |

**問卷輸入（`form/`）**

| 檔案 | 用於 |
|---|---|
| `TextInput.tsx` | 文字、數字、Email、日期 |
| `SingleChoice.tsx` | 單選 |
| `MultiChoice.tsx` | 複選，含互斥選項 |
| `OptionCard.tsx` | 單選與複選共用的選項卡 |
| `OtherInput.tsx` | 「其他」文字欄 |
| `RatingScale.tsx` | 1–5 評分 |
| `Slider0to10.tsx` | 0–10 滑桿 |
| `Scale0to10.tsx` | 0–10 推薦度量表 |
| `TextAreaWithTranslate.tsx` | 意見欄、翻譯按鈕、德文預覽 |
| `CheckboxField.tsx` | 聲明勾選 |
| `SignatureField.tsx` | 簽名區塊與縮圖 |

**共用小元件（`form/`）：** `BilingualLabel.tsx`（中德並列文字）、`ButtonLabel.tsx`（按鈕文字）、`ErrorText.tsx`（錯誤訊息）、`inputStyles.ts`（輸入框樣式）

**其他元件**

| 檔案 | 職責 |
|---|---|
| `SignatureModal.tsx` | 手寫簽名視窗 |
| `ConfirmDialog.tsx` | 刪除確認視窗 |
| `PrivacyNote.tsx` | 問卷頁尾隱私聲明 |
| `icons.tsx` | 圖示與載入動畫 |
| `print/PrintSheet.tsx` | 單筆 A4 列印版型 |
| `admin/SubmissionsContext.tsx` | 後台共用資料：載入、重新載入、刪除 |
| `admin/AnswerView.tsx` | 詳細頁的答案呈現 |
| `admin/RatingDots.tsx` | 評分圓點 |

---

## 檔案之間的關係

### `questions.ts` 是資料的起點

```text
                         questions.ts
                              │
     ┌──────────┬─────────────┼──────────────┬───────────────┐
     ▼          ▼             ▼              ▼               ▼
conditions.ts  schema.ts   submission.ts   answers.ts   build-rules.mjs
 條件顯示       驗證規則    表單→資料庫     資料庫→顯示    產生 Rules
     │          │             │              │               │
     ▼          ▼             ▼              ▼               ▼
 SurveyPage   SurveyPage    submit.ts     AdminDetail    firestore.rules
                                          PrintSheet
                                          AdminList
                                          csv.ts
```

### 資料的三種形式

同一份問卷在系統裡有三種形式，由兩個檔案負責轉換：

```text
表單值 FormValues           Firestore 文件 Submission       顯示用答案 Answer
（填寫中）                  （儲存）                        （後台、列印、CSV）

ratingOverall: 5     ──►    ratings.overall: 5       ──►    ●●●●● 5 非常滿意 sehr gut
gender: "female"            gender: "female"                女 weiblich
age: "34"（字串）           age: 34（數字）                 34
signature: "..."            signaturePng: "..."             簽名圖片
              submission.ts                  answers.ts
```

### 頁面與元件

**問卷前台**

```text
main.tsx → App.tsx → SurveyPage
                       ├─ ProgressBar
                       ├─ SectionCard（A～F）
                       │    └─ Reveal → QuestionField
                       │                  └─ FieldShell → 各題型元件
                       │                       ├─ OtherInput
                       │                       ├─ TextAreaWithTranslate → lib/translate.ts
                       │                       └─ SignatureField → SignatureModal → lib/image.ts
                       ├─ SubmitBar
                       └─ PrivacyNote
```

**管理後台**

```text
App.tsx → AdminLayout ── 未登入 ──► AdminLogin
             │ 管理員
             ▼
       SubmissionsProvider（只載入一次資料）
             ├─ AdminList ── RatingDots、PrintSheet、lib/csv.ts
             └─ AdminDetail ── AnswerView、PrintSheet、ConfirmDialog
```

### 設定如何進入程式

```text
.env.local ─────────────┬─► firebase.ts、auth.ts、PrivacyNote（前端）
.env.production.local ──┘
.env.local（管理員 email）─► build-rules.mjs ─► firestore.rules

functions/.env ─────────► functions/src/index.ts（部署）
functions/.env.local ───► functions/src/index.ts（僅模擬器覆寫）
```

---

## 主要流程

### 填寫與驗證

1. `SurveyPage` 建立表單，預設值來自 `questions.ts`。
2. 每次輸入後，`conditions.ts` 判斷要顯示哪些題目，並清除被隱藏題目的值。
3. 按送出時，`schema.ts` 只驗證顯示中的題目。
4. 驗證失敗時，畫面捲到第一個錯誤，`SubmitBar` 列出缺漏項目。

重新整理頁面後，所有欄位都會清空。

### 翻譯

```text
TextAreaWithTranslate → lib/translate.ts
  → translateToGerman（functions/src/index.ts）
      1. App Check（正式環境）
      2. 檢查輸入
      3. rateLimit.ts 檢查次數
      4. translate.ts 呼叫 Gemini（本機為模擬翻譯）
  → 德文顯示在可修改的預覽框
```

中文在翻譯後被修改時，德文會標記為過期，重新翻譯才能送出。

### 簽名與送出

```text
SignatureField → SignatureModal → lib/image.ts（裁切、縮放、壓縮）
SurveyPage → lib/submit.ts → survey/submission.ts（移除隱藏題、轉換格式）
  → Firestore（Rules 檢查欄位、型別、長度）→ ThanksPage
```

### 後台與列印

1. `AdminLayout` 透過 `lib/auth.ts` 確認是管理員帳號。
2. `SubmissionsContext` 透過 `lib/submissions.ts` 載入資料，Rules 也會再次檢查管理員身分。
3. `AdminList` 負責搜尋、排序和勾選，`AdminDetail` 顯示單筆資料。
4. `PrintSheet` 平常隱藏，列印時才顯示，並套用 `styles/print.css`。
5. `lib/csv.ts` 依題庫產生欄位，並防範試算表公式注入。

### 安全機制

| 位置 | 保護內容 |
|---|---|
| `firestore.rules` | 寫入的資料格式；只有管理員能讀取、修改、刪除 |
| App Check | 只接受來自真實網站的請求 |
| `functions/src/index.ts` | 輸入檢查；不記錄受試者內容 |
| `functions/src/rateLimit.ts` | 限制翻譯次數，只存 IP 雜湊值 |
| `lib/auth.ts` | 前端的管理員判斷；真正的權限由 Rules 決定 |

---

## 常見修改

| 想做的事 | 要改的檔案 | 之後要做 |
|---|---|---|
| 新增或修改題目、選項 | `web/src/survey/questions.ts` | `npm run deploy` |
| 修改條件顯示 | `web/src/survey/conditions.ts` | `npm run deploy` |
| 修改驗證或錯誤訊息 | `web/src/survey/schema.ts` | 部署網站 |
| 修改翻譯語氣 | `functions/src/translate.ts` | 部署函式 |
| 更換 Gemini 型號 | `functions/.env` | 部署函式 |
| 修改翻譯次數限制 | `functions/src/index.ts` | 部署函式 |
| 修改列印版型 | `PrintSheet.tsx`、`styles/print.css` | 部署網站 |
| 修改隱私聲明 | `web/src/components/PrivacyNote.tsx` | 部署網站 |

新增題目時，每個題目和選項都要有中文與德文，並維持 `key` 與選項代碼穩定，已存資料是靠它們對照文字。新增新的資料欄位型別時，也要同步調整 `submission.ts`、`answers.ts` 和 `build-rules.mjs`。

`firestore.rules` 是自動產生的檔案，請不要手動修改。

---

## 設定檔

| 檔案 | 用途 | 進版控 |
|---|---|---|
| `.env.local` | Firebase 設定、管理員 email、App Check 金鑰 | 否 |
| `.env.production.local` | 正式建置時關閉模擬器 | 否 |
| `.env.example` | 環境變數範本 | 是 |
| `firestore.rules` | 自動產生，內含管理員 email | 否 |
| `functions/.env` | 翻譯服務與模型設定 | 是 |
| `functions/.env.local` | 本機改用模擬翻譯 | 否 |
| `functions/.env.example` | 函式設定範本 | 是 |

請勿把金鑰、受試者個資或簽名圖提交到版本控制。
