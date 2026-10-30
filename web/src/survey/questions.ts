// ★ 題庫：單一真相來源。表單渲染、驗證、後台顯示、列印版型都由此驅動。
// 題號由顯示順序自動產生，一律以 key 識別。

export type Bi = { zh: string; de: string };

export type Option = {
  code: string; // 穩定代碼，存入資料庫
  label: Bi;
  exclusive?: boolean; // 複選題中與其他選項互斥（如「無 keine」）
  other?: boolean; // 選取時展開「其他」文字欄
};

type Base = { key: string; label: Bi; required?: boolean; hint?: Bi };

export type TextQuestion = Base & { type: "text"; maxLength: number };
export type NumberQuestion = Base & { type: "number"; min: number; max: number };
export type EmailQuestion = Base & { type: "email" };
export type DateQuestion = Base & { type: "date"; notAfterToday: boolean };
export type SingleQuestion = Base & { type: "single"; options: Option[] };
export type MultiQuestion = Base & { type: "multi"; options: Option[] };
export type RatingQuestion = Base & { type: "rating"; storeKey: RatingKey };
export type SliderQuestion = Base & { type: "slider"; minLabel: Bi; maxLabel: Bi };
export type Scale10Question = Base & { type: "scale10"; minLabel: Bi; maxLabel: Bi };
export type CommentQuestion = Base & { type: "comment"; storeKey: CommentKey; maxLength: number };
export type CheckboxQuestion = Base & { type: "checkbox" };
export type SignatureQuestion = Base & { type: "signature" };
export type AutoDateQuestion = Base & { type: "autoDate" };

export type Question =
  | TextQuestion
  | NumberQuestion
  | EmailQuestion
  | DateQuestion
  | SingleQuestion
  | MultiQuestion
  | RatingQuestion
  | SliderQuestion
  | Scale10Question
  | CommentQuestion
  | CheckboxQuestion
  | SignatureQuestion
  | AutoDateQuestion;

export type SectionId = "A" | "B" | "C" | "D" | "E" | "F";

export type Section = {
  id: SectionId;
  title: Bi;
  description?: Bi;
  optional?: boolean; // 整區選填，可收合／略過
  questions: Question[];
};

export type RatingKey =
  | "expertise"
  | "communication"
  | "pressure"
  | "boundaries"
  | "hygiene"
  | "punctuality"
  | "overall";
export type CommentKey = "positive" | "improve" | "other";

// 「其他」文字欄的最大長度
export const OTHER_MAX_LENGTH = 100;

export const RATING_LABELS: Record<1 | 2 | 3 | 4 | 5, Bi> = {
  1: { zh: "很不滿意", de: "sehr schlecht" },
  2: { zh: "不滿意", de: "schlecht" },
  3: { zh: "普通", de: "mittel" },
  4: { zh: "滿意", de: "gut" },
  5: { zh: "非常滿意", de: "sehr gut" },
};

const OTHER: Option = { code: "other", label: { zh: "其他", de: "Sonstiges" }, other: true };

const FREQ_OPTIONS: Option[] = [
  { code: "daily", label: { zh: "每天", de: "täglich" } },
  { code: "severalWeekly", label: { zh: "每週數次", de: "mehrmals pro Woche" } },
  { code: "occasional", label: { zh: "偶爾", de: "gelegentlich" } },
  { code: "rarely", label: { zh: "幾乎沒有", de: "selten" } },
  { code: "never", label: { zh: "從不", de: "nie" } },
];

