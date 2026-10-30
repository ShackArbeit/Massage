# 按摩體驗回饋問卷

我要申請德國／奧地利的 Ausbildung，需要真實的按摩體驗回饋，所以做了這個中德雙語問卷。

被按摩的人用手機填問卷，把意見翻成德文，手寫簽名後送出。我再從後台把資料印成 A4，拿去公證。

- 問卷：https://massage-37b8c.web.app
- 後台：https://massage-37b8c.web.app/admin
- 詳細規格：`CLAUDE.md`

## 用到的東西

前端是 Vite、React 18、TypeScript 和 Tailwind，表單用 react-hook-form 加 zod，簽名用 signature_pad。

後端都在 Firebase 上：資料放 Firestore，後台用 Google 登入，網站放 Hosting。唯一的後端程式是翻譯用的 Cloud Function，它會去呼叫 Vertex AI 的 Gemini。App Check 用來擋不是從網站發出的請求。

## 在自己電腦上跑起來

需要 Node.js 22 以上，還有 Java（JDK 21 以上），因為 Firestore 模擬器要用。根目錄的 `.env.local` 和 `functions/.env.local` 也要先準備好，可以參考 `.env.example`。

第一次先裝套件：

```powershell
npm install
npm --prefix web install
npm --prefix functions install
```

Firebase CLI 已經裝在專案裡，不用另外裝，登入一次就好：

```powershell
npx firebase login
```

接著開兩個終端機，都切到專案根目錄。第一個跑模擬器：

```powershell
npm run emulators
```

看到 `All emulators ready!` 就可以了。如果它說找不到 java，先跑這行再試一次：

```powershell
$env:Path = "C:\Program Files\Java\latest\jdk-27.0.1.0.3\bin;" + $env:Path
```

第二個跑前端：

```powershell
npm run dev
```

然後就能打開這些網址：

- 問卷：http://localhost:5173
- 後台：http://localhost:5173/admin
- 模擬器的管理頁，可以看存進去的資料：http://localhost:4000

想用手機測的話，手機要跟電腦連同一個 Wi-Fi，開 `npm run dev` 印出來的 `Network` 網址。連不上通常是 Windows 防火牆擋住了。

### 本機跟正式環境不一樣的地方

- 翻譯是假的，只會回傳 `[DE-Test] 原文`。這樣測試不用花錢，看到這個不是壞掉。
- 後台登入也是假的。跳出視窗後按 Add new account，Email 填 `.env.local` 裡的 `VITE_ADMIN_EMAIL`。
- 資料只存在模擬器，關掉就沒了，不會動到正式資料。
- 本機沒有開 App Check。

## 常用指令

都在專案根目錄執行。

```powershell
npm run dev                # 跑前端
npm run emulators          # 跑模擬器，會順便產生 Rules、編譯函式
npm run rules              # 從題庫重新產生 firestore.rules
npm run build              # 正式建置
npm run deploy             # 全部部署

npx firebase deploy --only hosting            # 只部署網站
npx firebase deploy --only functions          # 只部署翻譯函式
npx firebase deploy --only firestore:rules    # 只部署 Rules，要先跑 npm run rules

npx firebase functions:log --only translateToGerman    # 看雲端翻譯函式的記錄
```

## 部署

改完程式要部署才會上線，正式網站跑的是上次上傳的版本。

`npm run deploy` 不是 CI/CD，就是我自己在電腦上手動跑的指令，不會自動測試，也不會在 push 後自動觸發。它會先在電腦上產生 Rules、編譯函式、建置前端，再上傳到雲端。雲端收到後會發布 Rules 和新版網站，並用 Cloud Build 建置函式、部署到 Cloud Run。

只改一部分的話，不用全部重來：

- 只改畫面：`npx firebase deploy --only hosting`
- 只改翻譯函式或 Gemini 型號：`npx firebase deploy --only functions`
- 改了題目：用 `npm run deploy`，因為網站和 Rules 都要更新

如果部署時出現 `Timeout after 10000`，可以放寬等待時間再跑一次：

```powershell
$env:FUNCTIONS_DISCOVERY_TIMEOUT="60"; npm run deploy
```

### 網址和部署位置

`massage-37b8c.web.app` 是 Firebase Hosting 給的預設網址，前面那段就是專案 ID。

Firebase 專案其實就是一個 GCP 專案，所以 Firebase Console 和 Google Cloud Console 看到的是同一個 `massage-37b8c`。網站在 Firebase Hosting；Firestore、翻譯函式和 Gemini 都跑在 GCP 上，資料庫和函式放在 `asia-east1`。

### 部署完去哪裡看

Firebase Console 沒有一頁能看到整次部署的內容，要分開看：

