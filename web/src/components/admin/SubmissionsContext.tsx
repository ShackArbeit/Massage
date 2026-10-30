import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { deleteSubmission, fetchSubmissions, type StoredSubmission } from "../../lib/submissions";

type LoadState = { status: "loading" } | { status: "error" } | { status: "ready"; items: StoredSubmission[] };

type Ctx = {
  state: LoadState;
  reload: () => void;
  remove: (id: string) => Promise<void>;
};

const SubmissionsCtx = createContext<Ctx | null>(null);

// 列表資料只載入一次，列表頁與詳細頁共用（約 200 筆內）
export function SubmissionsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const reload = useCallback(() => {
    setState({ status: "loading" });
    fetchSubmissions()
      .then((items) => setState({ status: "ready", items }))
      .catch(() => setState({ status: "error" }));
  }, []);

  useEffect(reload, [reload]);

  const remove = useCallback(async (id: string) => {
    await deleteSubmission(id);
    setState((s) => (s.status === "ready" ? { status: "ready", items: s.items.filter((i) => i.id !== id) } : s));
  }, []);

  const value = useMemo(() => ({ state, reload, remove }), [state, reload, remove]);
  return <SubmissionsCtx.Provider value={value}>{children}</SubmissionsCtx.Provider>;
}

export function useSubmissions(): Ctx {
  const ctx = useContext(SubmissionsCtx);
  if (!ctx) throw new Error("useSubmissions must be used inside SubmissionsProvider");
  return ctx;
}