export const sections: Section[] = [
  {
    id: "A",
    title: { zh: "基本資料", de: "Grunddaten" },
    description: { zh: "請填寫您的基本資料。", de: "Bitte geben Sie Ihre persönlichen Daten an." },
    questions: [
      { key: "name", type: "text", required: true, maxLength: 100, label: { zh: "姓名", de: "Name" } },
      {
        key: "gender",
        type: "single",
        required: true,
        label: { zh: "性別", de: "Geschlecht" },
        options: [
          { code: "male", label: { zh: "男", de: "männlich" } },
          { code: "female", label: { zh: "女", de: "weiblich" } },
          { code: "diverse", label: { zh: "其他", de: "divers" } },
          { code: "undisclosed", label: { zh: "不願透露", de: "keine Angabe" } },
        ],
      },
      { key: "age", type: "number", required: true, min: 10, max: 100, label: { zh: "年齡", de: "Alter" } },
      { key: "email", type: "email", required: true, label: { zh: "Email", de: "E-Mail" } },
      {
        key: "massageDate",
        type: "date",
        required: true,
        notAfterToday: true,
        label: { zh: "體驗按摩日期", de: "Datum der Massage" },
      },
      {
        key: "duration",
        type: "single",
        required: true,
        label: { zh: "按摩時長", de: "Dauer" },
        options: [
          { code: "min30", label: { zh: "30 分鐘", de: "30 Min." } },
          { code: "min60", label: { zh: "60 分鐘", de: "60 Min." } },
          { code: "min90", label: { zh: "90 分鐘", de: "90 Min." } },
          { code: "other", label: { zh: "其他", de: "Sonstiges" } },
        ],
      },
      {
        key: "massageType",
        type: "single",
        required: true,
        label: { zh: "按摩類型", de: "Art der Massage" },
        options: [
          { code: "neckShoulder", label: { zh: "肩頸", de: "Nacken & Schultern" } },
          { code: "fullBody", label: { zh: "全身", de: "Ganzkörper" } },
          { code: "sports", label: { zh: "運動按摩", de: "Sportmassage" } },
          OTHER,
        ],
      },
      {
        key: "relationship",
        type: "single",
        required: true,
        label: { zh: "與按摩者的關係", de: "Beziehung zum Masseur" },
        options: [
          { code: "friend", label: { zh: "朋友", de: "Freund/in" } },
          { code: "family", label: { zh: "家人", de: "Familie" } },
          { code: "colleague", label: { zh: "同事或同學", de: "Kolleg/in / Mitschüler/in" } },
          { code: "stranger", label: { zh: "陌生人（客人）", de: "Fremde Person (Kunde/Kundin)" } },
          OTHER,
        ],
      },
    ],
  },
  {
    id: "B",
    optional: true,
    title: { zh: "按摩前", de: "Vor der Massage" },
    description: {
      zh: "本區為自願填寫，含健康與生活習慣資料，可略過。",
      de: "Dieser Bereich ist freiwillig und enthält Gesundheits- und Lebensstilangaben. Sie können ihn überspringen.",
    },
    questions: [
      {
        key: "complaintAreas",
        type: "multi",
        label: { zh: "主要不適或緊繃部位", de: "Hauptbeschwerden" },
        options: [
          { code: "neck", label: { zh: "頸部", de: "Nacken" } },
          { code: "shoulders", label: { zh: "肩膀", de: "Schultern" } },
          { code: "upperBack", label: { zh: "上背", de: "oberer Rücken" } },
          { code: "lowerBack", label: { zh: "下背", de: "unterer Rücken" } },
          { code: "arms", label: { zh: "手臂", de: "Arme" } },
          { code: "hipLegs", label: { zh: "臀腿", de: "Hüfte & Beine" } },
          { code: "feet", label: { zh: "足部", de: "Füße" } },
          { code: "head", label: { zh: "頭部", de: "Kopf" } },
          { code: "none", label: { zh: "無", de: "keine" }, exclusive: true },
          OTHER,
        ],
      },
      {
        key: "painBefore",
        type: "slider",
        label: { zh: "按摩前不適程度", de: "Beschwerden vorher" },
        minLabel: { zh: "無", de: "keine" },
        maxLabel: { zh: "非常嚴重", de: "sehr stark" },
      },
      {
        key: "workType",
        type: "single",
        label: { zh: "工作型態（需要久坐或久站？）", de: "Arbeitsweise" },
        options: [
          { code: "sitting", label: { zh: "久坐（辦公室、電腦）", de: "überwiegend sitzend" } },
          { code: "standing", label: { zh: "久站（服務業、廚房、站櫃）", de: "überwiegend stehend" } },
          { code: "mixed", label: { zh: "坐站交替", de: "abwechselnd sitzend und stehend" } },
          { code: "physical", label: { zh: "勞力、搬重物", de: "körperlich schwere Arbeit" } },
          { code: "mobile", label: { zh: "經常移動或開車", de: "viel unterwegs / Autofahren" } },
          { code: "student", label: { zh: "學生", de: "Student/in" } },
          { code: "unemployed", label: { zh: "目前無工作", de: "derzeit nicht berufstätig" } },
          OTHER,
        ],
      },
      {
        key: "postureHours",
        type: "single",
        label: { zh: "每天久坐或久站的時間", de: "Wie lange täglich in dieser Haltung?" },
        options: [
          { code: "lt2", label: { zh: "少於 2 小時", de: "unter 2 Std." } },
          { code: "h2to4", label: { zh: "2–4 小時", de: "2–4 Std." } },
          { code: "h4to6", label: { zh: "4–6 小時", de: "4–6 Std." } },
          { code: "h6to8", label: { zh: "6–8 小時", de: "6–8 Std." } },
          { code: "gt8", label: { zh: "超過 8 小時", de: "über 8 Std." } },
        ],
      },
      {
        key: "exerciseFreq",
        type: "single",
        label: { zh: "是否有固定運動習慣", de: "Regelmäßige Bewegung bzw. Sport" },
        options: [
          { code: "none", label: { zh: "沒有", de: "nein, gar nicht" } },
          { code: "occasional", label: { zh: "偶爾（每月數次）", de: "gelegentlich" } },
          { code: "w1to2", label: { zh: "每週 1–2 次", de: "1–2× pro Woche" } },
          { code: "w3to4", label: { zh: "每週 3–4 次", de: "3–4× pro Woche" } },
          { code: "w5plus", label: { zh: "每週 5 次以上", de: "5× oder öfter pro Woche" } },
        ],
      },
      {
        key: "exerciseTypes",
        type: "multi",
        label: { zh: "習慣做哪些運動", de: "Welche Sportarten?" },
        options: [
          { code: "running", label: { zh: "跑步", de: "Laufen" } },
          { code: "swimming", label: { zh: "游泳", de: "Schwimmen" } },
          { code: "walking", label: { zh: "健走", de: "Spazieren" } },
          { code: "cycling", label: { zh: "騎自行車", de: "Radfahren" } },
          { code: "strength", label: { zh: "重量訓練", de: "Krafttraining" } },
          { code: "yogaPilates", label: { zh: "瑜伽、皮拉提斯", de: "Yoga / Pilates" } },
          { code: "ballSports", label: { zh: "球類", de: "Ballsport" } },
          { code: "hiking", label: { zh: "登山健行", de: "Wandern" } },
          { code: "martialDance", label: { zh: "武術、舞蹈", de: "Kampfsport / Tanz" } },
          OTHER,
        ],
      },
      {
        key: "stretchFreq",
        type: "single",
        label: { zh: "是否有固定拉筋習慣", de: "Dehnen bzw. Stretching" },
        options: FREQ_OPTIONS,
      },
      {
        key: "selfMassageFreq",
        type: "single",
        label: { zh: "是否有自我按摩習慣", de: "Selbstmassage" },
        options: FREQ_OPTIONS,
      },
      {
        key: "selfMassageTools",
        type: "multi",
        label: { zh: "使用哪些自我按摩方式", de: "Welche Hilfsmittel?" },
        options: [
          { code: "hands", label: { zh: "徒手", de: "mit den Händen" } },
          { code: "ball", label: { zh: "筋膜球", de: "Faszienball" } },
          { code: "roller", label: { zh: "滾筒", de: "Faszienrolle" } },
          { code: "gun", label: { zh: "按摩槍", de: "Massagepistole" } },
          { code: "chairMat", label: { zh: "按摩椅或按摩墊", de: "Massagesessel / -matte" } },
          OTHER,
        ],
      },
    ],
  },
  {
    id: "C",
    title: { zh: "體驗評分", de: "Bewertung" },
    description: {
      zh: "請依您的體驗為每一項評分（1 很不滿意 – 5 非常滿意）。",
      de: "Bitte bewerten Sie jeden Punkt (1 sehr schlecht – 5 sehr gut).",
    },
    questions: [
      { key: "ratingExpertise", type: "rating", required: true, storeKey: "expertise", label: { zh: "專業度與知識", de: "Fachkompetenz" } },
      {
        key: "ratingCommunication",
        type: "rating",
        required: true,
        storeKey: "communication",
        label: { zh: "溝通：是否詢問力道與舒適度", de: "Kommunikation (Nachfragen zu Druck und Komfort)" },
      },
      { key: "ratingPressure", type: "rating", required: true, storeKey: "pressure", label: { zh: "力道是否合適", de: "Passende Druckstärke" } },
      {
        key: "ratingBoundaries",
        type: "rating",
        required: true,
        storeKey: "boundaries",
        label: { zh: "尊重界線與隱私", de: "Respekt vor persönlichen Grenzen und Privatsphäre" },
      },
      { key: "ratingHygiene", type: "rating", required: true, storeKey: "hygiene", label: { zh: "衛生與環境整潔", de: "Hygiene & Sauberkeit" } },
      {
        key: "ratingPunctuality",
        type: "rating",
        required: true,
        storeKey: "punctuality",
        label: { zh: "守時與準備", de: "Pünktlichkeit & Vorbereitung" },
      },
      { key: "ratingOverall", type: "rating", required: true, storeKey: "overall", label: { zh: "整體滿意度", de: "Gesamtzufriedenheit" } },
    ],
  },
  {
    id: "D",
    title: { zh: "按摩後", de: "Nach der Massage" },
    questions: [
      {
        key: "painAfter",
        type: "slider",
        label: { zh: "按摩後不適程度", de: "Beschwerden nachher" },
        minLabel: { zh: "無", de: "keine" },
        maxLabel: { zh: "非常嚴重", de: "sehr stark" },
      },
      {
        key: "rebook",
        type: "single",
        required: true,
        label: { zh: "是否願意再次預約", de: "Würden Sie wieder buchen?" },
        options: [
          { code: "yes", label: { zh: "是", de: "ja" } },
          { code: "maybe", label: { zh: "可能", de: "vielleicht" } },
          { code: "no", label: { zh: "否", de: "nein" } },
        ],
      },
      {
        key: "recommend",
        type: "scale10",
        required: true,
        label: { zh: "是否會推薦給他人", de: "Weiterempfehlung" },
        minLabel: { zh: "完全不會", de: "auf keinen Fall" },
        maxLabel: { zh: "一定會", de: "auf jeden Fall" },
      },
    ],
  },
  {
    id: "E",
    title: { zh: "開放式意見", de: "Freie Kommentare" },
    description: {
      zh: "請用中文填寫，再按「翻成德文」產生德文版本；德文可自行修改。",
      de: "Bitte auf Chinesisch schreiben und dann übersetzen lassen. Die deutsche Fassung können Sie anpassen.",
    },
    questions: [
      {
        key: "commentPositive",
        type: "comment",
        required: true,
        storeKey: "positive",
        maxLength: 1000,
        label: { zh: "印象最深的優點", de: "Was hat Ihnen besonders gut gefallen?" },
      },
      {
        key: "commentImprove",
        type: "comment",
        storeKey: "improve",
        maxLength: 1000,
        label: { zh: "可以改進的地方", de: "Was kann verbessert werden?" },
      },
      {
        key: "commentOther",
        type: "comment",
        storeKey: "other",
        maxLength: 1000,
        label: { zh: "其他整體意見", de: "Weitere Kommentare" },
      },
    ],
  },
  {
    id: "F",
    title: { zh: "聲明與簽名", de: "Erklärung & Unterschrift" },
    questions: [
      {
        key: "confirmTruthful",
        type: "checkbox",
        required: true,
        label: {
          zh: "我確認以上內容為我真實的體驗。",
          de: "Ich bestätige, dass meine Angaben wahrheitsgemäß sind.",
        },
      },
      {
        key: "consentStorage",
        type: "checkbox",
        required: true,
        label: {
          zh: "我同意此資料（含姓名、Email 與自願填寫的健康資料）被保存，並用於 Shack 的職業培訓（Ausbildung）申請。B 區為自願填寫。",
          de: "Ich willige ein, dass meine Daten (einschließlich Name, E-Mail und freiwilliger Gesundheitsangaben) gespeichert und für die Bewerbung um eine Berufsausbildung von Shack verwendet werden. Der Bereich B ist freiwillig.",
        },
      },
      { key: "signature", type: "signature", required: true, label: { zh: "簽名", de: "Unterschrift" } },
      { key: "signedAt", type: "autoDate", label: { zh: "簽署日期（系統自動帶入）", de: "Datum (automatisch)" } },
    ],
  },
];

