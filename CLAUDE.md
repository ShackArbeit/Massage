# CLAUDE.md — 按摩體驗回饋問卷系統（中德雙語）

> 本文件是給 Claude Code 的專案規格書。請**先完整閱讀**，再依「第 13 章 開發順序」逐步實作，每完成一階段先讓我在本地驗收再往下。

---

## 1. 專案目標

我（Shack）正在準備申請德國／奧地利的 Ausbildung（物理治療或按摩相關），需要蒐集真實的按摩體驗回饋，之後自行列印並至德／奧辦事處公證，作為申請的佐證資料。

**系統由兩部分組成：**

1. **前台（公開）**：受試者以手機或電腦填寫中德並列問卷，開放式意見可一鍵翻成口語德文，最後彈出視窗手寫簽名後送出。
2. **後台（僅限我）**：登入後可看到所有提交資料，點開任一筆可檢視完整內容並列印成 A4。

**不在範圍內：** 公證真實性驗證、金流、多管理者、多語系擴充（只做繁中＋德文）、本地資料庫。

**預估規模：** 最多約 200 筆。**期限：今天內完成可用版本（MVP）。**

---

## 2. 技術選型（已決定，請勿更換）

| 層 | 選擇 | 說明 |
|---|---|---|
| 前端 | Vite + React 18 + TypeScript | 純 SPA，不使用 Next.js |
| 路由 | react-router-dom | `/`（問卷）、`/thanks`、`/admin`、`/admin/:id` |
| 樣式 | Tailwind CSS | 設計規範見第 7 章 |
| 表單 | react-hook-form + zod | 驗證 schema 與題庫共用 |
| 簽名 | signature_pad | 彈出 Modal，輸出壓縮 PNG |
| 資料庫 | Firebase Firestore（`asia-east1`） | 不使用本地 DB |
| 驗證 | Firebase Auth（Google 登入） | 僅限我的帳號進後台 |
| 後端 | Firebase Cloud Functions（2nd gen, Node 22, TS, region `asia-east1`） | 只做翻譯（原定 Node 20，已於 2026-10-30 停用，經同意改 22） |
| 翻譯 | LLM（預設 Vertex AI Gemini；以 provider 介面包起來，可換成 Claude API） | 金鑰或權限只在後端 |
| 防濫用 | Firebase App Check（reCAPTCHA Enterprise／Google Cloud Fraud Defense；Classic v3 已不接受新註冊） | 保護 Functions 與 Firestore |
| 部署 | Firebase Hosting + Firebase CLI | GCP 底下，一個專案搞定 |

---

## 3. 架構

```
[受試者手機/電腦]
   │  React 前台問卷
   ▼
Firebase Hosting ──► Cloud Function: translateToGerman (callable, App Check)
   │                         │ → LLM（Vertex AI Gemini / Claude API）
   └──────────────► Firestore: submissions（僅可 create）
                              ▲
[Shack] /admin（Google 登入 → 列表 → 詳細 → 列印 CSS → 另存 PDF）
```

---

## 4. 專案結構

```
/
├─ CLAUDE.md
├─ firebase.json
├─ firestore.rules
├─ firestore.indexes.json
├─ .env.example
├─ functions/
│  ├─ src/
│  │  ├─ index.ts              # translateToGerman callable
│  │  ├─ translate.ts          # provider 抽象 + prompt
│  │  └─ rateLimit.ts
│  └─ package.json
└─ web/
   ├─ src/
   │  ├─ survey/
   │  │  ├─ questions.ts        # ★ 題庫（單一真相來源，見第 5 章）
   │  │  ├─ schema.ts           # 由題庫產生 zod schema
   │  │  └─ conditions.ts       # 條件顯示邏輯
   │  ├─ components/
   │  │  ├─ form/               # BilingualLabel, SingleChoice, MultiChoice,
   │  │  │                      # RatingScale, Slider0to10, TextAreaWithTranslate,
   │  │  │                      # SectionCard, ProgressBar
   │  │  ├─ SignatureModal.tsx
   │  │  └─ print/PrintSheet.tsx
   │  ├─ pages/ SurveyPage, ThanksPage, AdminLogin, AdminList, AdminDetail
   │  ├─ lib/ firebase.ts, submit.ts, image.ts（簽名壓縮）
   │  └─ styles/print.css
   └─ package.json
```

