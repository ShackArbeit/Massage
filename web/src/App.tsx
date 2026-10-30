import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Spinner } from "./components/icons";
import SurveyPage from "./pages/SurveyPage";
import ThanksPage from "./pages/ThanksPage";


const AdminLayout = lazy(() => import("./pages/AdminLayout"));
const AdminList = lazy(() => import("./pages/AdminList"));
const AdminDetail = lazy(() => import("./pages/AdminDetail"));

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-stone-400">
      <Spinner className="size-6" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<SurveyPage />} />
        <Route path="/thanks" element={<ThanksPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminList />} />
          <Route path=":id" element={<AdminDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
