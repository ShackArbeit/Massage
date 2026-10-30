import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const env = import.meta.env;

export const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || "massage-37b8c",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

export const usingEmulators = env.VITE_USE_EMULATORS === "true";

// App Check：正式環境以 reCAPTCHA Enterprise（Google Cloud Fraud Defense）保護 Functions 與 Firestore（模擬器不需要）
if (!usingEmulators && env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "asia-east1");

// 開發工具 Console：顯示目前連線設定，方便排查
console.info("[firebase]", {
  mode: usingEmulators ? `emulator (${window.location.hostname})` : "cloud",
  projectId: app.options.projectId,
  appCheck: !usingEmulators && !!env.VITE_RECAPTCHA_SITE_KEY ? "reCAPTCHA Enterprise" : "off",
});

if (usingEmulators) {
  // 用目前頁面的主機名，手機在區網測試時也能連到電腦上的模擬器
  const host = window.location.hostname;
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectFunctionsEmulator(functions, host, 5001);
}