**原則：題目只在 `questions.ts` 定義一次**，表單渲染、驗證、後台顯示、列印版型全部由它驅動。新增或修改題目不得需要改動多處。題號由程式依顯示順序自動產生，**不要寫死**，一律用 `key` 識別。

---

## 5. 問卷題庫（完整）

說明：`zh` 為繁體中文、`de` 為德文，**每個題目與每個選項都必須同時有 zh 與 de**。`必填`欄位標 ★。

### A. 基本資料 Grunddaten（必填）

| key | 題目 zh / de | 型態 | 備註 |
|---|---|---|---|
| `name` ★ | 姓名 / Name | 文字 | |
| `gender` ★ | 性別 / Geschlecht | 單選 | 男 männlich／女 weiblich／其他 divers／不願透露 keine Angabe |
| `age` ★ | 年齡 / Alter | 數字 | 範圍 10–100 |
| `email` ★ | Email / E-Mail | email | 格式驗證 |
| `massageDate` ★ | 體驗按摩日期 / Datum der Massage | 日期 | 不得晚於今天 |
| `duration` ★ | 按摩時長 / Dauer | 單選 | 30 分鐘 Min.／60／90／其他 Sonstiges |
| `massageType` ★ | 按摩類型 / Art der Massage | 單選 | 肩頸 Nacken & Schultern／全身 Ganzkörper／運動按摩 Sportmassage／其他 Sonstiges（附文字欄） |
| `relationship` ★ | 與按摩者的關係 / Beziehung zum Masseur | 單選 | 朋友 Freund/in／家人 Familie／同事或同學 Kolleg/in / Mitschüler/in／陌生人（客人）Fremde Person (Kunde/Kundin)／其他 Sonstiges |

### B. 按摩前 Vor der Massage（整區**選填 Freiwillig**，可整區跳過）

區塊頂部顯示提示：「本區為自願填寫，含健康與生活習慣資料，可略過。／ Dieser Bereich ist freiwillig und enthält Gesundheits- und Lebensstilangaben. Sie können ihn überspringen.」

| key | 題目 zh / de | 型態 | 選項 |
|---|---|---|---|
| `complaintAreas` | 主要不適或緊繃部位 / Hauptbeschwerden | 複選 | 頸部 Nacken／肩膀 Schultern／上背 oberer Rücken／下背 unterer Rücken／手臂 Arme／臀腿 Hüfte & Beine／足部 Füße／頭部 Kopf／無 keine（與其他互斥）／其他 Sonstiges（文字欄） |
| `painBefore` | 按摩前不適程度 / Beschwerden vorher | 滑桿 0–10 | 0 無 keine … 10 非常嚴重 sehr stark |
| `workType` | 工作型態（需要久坐或久站？）/ Arbeitsweise | 單選 | 久坐（辦公室、電腦）überwiegend sitzend／久站（服務業、廚房、站櫃）überwiegend stehend／坐站交替 abwechselnd sitzend und stehend／勞力、搬重物 körperlich schwere Arbeit／經常移動或開車 viel unterwegs / Autofahren／學生 Student/in／目前無工作 derzeit nicht berufstätig／其他 Sonstiges（文字欄） |
| `postureHours` | 每天久坐或久站的時間 / Wie lange täglich in dieser Haltung? | 單選 | 少於 2 小時 unter 2 Std.／2–4 小時／4–6 小時／6–8 小時／超過 8 小時 über 8 Std. |
| `exerciseFreq` | 是否有固定運動習慣 / Regelmäßige Bewegung bzw. Sport | 單選 | 沒有 nein, gar nicht／偶爾（每月數次）gelegentlich／每週 1–2 次 1–2× pro Woche／每週 3–4 次 3–4× pro Woche／每週 5 次以上 5× oder öfter pro Woche |
| `exerciseTypes` | 習慣做哪些運動 / Welche Sportarten? | 複選 | 跑步 Laufen／游泳 Schwimmen／健走 Spazieren／騎自行車 Radfahren／重量訓練 Krafttraining／瑜伽、皮拉提斯 Yoga / Pilates／球類 Ballsport／登山健行 Wandern／武術、舞蹈 Kampfsport / Tanz／其他 Sonstiges（文字欄） |
| `stretchFreq` | 是否有固定拉筋習慣 / Dehnen bzw. Stretching | 單選 | 每天 täglich／每週數次 mehrmals pro Woche／偶爾 gelegentlich／幾乎沒有 selten／從不 nie |
| `selfMassageFreq` | 是否有自我按摩習慣 / Selbstmassage | 單選 | 同上五級頻率 |
| `selfMassageTools` | 使用哪些自我按摩方式 / Welche Hilfsmittel? | 複選 | 徒手 mit den Händen／筋膜球 Faszienball／滾筒 Faszienrolle／按摩槍 Massagepistole／按摩椅或按摩墊 Massagesessel / -matte／其他 Sonstiges（文字欄） |

