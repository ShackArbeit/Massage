import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // .env / .env.local 放在專案根目錄
  envDir: "..",
  server: { host: true, port: 5173 },
});
