// 由題庫（questions.ts）產生 firestore.rules：欄位白名單、選項代碼、長度與範圍驗證。
// 管理員 email 取自 .env.local 的 VITE_ADMIN_EMAIL；產出檔不進版控。
// 用法：npm run rules（於專案根目錄）
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, loadEnv } from "vite";

const webDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = resolve(webDir, "..");

const env = loadEnv("development", rootDir, "VITE_");
const adminEmail = env.VITE_ADMIN_EMAIL;
if (!adminEmail || !/^[^@\s'"\\]+@[^@\s'"\\]+$/.test(adminEmail)) {
  console.error("VITE_ADMIN_EMAIL 未設定或格式錯誤（.env.local）");
  process.exit(1);
}

const server = await createServer({ root: webDir, configFile: false, server: { middlewareMode: true }, logLevel: "error" });
const { allQuestions, OTHER_MAX_LENGTH, otherKeyOf } = await server.ssrLoadModule("/src/survey/questions.ts");
const { SIGNATURE_RULES_MAX_LENGTH } = await server.ssrLoadModule("/src/survey/limits.ts");
await server.close();

const list = (items) => `[${items.map((s) => `'${s}'`).join(", ")}]`;
const optional = (key, cond) => `(!('${key}' in d) || ${cond})`;

const fields = ["schemaVersion", "createdAt"];
const required = ["schemaVersion", "createdAt"];
const checks = [];
const ratingKeys = [];
const requiredRatingKeys = [];
const commentKeys = [];
const requiredCommentKeys = [];
let commentMax = 1000;

for (const q of allQuestions) {
  const k = q.key;
  let cond = null;
  switch (q.type) {
    case "text":
      cond = `isStr(d.${k}, 1, ${q.maxLength})`;
      break;
    case "number":
      cond = `intIn(d.${k}, ${q.min}, ${q.max})`;
      break;
    case "email":
      cond = `isStr(d.${k}, 3, 254) && d.${k}.matches('[^@ ]+@[^@ ]+[.][^@ ]+')`;
      break;
    case "date":
      cond = `d.${k} is string && d.${k}.matches('[0-9]{4}-[0-9]{2}-[0-9]{2}')`;
      break;
    case "single":
      cond = `d.${k} in ${list(q.options.map((o) => o.code))}`;
      break;
    case "multi": {
      const codes = q.options.map((o) => o.code);
      cond = `(d.${k} is list && d.${k}.size() >= 1 && d.${k}.size() <= ${codes.length} && ${list(codes)}.hasAll(d.${k}))`;
      break;
    }
    case "slider":
    case "scale10":
      cond = `intIn(d.${k}, 0, 10)`;
      break;
    case "checkbox":
      cond = `d.${k} == true`;
      break;
    case "signature":
      fields.push("signaturePng");
      required.push("signaturePng");
      checks.push(
        `isStr(d.signaturePng, 100, ${SIGNATURE_RULES_MAX_LENGTH}) && d.signaturePng.matches('data:image/png;base64,[A-Za-z0-9+/=]+')`,
      );
      break;
    case "rating":
      ratingKeys.push(q.storeKey);
      if (q.required) requiredRatingKeys.push(q.storeKey);
      break;
    case "comment":
      commentKeys.push(q.storeKey);
      if (q.required) requiredCommentKeys.push(q.storeKey);
      commentMax = q.maxLength;
      break;
    case "autoDate":
      break;
  }
  if (cond) {
    fields.push(k);
    if (q.required) {
      required.push(k);
      checks.push(cond);
    } else {
      checks.push(optional(k, cond));
    }
  }
  if ((q.type === "single" || q.type === "multi") && q.options.some((o) => o.other)) {
    const ok = otherKeyOf(k);
    fields.push(ok);
    checks.push(optional(ok, `isStr(d.${ok}, 1, ${OTHER_MAX_LENGTH})`));
  }
}

if (ratingKeys.length) {
  fields.push("ratings");
  required.push("ratings");
  checks.push(
    `d.ratings is map && d.ratings.keys().hasOnly(${list(ratingKeys)}) && d.ratings.keys().hasAll(${list(requiredRatingKeys)})`,
    ...ratingKeys.map((r) => `(!('${r}' in d.ratings) || intIn(d.ratings.${r}, 1, 5))`),
  );
}
if (commentKeys.length) {
  fields.push("comments");
  required.push("comments");
  checks.push(
    `d.comments is map && d.comments.keys().hasOnly(${list(commentKeys)}) && d.comments.keys().hasAll(${list(requiredCommentKeys)})`,
    ...commentKeys.map((c) => `(!('${c}' in d.comments) || validComment(d.comments.${c}))`),
  );
}

const rules = `rules_version = '2';

// ⚠ 自動產生的檔案，請勿手動修改。來源：web/src/survey/questions.ts
// 重新產生：npm run rules
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == '${adminEmail}'
        && request.auth.token.email_verified == true;
    }

    function isStr(v, min, max) {
      return v is string && v.size() >= min && v.size() <= max;
    }

    function intIn(v, min, max) {
      return v is int && v >= min && v <= max;
    }

    function validComment(c) {
      return c is map
        && c.keys().hasOnly(['zh', 'de', 'deEditedByUser'])
        && c.keys().hasAll(['zh', 'de', 'deEditedByUser'])
        && isStr(c.zh, 1, ${commentMax})
        && isStr(c.de, 1, ${commentMax * 3})
        && c.deEditedByUser is bool;
    }

    function validSubmission(d) {
      return d.keys().hasOnly(${list(fields)})
        && d.keys().hasAll(${list(required)})
        && d.schemaVersion == 1
        && d.createdAt == request.time
        && ${checks.join("\n        && ")};
    }

    match /submissions/{id} {
      allow create: if validSubmission(request.resource.data);
      allow read, update, delete: if isAdmin();
    }

    // 其餘集合（含翻譯頻率限制紀錄）一律拒絕用戶端存取
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;

writeFileSync(resolve(rootDir, "firestore.rules"), rules);
console.log(`firestore.rules 已產生（${fields.length} 個欄位）`);