### C. 體驗評分 Bewertung（必填，1–5 分）

統一量表標籤：1 很不滿意 sehr schlecht｜2 不滿意 schlecht｜3 普通 mittel｜4 滿意 gut｜5 非常滿意 sehr gut

| key | 題目 zh / de |
|---|---|
| `ratingExpertise` | 專業度與知識 / Fachkompetenz |
| `ratingCommunication` | 溝通：是否詢問力道與舒適度 / Kommunikation (Nachfragen zu Druck und Komfort) |
| `ratingPressure` | 力道是否合適 / Passende Druckstärke |
| `ratingBoundaries` | 尊重界線與隱私 / Respekt vor persönlichen Grenzen und Privatsphäre |
| `ratingHygiene` | 衛生與環境整潔 / Hygiene & Sauberkeit |
| `ratingPunctuality` | 守時與準備 / Pünktlichkeit & Vorbereitung |
| `ratingOverall` | 整體滿意度 / Gesamtzufriedenheit |

### D. 按摩後 Nach der Massage

| key | 題目 zh / de | 型態 | 必填 |
|---|---|---|---|
| `painAfter` | 按摩後不適程度 / Beschwerden nachher | 滑桿 0–10 | 若 B 區填了 `painBefore` 才顯示，否則隱藏 |
| `rebook` ★ | 是否願意再次預約 / Würden Sie wieder buchen? | 單選：是 ja／可能 vielleicht／否 nein | ★ |
| `recommend` ★ | 是否會推薦給他人 / Weiterempfehlung | 0–10 量表 | ★ |

### E. 開放式意見 Freie Kommentare（皆可翻譯成德文）

| key | 題目 zh / de | 必填 |
|---|---|---|
| `commentPositive` | 印象最深的優點 / Was hat Ihnen besonders gut gefallen? | ★ |
| `commentImprove` | 可以改進的地方 / Was kann verbessert werden? | 選填 |
| `commentOther` | 其他整體意見 / Weitere Kommentare | 選填 |

每個欄位的資料結構：`{ zh: string, de: string, deEditedByUser: boolean }`。

### F. 聲明與簽名 Erklärung & Unterschrift（必填）

| key | 內容 zh / de |
|---|---|
| `confirmTruthful` ★ | ☐ 我確認以上內容為我真實的體驗。／ Ich bestätige, dass meine Angaben wahrheitsgemäß sind. |
| `consentStorage` ★ | ☐ 我同意此資料（含姓名、Email 與自願填寫的健康資料）被保存，並用於 Shack 的職業培訓（Ausbildung）申請。B 區為自願填寫。／ Ich willige ein, dass meine Daten (einschließlich Name, E-Mail und freiwilliger Gesundheitsangaben) gespeichert und für die Bewerbung um eine Berufsausbildung von Shack verwendet werden. Der Bereich B ist freiwillig. |
| `signature` ★ | 簽名（彈出視窗）／ Unterschrift |
| `signedAt` | 簽署日期（系統自動帶入，使用者不可改）／ Datum (automatisch) |