- 網站：[Hosting](https://console.firebase.google.com/project/massage-37b8c/hosting) 的版本記錄，有部署時間和檔案數，也能退回舊版。
- Rules：[Firestore Rules](https://console.firebase.google.com/project/massage-37b8c/firestore/databases/-default-/rules) 能看歷史版本和前後差異。
- 翻譯函式：[Functions](https://console.firebase.google.com/project/massage-37b8c/functions) 看最後部署時間和執行記錄。
- 想看更細的函式資訊：[Cloud Run](https://console.cloud.google.com/run?project=massage-37b8c) 有每次的版本和環境變數，[Cloud Build](https://console.cloud.google.com/cloud-build/builds;region=asia-east1?project=massage-37b8c) 有建置記錄。

這些地方都看不到程式碼改了什麼，那要看 git，所以部署前最好先 commit。

## 專案怎麼分

整體流程長這樣：

```text
受試者
  │
  ▼
網站（Firebase Hosting）
  ├─ 按翻譯 ──► translateToGerman ──► Gemini
  └─ 按送出 ──► Firestore 的 submissions
                     ▲
                     │ 只有我的帳號能讀
                 後台 /admin
```

資料夾大概是這樣：

```text
├─ CLAUDE.md                 規格書
├─ README.md
├─ package.json              根目錄指令
├─ firebase.json             部署和模擬器設定
├─ .firebaserc               Firebase 專案 ID
├─ firestore.rules           自動產生，不要手改
├─ firestore.indexes.json
├─ functions/                翻譯函式
└─ web/
   ├─ scripts/build-rules.mjs   產生 firestore.rules
   └─ src/
      ├─ survey/             題目和資料處理，沒有畫面
      ├─ lib/                跟 Firebase、瀏覽器打交道
      ├─ pages/              頁面
      ├─ components/         元件
      └─ styles/print.css    A4 列印樣式
```

根目錄的 `answer.md` 是我的個人筆記，跟這個專案無關。

### web/src/survey

最重要的資料夾。所有題目都寫在 `questions.ts`，要改題目通常只改這個檔案。

- `questions.ts`：題目、選項、中德文字，還有表單的預設值。
- `conditions.ts`：決定哪些題目要顯示，例如沒填按摩前的不適程度，就不問按摩後的。被隱藏的題目，值也會清掉。
- `schema.ts`：驗證規則和中德錯誤訊息，只檢查畫面上看得到的題目。
- `submission.ts`：把表單內容轉成存進 Firestore 的格式。
- `answers.ts`：反過來，把 Firestore 的資料轉成看得懂的文字，後台、列印、CSV 都用它。
- `limits.ts`：簽名大小上限，產生 Rules 時會用到。

### web/src/lib

- `firebase.ts`：連上 Firebase，開啟 App Check，本機時改連模擬器。
- `auth.ts`：Google 登入和判斷是不是管理員。
- `translate.ts`：呼叫翻譯函式。失敗時會在瀏覽器 Console 印出原因。
- `submit.ts`：把問卷寫進 Firestore。
- `submissions.ts`：後台讀取和刪除資料。
- `image.ts`：裁掉簽名四周的空白，再縮小壓縮。
- `csv.ts`：匯出 CSV。
- `draft.ts`：現在已經不存草稿了，只用來清掉舊版留在瀏覽器裡的資料。

### web/src/pages

- `SurveyPage.tsx`：問卷主頁（`/`），表單狀態和送出都在這裡。
- `ThanksPage.tsx`：感謝頁（`/thanks`）。要送出成功才進得來，直接打網址會被導回問卷。
- `AdminLayout.tsx`：後台的外框，負責檢查登入。
- `AdminLogin.tsx`：登入畫面，帳號不對也會顯示在這裡。
- `AdminList.tsx`：後台列表（`/admin`），有搜尋、排序、勾選、批次列印和匯出 CSV。
- `AdminDetail.tsx`：單筆資料（`/admin/:id`），可以列印和刪除。

### web/src/components

`form/` 放問卷元件。先看 `QuestionField.tsx`，它會依題型挑對應的元件來顯示：

- 外框和版面：`SectionCard`、`ProgressBar`、`SubmitBar`、`FieldShell`、`Reveal`
- 輸入類：`TextInput`、`SingleChoice`、`MultiChoice`、`OptionCard`、`OtherInput`、`RatingScale`、`Slider0to10`、`Scale0to10`、`CheckboxField`
- 比較特別的兩個：`TextAreaWithTranslate` 是意見欄和翻譯，`SignatureField` 是簽名區
- 小零件：`BilingualLabel`、`ButtonLabel`、`ErrorText`、`inputStyles.ts`

其他元件：

- `SignatureModal.tsx`：手寫簽名的視窗。
- `ConfirmDialog.tsx`：刪除前的確認視窗。
- `PrivacyNote.tsx`：問卷最下面的隱私聲明。
- `icons.tsx`：圖示。
- `print/PrintSheet.tsx`：A4 列印版型。
- `admin/`：後台專用，`SubmissionsContext` 讓列表和詳細頁共用同一份資料，另外還有 `AnswerView` 和 `RatingDots`。

### functions/src

- `index.ts`：翻譯函式的入口，檢查 App Check 和輸入。
- `translate.ts`：呼叫 Gemini，翻譯指示也寫在這裡。本機用的假翻譯也在這。
- `rateLimit.ts`：同一個來源每小時最多翻 30 次。只存 IP 的雜湊值，不存原始 IP。

## 檔案之間怎麼串起來

從 `questions.ts` 看起最容易懂，其他檔案幾乎都靠它：

```text
                      questions.ts
                           │
    ┌──────────┬───────────┼───────────┬──────────────┐
    ▼          ▼           ▼           ▼              ▼
conditions  schema    submission    answers     build-rules.mjs
    │          │           │           │              │
SurveyPage  SurveyPage  submit.ts   後台、列印、CSV  firestore.rules
```

同一筆資料會經過三種樣子：

```text
填寫中                 存進 Firestore            顯示出來
ratingOverall: 5  ──►  ratings.overall: 5  ──►  ●●●●● 非常滿意 sehr gut
age: "34"              age: 34                  34
       submission.ts              answers.ts
```

問卷頁的元件是這樣一層層包起來的：

```text
SurveyPage
├─ ProgressBar
├─ SectionCard（A～F 每區一張）
│  └─ QuestionField
│     └─ FieldShell ＋ 各題型元件
├─ SubmitBar
└─ PrivacyNote
```

後台則是先過 `AdminLayout` 這關。沒登入就顯示 `AdminLogin`，登入後才進到 `AdminList` 或 `AdminDetail`，資料由 `SubmissionsContext` 載入一次後共用。

### 實際操作時發生什麼

翻譯：按下按鈕後，`TextAreaWithTranslate` 透過 `lib/translate.ts` 呼叫雲端函式。函式依序檢查 App Check、輸入內容和次數限制，再請 Gemini 翻譯，德文回來後放進可以修改的預覽框。如果之後又改了中文，德文會變成過期，要重新翻譯才能送出。

送出：先由 `schema.ts` 檢查，沒過就捲到第一個錯誤。通過後 `submission.ts` 整理資料，`submit.ts` 寫進 Firestore，Firestore Rules 再檢查一次，都過了才進感謝頁。

列印：`PrintSheet` 平常藏著，列印時才出現，再套用 `print.css`。

重新整理問卷頁，所有欄位都會清空，填寫內容不會存在瀏覽器裡。

## 想改東西時

- 改題目或選項：`web/src/survey/questions.ts`，然後 `npm run deploy`。
- 改顯示條件：`web/src/survey/conditions.ts`，然後 `npm run deploy`。
- 改錯誤訊息：`web/src/survey/schema.ts`，部署網站。
- 改翻譯語氣：`functions/src/translate.ts`，部署函式。
- 換 Gemini 型號：`functions/.env`，部署函式。
- 改翻譯次數上限：`functions/src/index.ts`，部署函式。
- 改列印版面：`PrintSheet.tsx` 和 `styles/print.css`，部署網站。
- 改隱私聲明：`web/src/components/PrivacyNote.tsx`，部署網站。

幾件要小心的事：

- 每個題目和選項都要同時有中文和德文。
- 已經有資料之後，不要改題目的 `key` 和選項代碼，舊資料是靠它們對回文字的。
- 不要手改 `firestore.rules`，下次產生時會被蓋掉。要改就改 `web/scripts/build-rules.mjs`。
- Firestore Rules 有運算量上限，資料填得越滿，檢查越多。我就遇過 B 區全填再加上意見時，送出被拒絕。目前的餘裕不大，所以新增題目後，一定要把問卷全部填滿送一次看看。
- 新增全新的題型時，`questions.ts` 不夠，`submission.ts`、`answers.ts` 和 `build-rules.mjs` 也要一起改。

## 設定檔

- `.env.local`：Firebase 設定、管理員 email、App Check 金鑰。不進 git。
- `.env.production.local`：正式建置時關掉模擬器。不進 git。
- `functions/.env`：Gemini 型號等設定，不是機密，會進 git。
- `functions/.env.local`：讓本機用假翻譯。不進 git。
- `firestore.rules`：自動產生，裡面有管理員 email。不進 git。

金鑰、受試者個資和簽名圖都不要 commit。