// ---- 表單值 ----

export type CommentValue = {
  zh: string;
  de: string;
  deEditedByUser: boolean;
  translatedFrom: string | null; // 產生德文時的中文原文，用於判斷「已過期」（不存入資料庫）
};

export type FieldValue = string | string[] | number | null | boolean | CommentValue;
export type FormValues = Record<string, FieldValue>;

export const allQuestions: Question[] = sections.flatMap((s) => s.questions);

export function findQuestion(key: string): Question | undefined {
  return allQuestions.find((q) => q.key === key);
}

export function hasOtherOption(q: Question): q is SingleQuestion | MultiQuestion {
  return (q.type === "single" || q.type === "multi") && q.options.some((o) => o.other);
}

export function otherKeyOf(key: string): string {
  return `${key}Other`;
}

export function emptyComment(): CommentValue {
  return { zh: "", de: "", deEditedByUser: false, translatedFrom: null };
}

export function defaultValueFor(q: Question): FieldValue | undefined {
  switch (q.type) {
    case "text":
    case "number":
    case "email":
    case "date":
    case "single":
    case "signature":
      return "";
    case "multi":
      return [];
    case "rating":
    case "slider":
    case "scale10":
      return null;
    case "comment":
      return emptyComment();
    case "checkbox":
      return false;
    case "autoDate":
      return undefined; // 不是表單欄位
  }
}

export function buildDefaultValues(): FormValues {
  const values: FormValues = {};
  for (const q of allQuestions) {
    const v = defaultValueFor(q);
    if (v !== undefined) values[q.key] = v;
    if (hasOtherOption(q)) values[otherKeyOf(q.key)] = "";
  }
  return values;
}

export function optionLabel(q: Question, code: string): Bi | undefined {
  if (q.type !== "single" && q.type !== "multi") return undefined;
  return q.options.find((o) => o.code === code)?.label;
}