---

## 6. 條件顯示與驗證邏輯（寫在 `conditions.ts`）

1. `exerciseTypes` 僅在 `exerciseFreq` 有選擇且**不是**「沒有」時顯示。
2. `selfMassageTools` 僅在 `selfMassageFreq` 有選擇且**不是**「從不」時顯示。
3. `postureHours` 僅在 `workType` 為「久坐／久站／坐站交替／勞力／經常移動」時顯示（學生、無工作、其他時隱藏，但學生仍可自行跳過）。
4. `painAfter` 僅在 `painBefore` 有填時顯示。
5. 複選題的「無 keine」與其他選項互斥；選「其他」時才展開文字欄（必填、最多 100 字）。
6. 被隱藏的題目**不得**進入送出資料，且需清除其殘留值。
7. 送出前必須：所有必填題完成、兩個核取方塊皆勾選、已簽名、**每個有填寫的開放式意見都已有德文版本**（見第 8 章）。
8. 驗證錯誤顯示在題目下方（中德並列），並自動捲動到第一個錯誤。

---

## 7. 前台 UI／UX 規範（整潔、邏輯、完整、美觀）

**整體風格：** 乾淨、溫潤、專業的健康／療癒感。白底或極淡暖灰底，主色用沉穩的青綠或藍綠（如 teal-600），輔助色低飽和，避免花俏。字體：中文 Noto Sans TC、德文與數字 Inter，行高寬鬆。

**版面：**
- 單欄、置中、最大寬度約 720px，**手機優先**（受試者多半用手機填寫），所有點擊目標至少 44px 高。
- 每個區塊（A～F）是一張圓角卡片（`SectionCard`），含區塊標題（中文大、德文小）與簡短說明。
- 頂部固定進度條，顯示 A～F 完成度。
- 頁首顯示標題「按摩體驗回饋 Massage-Feedback」、一段簡短用途說明（中德）。

**中德並列規則（最重要）：**
- 一律用 `BilingualLabel`：**中文為主行（深色、字較大），德文為副行（灰色、字較小）**，上下堆疊，**不要左右分欄**（手機會擠）。
- 選項也一樣：中文在上、德文在下，放進同一個可點擊的卡片／chip 內。
- 錯誤訊息、提示文字、按鈕文字也都要中德並列。

**元件：**
- 單選／複選：大型選項卡，選取時有明確的色塊與勾勾；複選要有視覺差異（方形勾）。
- 評分 1–5：橫排大圓鈕或星形，下方顯示當前選擇的中德標籤；手機上不換行。
- 滑桿 0–10：顯示目前數值與兩端中德標籤。
- 日期：原生 date input。
- B 區：標示「選填 Freiwillig」徽章，預設可整區收合，並提供「略過本區 Überspringen」按鈕。
- 條件顯示的題目用平滑展開動畫，不要突然跳出。
- 送出按鈕固定在底部（sticky），未通過驗證時顯示還缺哪些項目。
- 要有載入、成功、失敗三種狀態；翻譯中與送出中按鈕要 disabled 並顯示 spinner。
- 無障礙：label 與 input 正確關聯、鍵盤可操作、對比度足夠。

**草稿保護：** 以 `localStorage` 暫存填寫內容（包裝 try/catch），重新整理不遺失；送出成功後清除。**簽名圖不存入 localStorage。**

---

## 8. 翻譯流程與簽名

### 翻譯（開放式意見）
1. 受試者以中文填寫 E 區欄位。
2. 欄位下方有「翻成德文 Ins Deutsche übersetzen」按鈕。
3. 呼叫 Cloud Function `translateToGerman`，回傳**口語化、自然的德文**。
4. 德文顯示在一個**可編輯**的預覽框，標示「德文預覽（可修改）Deutsche Vorschau (bearbeitbar)」。
5. 受試者修改德文時，`deEditedByUser = true`。
6. 若中文在翻譯後又被修改，德文標記為「已過期」，必須重新翻譯才能送出。
7. 德文與中文原文**都要存入資料庫**。

