// 已不再保存填寫草稿；這裡只清除舊版留在瀏覽器中的資料（含個資）
const DRAFT_KEY = "massage-feedback-draft-v1";

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // 私密模式或儲存空間被封鎖時略過
  }
}