### Cloud Function 規格
- 型態：callable function，開啟 App Check 強制驗證，region `asia-east1`。
- 輸入：`{ items: { key: string, zh: string }[] }`（最多 3 項，每項最多 1000 字）。
- 輸出：`{ items: { key: string, de: string }[] }`。
- 簡易頻率限制：同一來源每小時最多 30 次，超過回傳錯誤。
- 不記錄使用者內容到 log。
- System prompt 重點（請寫進 `translate.ts`）：
  > 你是專業的中翻德翻譯。將使用者以第一人稱寫的按摩體驗回饋，翻譯成**自然、口語、禮貌**的德文（以 ich 為主語，語氣像真人寫的客戶回饋，不要過度書面或浮誇）。**忠實保留原意，不增添、不刪減、不美化任何事實或評價。** 只輸出 JSON，不要任何解釋。
- LLM provider 以介面包裝（`translate(items): Promise<...>`），預設 Vertex AI Gemini；若改用 Claude API，金鑰存 Secret Manager，**絕不可放前端或進版控**。

### 簽名 Modal
- 點「簽名 Unterschrift」按鈕彈出全螢幕（手機）／置中（桌機）視窗。
- 使用 signature_pad，畫布高解析（依 devicePixelRatio 調整）、白底黑筆，支援手指與滑鼠。
- 按鈕：清除 Löschen、取消 Abbrechen、確認 Bestätigen（中德並列）。畫布為空時不可確認。
- 確認後在表單內顯示簽名縮圖，並可重新簽。
- 輸出 PNG 後在 `lib/image.ts` 縮放（寬度約 600px）並壓縮，**目標 ≤ 100KB**，以 base64 data URL 存入 Firestore。
- `signedAt` 使用伺服器時間（`serverTimestamp()`）。

---

## 9. 資料模型（Firestore）

集合：`submissions`（文件 ID 由 Firestore 自動產生）

```ts
type Submission = {
  schemaVersion: 1;
  createdAt: Timestamp;            // serverTimestamp
  // A
  name: string; gender: string; age: number; email: string;
  massageDate: string;             // YYYY-MM-DD
  duration: string; massageType: string; massageTypeOther?: string;
  relationship: string; relationshipOther?: string;
  // B（皆可缺）
  complaintAreas?: string[]; complaintAreasOther?: string;
  painBefore?: number;
  workType?: string; workTypeOther?: string; postureHours?: string;
  exerciseFreq?: string; exerciseTypes?: string[]; exerciseTypesOther?: string;
  stretchFreq?: string;
  selfMassageFreq?: string; selfMassageTools?: string[]; selfMassageToolsOther?: string;
  // C
  ratings: Record<'expertise'|'communication'|'pressure'|'boundaries'|'hygiene'|'punctuality'|'overall', number>;
  // D
  painAfter?: number; rebook: 'yes'|'maybe'|'no'; recommend: number;
  // E
  comments: Record<'positive'|'improve'|'other', { zh: string; de: string; deEditedByUser: boolean }>;
  // F
  confirmTruthful: true; consentStorage: true;
  signaturePng: string;            // data URL, <= ~150KB
};
```

單選／複選一律存**選項的穩定代碼**（如 `sitting`、`daily`），**不要存中文字串**；顯示與列印時再由題庫對照出中德文字。

---

## 10. 後台（`/admin`）

- Google 登入（Firebase Auth）。登入後檢查 email 是否為我的帳號（以環境變數 `VITE_ADMIN_EMAIL` 設定），否則顯示「無權限」並登出。
- **列表頁：** 表格欄位為提交時間、姓名、體驗日期、按摩類型、整體評分、關係。支援依日期／評分排序、姓名與 email 搜尋、顯示總筆數。手機上改為卡片列表。
- **詳細頁：** 以中德對照完整呈現所有已填寫題目（未填的選填題不顯示），評分用視覺化（星星或圓點），德文意見與中文原文並列，底部顯示簽名圖與提交時間。有「列印」「返回」「刪除」（刪除需二次確認）。
- **批次：** 列表可勾選多筆，「列印所選」「匯出 CSV」。（若時間不足，這項放最後做。）

---

## 11. 列印版型（`print.css`＋`PrintSheet`）

- A4 直式，邊界約 15–20mm；**每筆資料一頁**（多筆批次列印時用 `page-break-after`）；盡量控制單筆在一頁內，必要時才延伸到第二頁，且不要在題目中間斷頁。
- 版面由上而下：標題「按摩體驗回饋表 Massage-Feedback-Bogen」→ 提交編號與日期 → 基本資料表（兩欄格線）→ B 區（若有填）→ 評分表（題目中德、分數以 ●●●●○ 呈現）→ 按摩後 → 意見（德文在上、中文原文在下並以較小灰字標示）→ 聲明（已勾選的核取方塊）→ 簽名與簽署日期。
- 選擇題以 ☑／☐ 呈現，**只列出有被選中的選項**，避免版面過長。
- 純黑白也要清楚可讀（不依賴背景色）；隱藏所有導覽、按鈕；字體德文用 Inter、中文用 Noto Sans TC，印刷時嵌入或使用系統後備字體並確認不亂碼。
- 頁尾：提交編號 Nr.、列印日期、頁碼。
- 列印按鈕呼叫 `window.print()`，使用者可另存為 PDF。

---

## 12. 安全與隱私

**Firestore Rules（`firestore.rules`）原則：**
```
- submissions：
  - create：任何人可建立，但必須通過欄位白名單與型別／長度驗證
    （hasOnly 欄位、signaturePng 長度上限、name/email 長度、評分 1–5、
     confirmTruthful 與 consentStorage 必須為 true）
  - read / list / update / delete：僅 request.auth.token.email == 我的 email
    且 email_verified == true
- 其餘集合全部拒絕
```
- 前台**不得**能讀取任何資料。
- 開啟 App Check（Hosting 前台＋Functions＋Firestore）。
- 所有金鑰與管理員 email 走環境變數／Secret Manager，提供 `.env.example`，`.env*` 加入 `.gitignore`。
- 前台頁尾放簡短隱私聲明（中德）：資料用途、保存者（Shack）、保存期限、刪除請求方式（寄信給我）。
- 在 GCP 設定預算警示（例如月預算低額度），避免翻譯被濫用。

---

## 13. 開發順序（請依序，每階段結束讓我驗收）

1. **骨架**：建立 Vite+React+TS+Tailwind、Firebase 初始化（Hosting、Firestore `asia-east1`、Auth、Functions），建立模擬器設定，確認本地可跑。
2. **題庫與表單**：完成 `questions.ts`、schema、條件邏輯、全部表單元件與樣式（先不接後端），手機與桌機版面都要檢查。
3. **簽名與送出**：簽名 Modal、圖片壓縮、寫入 Firestore、感謝頁。
4. **翻譯**：Cloud Function、德文預覽與編輯、過期標記邏輯。
5. **後台**：登入守門、列表、詳細頁。
6. **列印**：`PrintSheet` 與 `print.css`，用實際資料測試列印與另存 PDF。
7. **安全與部署**：Rules、App Check、預算警示、`firebase deploy`、用真實手機完整走一次。
8. **加分（有時間才做）**：批次列印、CSV 匯出。

**今日最低驗收標準（MVP）：** 一位受試者能在手機完整填寫並簽名送出 → 我登入後台看到該筆 → 點開並成功列印／存成 PDF。

---

## 14. 工作約定

- 使用 TypeScript strict；不使用 `any`；元件小而專一。
- 每個階段完成後，說明如何本地測試（指令與網址），並列出尚未完成事項。
- 若遇到需要我提供的資訊（Firebase 專案 ID、我的 Google 帳號 email、LLM 選擇），**集中一次問清楚**，不要分散多次。
- 不確定的設計決定，先採本文件的預設，並在回報中標註，不要停下來等待。
- 不要自行新增本文件未列的功能，也不要更換技術選型。
- 所有面向使用者的文字一律中德並列，缺一不可；新增字串時同時補上兩種語言。
- 請勿把任何受試者個資、簽名圖或金鑰提交到版本控制。
