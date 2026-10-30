# React 前端面試題庫與參考答案

> 職缺：D-Link 友訊科技｜平台前端工程師（React）
> 面試日期：2026/11/4
> 使用方式：每題先看 **🎤 口說版**（30 秒內講完的重點），再看詳細說明與程式碼。**💼 連結作品**是把題目拉回你自己作品的講法，這是加分關鍵。

---

## 目錄

- [一、基礎（1–6）](#一基礎幾乎必考)
- [二、效能（7–9）](#二效能)
- [三、狀態與資料（10–12）](#三狀態與資料)
- [四、API 串接（13–16）](#四api-串接jd-重點)
- [五、React 19 與近期趨勢（17–20）](#五react-19-與近期趨勢)
- [六、JavaScript 與 CSS 基本功（21–23）](#六javascript-與-css-基本功)
- [七、工程實務（24–26）](#七工程實務)
- [附錄：現場手寫題](#附錄現場手寫題)

---

## 一、基礎（幾乎必考）

### 1. Virtual DOM 與 reconciliation 是什麼？`key` 為什麼不能用 index？

**🎤 口說版**
Virtual DOM 是 React 在記憶體中用 JS 物件描述的 UI 樹。state 改變時，React 產生新的樹，和舊的樹比對（這個過程叫 reconciliation，也就是 diffing），算出最少的變更，再一次套用到真實 DOM。`key` 讓 React 知道列表中「哪個元素是哪個」，用 index 當 key，在新增、刪除、排序時，元素身分會錯置，導致狀態錯亂和不必要的重繪。

**詳細說明**
- 直接操作真實 DOM 成本高（會觸發 layout、paint），Virtual DOM 讓 React 把多次變更合併計算後再更新。
- Diff 演算法的兩個假設，讓比對從 O(n³) 降到 O(n)：
  1. **元素類型不同**（例如 `<div>` 變 `<span>`）→ 直接整棵子樹砍掉重建。
  2. **列表用 `key`** 判斷元素是否為同一個。
- React 16 之後的實作叫 **Fiber**，可以把渲染工作切成小塊、可中斷，並依優先順序排程（Concurrent Rendering 的基礎）。

**index 當 key 的問題**
```jsx
// ❌ 刪除第一項後，原本 index=1 的項目變成 index=0
//    React 會以為「第 0 個還在，只是內容變了」，
//    結果 input 內的輸入值、勾選狀態會留在錯誤的那一列
{items.map((item, i) => <Row key={i} item={item} />)}

// ✅ 用資料本身穩定、唯一的 id
{items.map(item => <Row key={item.id} item={item} />)}
```
- 只有在列表**不會新增、刪除、排序**，且項目沒有內部狀態時，用 index 才沒有問題。
- 也不要用 `Math.random()` 當 key，每次 render 都不同，會導致每次都重建元件。

**💼 連結作品**
DrugTurborepo 的證物列表用 TanStack Table，每一列都以資料庫的證物 id 作為 row id，排序和篩選時列的狀態不會錯置。

---

### 2. `useEffect` 的依賴陣列、cleanup 時機、為什麼開發模式下 StrictMode 會執行兩次？

**🎤 口說版**
`useEffect` 用來和外部系統同步，例如 API、訂閱、計時器。依賴陣列決定何時重新執行：不給就每次 render 都跑，空陣列只在掛載時跑，有值則在值改變時跑。cleanup 會在下一次 effect 執行前和元件卸載時執行。StrictMode 在開發模式會刻意「掛載 → 卸載 → 再掛載」一次，用來抓出沒寫 cleanup 的 bug，正式環境不會發生。

**依賴陣列三種寫法**
```jsx
useEffect(() => { /* 每次 render 後都執行 */ });
useEffect(() => { /* 只在掛載時執行一次 */ }, []);
useEffect(() => { /* userId 改變時才執行 */ }, [userId]);
```

**Cleanup 時機**
```jsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', onResize);

  return () => {               // cleanup
    clearInterval(id);
    window.removeEventListener('resize', onResize);
  };
}, []);
```
執行順序：render → 畫面更新 → effect 執行 →（依賴改變）→ **先跑上一次的 cleanup** → 再跑新的 effect →（卸載）→ cleanup。

**StrictMode 為什麼跑兩次**
- 只在開發模式，React 18 起會模擬「掛載、卸載、重新掛載」。
- 目的：確保 effect 是**可重複執行且能正確清除**的。若跑兩次就出錯（例如重複訂閱、重複送出請求），代表 cleanup 沒寫好。
- 未來 React 可能會保留元件狀態並重新掛載（例如切換分頁再回來），所以 effect 必須能承受這種情況。
- 正確作法是**寫好 cleanup**，而不是用 `useRef` 旗標硬擋第二次。

**常見陷阱**
- 依賴陣列漏寫 → 拿到舊值（stale closure）。請開 `eslint-plugin-react-hooks` 的 `exhaustive-deps` 規則。
- 依賴裡放每次 render 都新建的物件或函式 → effect 無限執行。
- **不需要 effect 的情況**：能從 props/state 直接算出來的值，直接在 render 中計算即可，不要用 effect 去 `setState`。

---

### 3. `useState` 是同步還是非同步？什麼是 batching？為什麼要用 `setCount(c => c + 1)`？

**🎤 口說版**
`setState` 不會立刻改變目前這次 render 中的值，它是「排程一次更新」，下一次 render 才拿到新值，所以感覺像非同步。React 18 起有自動批次處理（automatic batching），同一個事件或同一輪非同步回呼中的多次 setState 會合併成一次 render。當新值依賴舊值時，要用函式型更新，才能拿到最新的狀態。

```jsx
const [count, setCount] = useState(0);

function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
  console.log(count); // 仍然是 0（這次 render 的快照）
  // 結果：1。三次都是 0 + 1
}

function handleClickFixed() {
  setCount(c => c + 1);
  setCount(c => c + 1);
  setCount(c => c + 1);
  // 結果：3。每次都拿上一個更新後的值
}
```

**Batching**
- React 17 以前只在 React 事件處理器內批次；`setTimeout`、Promise 內的更新會各自 render。
- **React 18 起全部自動批次**：事件、`setTimeout`、Promise、原生事件都一樣。
- 少數需要立即更新 DOM 的情況，可用 `flushSync`（很少用）。

**為什麼這樣設計**
每次 render 的 state 是一份**快照**，讓同一次 render 內的值保持一致，避免畫面出現「一半新、一半舊」的狀態。

---

### 4. 受控元件和非受控元件的差別？

**🎤 口說版**
受控元件的值由 React state 控制，每次輸入都更新 state，適合即時驗證、連動欄位。非受控元件的值存在 DOM 本身，需要時再用 ref 讀取，render 次數較少。react-hook-form 預設就是非受控的設計，用 ref 註冊欄位，所以大型表單效能比較好。

```jsx
// 受控
const [name, setName] = useState('');
<input value={name} onChange={e => setName(e.target.value)} />

// 非受控
const inputRef = useRef(null);
<input defaultValue="" ref={inputRef} />
// 送出時：inputRef.current.value
```

| | 受控 | 非受控 |
|---|---|---|
| 資料來源 | React state | DOM |
| 即時驗證、格式化 | 容易 | 較麻煩 |
| re-render | 每次輸入都 render | 很少 |
| 適合 | 小表單、欄位連動 | 大表單、檔案上傳（`<input type="file">` 只能是非受控） |

**💼 連結作品**
DrugTurborepo 的案件和證物表單用 **react-hook-form＋zod**：react-hook-form 以非受控方式減少 re-render，zod 定義 schema 做驗證，型別也可以從 schema 推導，前後端驗證規則一致。需要時再用 `Controller` 包住 Radix 的 Select、Switch 這類受控元件。

---

### 5. props 和 state 的差別、單向資料流、lifting state up

**🎤 口說版**
props 是父元件傳給子元件的資料，子元件唯讀；state 是元件自己管理、會變動的資料。React 是單向資料流：資料由上往下傳，子元件要改資料時，呼叫父元件傳下來的 callback。當兩個兄弟元件需要共用狀態時，就把 state 提升到最近的共同父元件，這就是 lifting state up。

```jsx
function Parent() {
  const [keyword, setKeyword] = useState('');   // 提升到共同父層
  return (
    <>
      <SearchBar value={keyword} onChange={setKeyword} />
      <ResultList keyword={keyword} />
    </>
  );
}
```

**單向資料流的好處**：資料變化的來源可追蹤，除錯容易。
**狀態放哪裡的原則**：放在「需要它的元件中最低的共同祖先」。提升太高會讓不相關的元件跟著 re-render；跨很多層時才考慮 Context 或狀態管理工具（見第 10 題）。

---

### 6. 什麼情況會觸發 re-render？

**🎤 口說版**
主要有三種：元件自己的 state 改變、父元件 re-render、它使用的 Context 值改變。要注意，props 沒變但父元件 render，子元件預設也會跟著 render，除非用 `React.memo` 包起來。

1. **自身 state 改變**（`setState` 且新值與舊值不同，React 用 `Object.is` 比較）。
2. **父元件 re-render** → 子元件預設全部重新 render。
3. **訂閱的 Context value 改變** → 所有 `useContext` 該 Context 的元件都會 render。
4. 自訂 Hook 內的 state 改變（本質上同第 1 點）。

**常見誤解**
- 「props 改變才會 render」是錯的，父層 render 時子層就會 render。
- `setState` 給相同的值（同一個參考）通常會跳過。
- 修改物件內部卻沒建立新物件（`obj.a = 1; setObj(obj)`），**不會**觸發 render，必須 `setObj({ ...obj, a: 1 })`。
- re-render 不等於 DOM 更新，React 只會把 diff 出來的差異套用到 DOM。

**如何觀察**：React DevTools Profiler，或開啟「Highlight updates when components render」。

---

## 二、效能

### 7. `useMemo`、`useCallback`、`React.memo` 什麼時候該用？什麼時候反而多餘？

**🎤 口說版**
`React.memo` 讓元件在 props 沒變時跳過 render；`useCallback` 保持函式參考不變；`useMemo` 快取計算結果。這三個通常要搭配使用：子元件用 memo，傳給它的函式和物件就要用 useCallback、useMemo 保持穩定，否則 memo 會失效。但它們本身有比較成本，沒有量測到效能問題前不需要到處加。另外，React Compiler 已經能自動做這些優化（見第 18 題）。

```jsx
const Row = React.memo(function Row({ item, onSelect }) { /* ... */ });

function List({ items, filter }) {
  // 計算量大才值得 useMemo
  const visible = useMemo(
    () => items.filter(i => i.status === filter),
    [items, filter]
  );

  // 傳給 memo 子元件的函式要穩定，否則每次都是新函式，memo 失效
  const handleSelect = useCallback(id => setSelected(id), []);

  return visible.map(i => <Row key={i.id} item={i} onSelect={handleSelect} />);
}
```

**該用**
- 計算成本高（大量資料排序、篩選、轉換）。
- 傳給 `React.memo` 子元件的函式或物件。
- 作為其他 Hook（如 `useEffect`）的依賴，需要穩定參考時。

**多餘**
- 簡單計算（例如 `a + b`）。
- 子元件沒有用 `React.memo`，這時 `useCallback` 沒有任何效果。
- 元件本來就很便宜或很少 render。

**比 memo 更好的作法**：先調整元件結構，例如把會變的 state **往下移**到真正需要的元件，或把子元件以 `children` 傳入，讓它不受父層 state 影響。

---

### 8. 長列表怎麼優化？

**🎤 口說版**
上千筆資料直接 render 會產生大量 DOM 節點，捲動會卡。主要解法是虛擬化：只 render 可視範圍內的列，例如用 react-window 或 TanStack Virtual。另外搭配後端分頁或無限捲動、穩定的 key、列元件 memo，以及搜尋輸入的 debounce。

```jsx
import { FixedSizeList as List } from 'react-window';

<List height={600} itemCount={rows.length} itemSize={48} width="100%">
  {({ index, style }) => <div style={style}>{rows[index].name}</div>}
</List>
```

**優化清單**
1. **虛擬化**：react-window、TanStack Virtual（10,000 筆也只渲染約 20 列）。
2. **分頁**：後端分頁（`?page=2&limit=50`）或游標分頁，搭配無限捲動。
3. 列元件用 `React.memo`，key 使用穩定 id。
4. 搜尋與篩選用 **debounce**，或 React 18 的 `useDeferredValue`、`useTransition` 讓輸入保持流暢。
5. 圖片使用 `loading="lazy"`。

**💼 連結作品**
DrugTurborepo 用 TanStack Table 管理排序、篩選、分頁。資料量變大時，下一步會改成後端分頁，並搭配 TanStack Virtual 做虛擬化。

---

### 9. code splitting：`React.lazy` 和 `Suspense`

**🎤 口說版**
預設打包會把所有程式碼放進一個大 bundle，首次載入慢。code splitting 把程式拆成多個 chunk，需要時才載入。React 用 `React.lazy` 搭配動態 `import()` 延遲載入元件，用 `Suspense` 在載入期間顯示 fallback。最常見的切法是依路由拆分。

```jsx
import { lazy, Suspense } from 'react';

const AdminPage = lazy(() => import('./pages/AdminPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));

<Suspense fallback={<Spinner />}>
  <Routes>
    <Route path="/admin" element={<AdminPage />} />
    <Route path="/report" element={<ReportPage />} />
  </Routes>
</Suspense>
```

- **適合拆分的部分**：路由頁面、很少用到的大型元件（圖表、編輯器、地圖、PDF 預覽）。
- 載入失敗的處理：外層加 **Error Boundary**。
- Next.js App Router 預設就依路由自動拆分；個別元件可用 `next/dynamic`。
- 可用 `rollup-plugin-visualizer` 或 `@next/bundle-analyzer` 分析 bundle 大小。

---

## 三、狀態與資料

### 10. Context、Redux Toolkit、Zustand 怎麼選？Context 有什麼效能問題？

**🎤 口說版**
Context 本質是「依賴注入」，適合變動不頻繁的全域資料，例如主題、語系、登入者資訊。它的效能問題是 value 一變，所有使用它的元件都會 re-render，即使只用到其中一個欄位。狀態複雜、更新頻繁時，可以用 Zustand（輕量、可以只訂閱需要的片段）或 Redux Toolkit（規範嚴謹、DevTools 強，適合大型團隊）。至於伺服器資料，應該交給 React Query 或 Apollo 管理。

| | Context | Zustand | Redux Toolkit |
|---|---|---|---|
| 學習成本 | 低（內建） | 低 | 中 |
| 樣板程式碼 | 少 | 很少 | 中（RTK 已大幅減少） |
| 選擇性訂閱 | ❌ | ✅ selector | ✅ `useSelector` |
| DevTools、時光回溯 | ❌ | 可接 | ✅ 強 |
| 適合 | 主題、語系、登入者 | 中小型應用的全域狀態 | 大型應用、多人協作、複雜流程 |

**Context 效能問題與解法**
```jsx
// ❌ 每次 render 都是新物件 → 所有 consumer 都 render
<AuthContext.Provider value={{ user, login, logout }}>

// ✅ 1. useMemo 穩定 value
const value = useMemo(() => ({ user, login, logout }), [user]);

// ✅ 2. 拆分 Context：常變動的和不常變動的分開
<UserContext.Provider value={user}>
  <AuthActionsContext.Provider value={actions}>
```

**觀念重點：區分 client state 和 server state**
- **Server state**（從 API 來的資料）→ React Query、Apollo、SWR。
- **Client state**（UI 狀態、表單、主題）→ useState、Context、Zustand。
很多專案用 Redux 存 API 資料，其實是用錯工具。

**💼 連結作品**
HumanDesign 我同時用了三種：**Context** 管理登入與預約流程狀態、**Redux Toolkit** 管理全域狀態、**React Query** 處理 API 資料。現在回頭看，我會把 API 資料全部交給 React Query，Redux 的部分可以大幅縮減。（能說出「回頭看會怎麼改」是加分點。）

---

### 11. 為什麼用 React Query 或 Apollo，而不是在 `useEffect` 裡 fetch？

**🎤 口說版**
在 `useEffect` 裡自己 fetch，要手動處理 loading、error、競態、取消請求、快取、重試、重新驗證，每個元件都重寫一次，又容易出錯。React Query 和 Apollo 把這些都處理好了：自動快取與去重複請求、背景重新抓取、失敗重試、樂觀更新，也解決了 StrictMode 下請求重複發送的問題。

```jsx
// ❌ 手寫版：還沒處理快取、重試、競態
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
useEffect(() => {
  let ignore = false;
  fetch(`/api/cases/${id}`)
    .then(r => r.json())
    .then(d => { if (!ignore) setData(d); })
    .catch(e => { if (!ignore) setError(e); })
    .finally(() => { if (!ignore) setLoading(false); });
  return () => { ignore = true; };
}, [id]);

// ✅ React Query
const { data, isPending, error } = useQuery({
  queryKey: ['case', id],
  queryFn: () => fetch(`/api/cases/${id}`).then(r => r.json()),
  staleTime: 60_000,
});
```

**React Query／Apollo 提供的功能**
| 功能 | 說明 |
|---|---|
| 快取 | 相同 key 的資料共用，切換頁面回來不必重新 loading |
| 去重複 | 多個元件同時要同一筆資料，只發一次請求 |
| 背景更新 | stale-while-revalidate：先顯示快取，再背景更新 |
| 重試 | 失敗自動重試（可設定次數與間隔） |
| 競態 | 自動以最新的 query key 為準 |
| Mutation | `invalidateQueries` 讓相關資料自動重新抓取、樂觀更新 |

**💼 連結作品**
- HumanDesign 用 **TanStack React Query** 取得預約紀錄和使用者回饋（`CheckBookingQuery`、`UserFeedBackQuery`）。
- DrugTurborepo 用 **Apollo Client** 串接 GraphQL，`InMemoryCache` 以 id 正規化快取；新增證物後用 `refetchQueries` 更新列表，並在 link 層統一處理錯誤（`onError`）與附加 token（`setContext`）。

---

### 12. 自訂 Hook 的設計原則

**🎤 口說版**
自訂 Hook 是把「有狀態的邏輯」抽出來重用，而不是共用狀態本身，每個呼叫它的元件都有獨立的 state。設計原則是：用 `use` 開頭、單一職責、介面清楚（輸入參數、回傳值明確）、內部處理 cleanup，並且遵守 Hook 規則：只在最上層呼叫，不能放在條件式或迴圈中。

**設計原則**
1. 名稱以 `use` 開頭（lint 規則才能檢查）。
2. 單一職責，一個 Hook 解決一件事。
3. 回傳值：兩個值以內用陣列（像 `useState`），多個值用物件。
4. 自己處理副作用的 cleanup。
5. 好測試：可用 React Testing Library 的 `renderHook` 單獨測試。

**範例：`useDebounce`**
```tsx
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);   // value 變化時取消上一個計時器
  }, [value, delay]);
  return debounced;
}

// 使用
const [keyword, setKeyword] = useState('');
const debouncedKeyword = useDebounce(keyword, 400);
const { data } = useQuery({ queryKey: ['search', debouncedKeyword], ... });
```

**💼 連結作品（可以這樣講）**
DrugTurborepo 裡我把相機拍照封裝成 `LiveCameraCapture`，處理 `getUserMedia` 取得串流、拍照轉成圖片，以及卸載時**停止攝影機的所有 track**。如果要再重構，我會把它拆成 `useCamera` Hook（管理串流與 cleanup）加上純 UI 元件，讓邏輯可以在其他頁面重用。

---

## 四、API 串接（JD 重點）

### 13. RESTful 的設計原則、HTTP method 語意、常見狀態碼

**🎤 口說版**
RESTful 是以「資源」為中心設計 API：URL 用名詞表示資源，用 HTTP method 表示動作，並且是無狀態的，每個請求都帶著完整資訊。401 代表「你是誰我不知道」，也就是未驗證或 token 無效；403 代表「我知道你是誰，但你沒有權限」。

**設計原則**
- URL 用名詞、複數：`/cases`、`/cases/12/evidences`，不要用 `/getCase`。
- 用 HTTP method 表示動作。
- 無狀態（Stateless）：伺服器不保存 session，驗證資訊（如 JWT）放在每個請求中。
- 篩選、排序、分頁用 query string：`/cases?status=open&sort=-createdAt&page=2`。
- 版本管理：`/api/v1/...`。
- 回傳一致的 JSON 結構與錯誤格式。

**HTTP method**
| Method | 用途 | 冪等（重複執行結果相同） |
|---|---|---|
| GET | 讀取 | ✅ |
| POST | 新增 | ❌ |
| PUT | 整筆取代 | ✅ |
| PATCH | 部分更新 | 通常不保證 |
| DELETE | 刪除 | ✅ |

**常見狀態碼**
| 碼 | 意義 | 前端處理 |
|---|---|---|
| 200 OK | 成功 | 顯示資料 |
| 201 Created | 新增成功 | 導回列表或詳情 |
| 204 No Content | 成功但無內容（常見於 DELETE） | 更新列表 |
| 400 Bad Request | 參數錯誤 | 顯示欄位錯誤 |
| **401 Unauthorized** | **未登入或 token 過期** | 嘗試 refresh token，失敗則導向登入頁 |
| **403 Forbidden** | **已登入但無權限** | 顯示「無權限」，**不要**導向登入頁 |
| 404 Not Found | 資源不存在 | 顯示 404 頁面 |
| 409 Conflict | 衝突（如重複資料） | 提示使用者 |
| 422 | 驗證失敗 | 顯示欄位錯誤 |
| 429 | 請求太頻繁 | 稍後重試 |
| 500 / 502 / 503 | 伺服器錯誤 | 顯示錯誤訊息，可重試 |

**REST 和 GraphQL 的比較（面試很可能會問，因為你的主力作品是 GraphQL）**
| | REST | GraphQL |
|---|---|---|
| 端點 | 多個（每個資源一個） | 單一 `/graphql` |
| 取資料 | 伺服器決定回傳欄位，容易 over-fetching 或 under-fetching | 客戶端指定需要的欄位 |
| HTTP 快取 | 容易（GET＋CDN） | 較難（多為 POST），需要靠客戶端快取 |
| 錯誤 | 用 HTTP 狀態碼 | 通常回 200，錯誤放在 `errors` 欄位 |
| 適合 | 簡單 CRUD、公開 API | 資料關聯多、前端需求變化快 |

**💼 連結作品**
「DrugTurborepo 的案件和證物有巢狀關聯，所以選 GraphQL。HumanDesign 的後端則是 Express REST API，前端用 fetch 串接預約、刪除、寄信等端點，例如 `DELETE /noAuthDelete/:id`。如果現在重新設計，我會改成 `DELETE /bookings/:id`，更符合 RESTful 命名。」

---

### 14. CORS 是什麼？怎麼處理？

**🎤 口說版**
CORS 是瀏覽器的安全機制。基於同源政策，網頁預設不能讀取不同來源（協定、網域、port 任一不同）的 API 回應。後端必須在回應標頭加上 `Access-Control-Allow-Origin` 等設定，明確允許前端的來源。這是**後端要設定**的，前端無法自行繞過。像 PUT、DELETE 或帶自訂標頭的請求，瀏覽器會先發一個 OPTIONS 預檢請求（preflight）。

**重點**
- 同源 = 協定＋網域＋port 都相同。`http://localhost:3000` 和 `http://localhost:3001` 不同源。
- CORS 是**瀏覽器**的限制，Postman 或伺服器之間的呼叫不受影響。
- 簡單請求（GET、POST 加上特定 Content-Type）直接發送；其他請求先發 **preflight（OPTIONS）**。

**解法**
```ts
// 1. 後端設定（NestJS）
app.enableCors({
  origin: ['https://app.example.com', 'http://localhost:3000'],
  credentials: true,     // 要帶 cookie 時需要
});
// 注意：credentials: true 時 origin 不能是 '*'
```
```ts
// 2. 開發環境用 proxy，讓前端看起來是同源（Vite）
export default defineConfig({
  server: { proxy: { '/api': 'http://localhost:3001' } },
});
```
3. 正式環境用反向代理（Nginx），讓前後端掛在同一個網域下，例如 `/api` 轉給後端。

**💼 連結作品**
DrugTurborepo 前端在 3000 port、NestJS 後端在 3001 port，屬於跨來源，所以後端需要開 CORS。正式環境的改進方向是用 Nginx 把前後端放在同一網域，順便加上 HTTPS。

---

### 15. JWT 該存 localStorage 還是 cookie？各有什麼風險？

**🎤 口說版**
存 localStorage 實作簡單，但任何 JS 都能讀取，一旦網站有 XSS 漏洞，token 就會被偷走。存在 **httpOnly cookie** 中，JS 讀不到，可以防止 token 被 XSS 竊取；缺點是瀏覽器會自動帶上 cookie，所以要防範 CSRF，搭配 `SameSite`、`Secure` 和 CSRF token。目前比較推薦的作法是：access token 短效期、放在記憶體，refresh token 放 httpOnly cookie。

| | localStorage | httpOnly Cookie |
|---|---|---|
| JS 可讀 | ✅（風險） | ❌ |
| XSS 風險 | **高**：token 可被偷走 | 低：無法讀取（但 XSS 仍可代替使用者發請求） |
| CSRF 風險 | 無（不會自動附帶） | **有**：需要 `SameSite`＋CSRF token |
| 實作 | 簡單，手動加 `Authorization` header | 需後端設定，跨網域較複雜 |

**建議作法**
```
Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh
```
- access token：短效期（例如 15 分鐘），放在記憶體中。
- refresh token：httpOnly＋Secure＋SameSite cookie。
- 遇到 401 時，自動呼叫 refresh endpoint 換新 token，失敗再導向登入頁。
- XSS 的根本防護：不用 `dangerouslySetInnerHTML` 處理使用者輸入、設定 CSP。

**💼 連結作品（主動自我檢討，非常加分）**
> 「我在 DrugTurborepo 目前的作法是登入後把 token 存到 localStorage，同時用 JS 寫入一般 cookie，讓 Next.js middleware 能判斷是否登入。這有 XSS 的風險，因為 JS 讀得到 token。改進方式是讓 NestJS 在登入時用 `Set-Cookie` 設定 **HttpOnly、Secure、SameSite** 的 cookie，前端完全不碰 token，middleware 仍可讀取 cookie 做路由保護；GraphQL 請求則用 `credentials: 'include'` 帶上 cookie。」

---

### 16. 請求失敗、逾時、競態怎麼處理？

**🎤 口說版**
失敗要區分網路錯誤、4xx 和 5xx：fetch 只有在網路錯誤時才會 reject，所以要自己檢查 `res.ok`。逾時可以用 `AbortController` 搭配計時器取消請求。競態是指快速切換條件時，舊請求比新請求晚回來，把畫面蓋成舊資料，解法是在 effect cleanup 中 abort 舊請求。實務上 React Query 和 Apollo 都已經處理好這些問題。

**1. 錯誤處理：fetch 的陷阱**
```ts
// fetch 遇到 404、500 不會 reject！
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText);
  }
  return res.json();
}
```

**2. 逾時**
```ts
// 新版瀏覽器可直接用 AbortSignal.timeout
const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

// 或手動
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 8000);
try {
  const res = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timer);
}
```

**3. 競態**
```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/search?q=${keyword}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setResults)
    .catch(err => {
      if (err.name !== 'AbortError') setError(err);  // 被取消的不算錯誤
    });
  return () => controller.abort();   // keyword 改變時取消舊請求
}, [keyword]);
```

**4. 重試**：只對可重試的錯誤（網路錯誤、5xx、429）重試，搭配 exponential backoff（1s、2s、4s）；4xx 不要重試。

**5. 使用者體驗**：顯示 loading、錯誤訊息和「重試」按鈕；送出按鈕在請求中要 disabled，避免重複送出。

---

## 五、React 19 與近期趨勢

### 17. React 19 新增了哪些功能？

**🎤 口說版**
React 19 主要圍繞「非同步資料變更」做了簡化：**Actions** 讓 transition 可以接受 async 函式，自動處理 pending 狀態；`useActionState` 管理表單送出的結果與 pending；`useOptimistic` 做樂觀更新；`use()` 可以在 render 中讀取 Promise 或 Context。另外，`ref` 可以直接當作 prop 傳遞，不再需要 `forwardRef`；也支援在元件中直接寫 `<title>`、`<meta>`。

| 功能 | 用途 |
|---|---|
| **Actions** | `startTransition` 可接受 async 函式；`<form action={fn}>` 直接接函式 |
| **`useActionState`** | 回傳 `[state, formAction, isPending]`，管理表單送出的結果 |
| **`useFormStatus`** | 子元件讀取所在 form 的 pending 狀態（例如送出按鈕） |
| **`useOptimistic`** | 請求完成前先樂觀更新 UI，失敗自動還原 |
| **`use()`** | 在 render 中讀取 Promise（搭配 Suspense）或 Context，**可以放在條件式中** |
| **`ref` 當 prop** | 函式元件直接接收 `ref`，`forwardRef` 逐步淘汰 |
| Document metadata | 元件中直接寫 `<title>`、`<meta>`，React 會提升到 `<head>` |
| 其他 | `<Context>` 可直接作為 Provider、ref callback 可回傳 cleanup、更清楚的 hydration 錯誤訊息 |

```tsx
// useActionState
async function addEvidence(prevState, formData) {
  const res = await api.create(formData.get('name'));
  return res.ok ? { ok: true } : { error: '新增失敗' };
}

function EvidenceForm() {
  const [state, formAction, isPending] = useActionState(addEvidence, null);
  return (
    <form action={formAction}>
      <input name="name" />
      <button disabled={isPending}>{isPending ? '送出中…' : '送出'}</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}

// useOptimistic
const [optimisticTodos, addOptimistic] = useOptimistic(
  todos,
  (current, newTodo) => [...current, { ...newTodo, pending: true }]
);

// ref 直接當 prop（React 19）
function MyInput({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

React 19.2 另外加入了 `<Activity>`（隱藏但保留狀態的區塊）和 `useEffectEvent`（在 effect 內讀取最新值而不必加入依賴）。

---

### 18. React Compiler 是什麼？有了它之後，還需要手寫 `useMemo` 嗎？

**🎤 口說版**
React Compiler 是一個建置期工具（Babel plugin），會分析元件程式碼，自動加上 memoization，效果等同自動幫你寫 `useMemo`、`useCallback`、`React.memo`，而且可以做到更細的粒度。2025 年 10 月已推出穩定的 1.0 版。新程式碼大多不需要再手寫，但它要求程式碼遵守 React 規則（純函式、不直接修改 props 和 state）。少數情況手動 memo 仍有用，例如需要穩定參考作為 effect 的依賴；既有程式碼中的 `useMemo` 也不必急著刪。

**重點**
- 編譯時自動 memoize，減少手動優化和忘記加 memo 造成的效能問題。
- 前提：元件必須遵守 **Rules of React**（render 是純函式、不修改 props/state、Hook 規則）。違反規則的元件，compiler 會跳過不優化。
- 搭配 `eslint-plugin-react-hooks` 的新規則，可以在開發時抓出違規。
- 可以漸進導入，例如只針對特定目錄開啟。
- Next.js、Vite 都可透過設定啟用。

**面試講法**
> 「新專案我會啟用 React Compiler，就不需要到處手寫 useMemo、useCallback。但我還是需要理解 memoization 的原理，才能在 Profiler 看到效能問題時判斷原因，也能寫出 compiler 可以優化的程式碼。」

---

### 19. Server Components 和 Client Components 的差別，`'use client'` 的意義

**🎤 口說版**
Server Components 只在伺服器上執行，可以直接存取資料庫或後端，程式碼不會打包到瀏覽器，所以 bundle 更小、首次載入更快，但不能使用 state、effect 或瀏覽器 API。Client Components 會在瀏覽器執行（也會先在伺服器做 SSR），可以互動。在 Next.js App Router 中，元件預設是 Server Component；`'use client'` 標記的是「伺服器和客戶端的邊界」，這個檔案和它 import 的模組都會打包進客戶端 bundle。

| | Server Component | Client Component |
|---|---|---|
| 執行位置 | 只在伺服器 | 瀏覽器（以及 SSR 時的伺服器） |
| `useState`、`useEffect`、事件處理 | ❌ | ✅ |
| `window`、`localStorage` | ❌ | ✅（在 effect 中） |
| 直接存取資料庫、秘密金鑰 | ✅ | ❌ |
| 打包到 bundle | ❌ | ✅ |
| `async` 元件 | ✅ | ❌ |

**設計原則**
- `'use client'` 盡量放在**葉子元件**（按鈕、表單、互動區塊），讓大部分頁面保持 Server Component。
- Server Component 可以把 Client Component 當子元件，反過來可以透過 `children` 傳入 Server Component。
- 從 Server 傳給 Client 的 props 必須可序列化（不能傳函式，除了 Server Actions）。
- `'use server'` 是另一回事：標記 Server Functions（Server Actions），讓客戶端可以呼叫伺服器函式。

**💼 連結作品**
DrugTurborepo 用 Next.js App Router。像 `apollo-client.tsx` 開頭就有 `'use client'`，因為 Apollo Provider 需要在瀏覽器維護快取；主題切換（next-themes）和語系切換也是 Client Component。另外我用 `middleware.ts` 在請求進入頁面前檢查 cookie，未登入就導向 `/login` 並帶上 `redirect` 參數，登入後可以回到原頁面。

---

### 20. CSR、SSR、SSG、ISR 的差別，各適合什麼場景？

**🎤 口說版**
CSR 是瀏覽器下載 JS 後才渲染，互動強但首屏慢、SEO 差，適合登入後的後台。SSR 是每次請求時在伺服器產生 HTML，資料即時、SEO 好，但伺服器負擔大。SSG 是建置時就產生靜態 HTML，最快也最便宜，適合內容不常變的頁面。ISR 是 SSG 加上定時重新產生，兼顧速度與資料新鮮度。

| | 產生 HTML 的時機 | 優點 | 缺點 | 適合場景 |
|---|---|---|---|---|
| **CSR** | 瀏覽器執行 JS 時 | 互動流暢、伺服器輕鬆 | 首屏慢、SEO 差 | 後台管理系統、內部工具 |
| **SSR** | 每次請求 | 資料即時、SEO 好 | 伺服器負擔、TTFB 較長 | 個人化頁面、即時資料 |
| **SSG** | 建置時 | 最快、可放 CDN | 資料更新要重新建置 | 官網、文件、部落格 |
| **ISR** | 建置時＋定時或依需求重新產生 | 快且資料可更新 | 短時間內可能看到舊資料 | 產品頁、新聞列表 |

Next.js App Router 寫法：
```ts
fetch(url, { cache: 'force-cache' });       // 類似 SSG
fetch(url, { cache: 'no-store' });          // 類似 SSR（每次請求）
fetch(url, { next: { revalidate: 60 } });   // ISR：60 秒後重新產生
```

**延伸觀念**：Hydration 是讓伺服器產生的 HTML「活起來」（綁定事件）；Streaming SSR 搭配 Suspense，可以讓頁面分段送出。

**面試講法**：D-Link 的平台網頁如果是登入後使用的管理介面，CSR 或 SSR 都合理；對外的產品頁面則適合 SSG 或 ISR。

---

## 六、JavaScript 與 CSS 基本功

### 21. 閉包、`this`、Promise 和 async/await、event loop

**閉包（Closure）**

**🎤 口說版**：函式可以「記住」它被定義時所在作用域的變數，即使外層函式已經執行完畢。常用於封裝私有變數、工廠函式、debounce。在 React 中，stale closure 就是閉包拿到舊值造成的問題。

```js
function createCounter() {
  let count = 0;                 // 私有變數
  return () => ++count;
}
const counter = createCounter();
counter(); // 1
counter(); // 2

// 經典題：var vs let
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0 1 2（let 每次迭代都有新的綁定）
```

**`this`**

**🎤 口說版**：一般函式的 `this` 由**呼叫方式**決定；箭頭函式沒有自己的 `this`，會沿用外層的 `this`。

| 呼叫方式 | `this` |
|---|---|
| `obj.method()` | `obj` |
| 一般呼叫 `fn()` | 嚴格模式為 `undefined`，非嚴格模式為全域物件 |
| `new Fn()` | 新建立的物件 |
| `fn.call(x)`、`apply`、`bind` | 指定的 `x` |
| 箭頭函式 | 外層作用域的 `this` |

**Promise 與 async/await**

**🎤 口說版**：Promise 代表一個未來會完成的值，有 pending、fulfilled、rejected 三種狀態。async/await 是 Promise 的語法糖，讓非同步程式寫起來像同步。錯誤處理用 try/catch，平行請求用 `Promise.all`。

```js
async function loadDashboard() {
  try {
    // ❌ 依序等待：總時間是兩者相加
    // const a = await getCases(); const b = await getUsers();

    // ✅ 平行執行
    const [cases, users] = await Promise.all([getCases(), getUsers()]);
  } catch (err) {
    console.error(err);
  }
}
```
| 方法 | 行為 |
|---|---|
| `Promise.all` | 全部成功才成功，任一失敗就失敗 |
| `Promise.allSettled` | 等全部完成，回傳每個的結果與狀態 |
| `Promise.race` | 第一個完成（成功或失敗）的結果 |
| `Promise.any` | 第一個成功的結果 |

**Event Loop**

**🎤 口說版**：JS 是單執行緒。同步程式在 call stack 執行完後，event loop 會先清空**所有 microtask**（Promise 的 `then`、`queueMicrotask`），再取**一個 macrotask**（`setTimeout`、I/O、事件），然後再清空 microtask，如此循環。

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// 輸出：1 4 3 2
```
順序：同步程式（1、4）→ microtask（3）→ macrotask（2）。

---

### 22. `==` 和 `===`、淺拷貝和深拷貝、`map`／`filter`／`reduce`

**`==` 和 `===`**

**🎤 口說版**：`==` 會先做型別轉換再比較，`===` 不轉型，型別和值都要相同。實務上一律用 `===`，唯一常見的例外是 `x == null`，可以同時判斷 `null` 和 `undefined`。

```js
0 == '0'          // true
0 == ''           // true
null == undefined // true
NaN === NaN       // false → 用 Number.isNaN()
[] == false       // true（轉型的陷阱）
```

**淺拷貝和深拷貝**

**🎤 口說版**：淺拷貝只複製第一層，巢狀物件仍然共用同一個參考；深拷貝會完整複製所有層級。React 更新 state 時必須產生新的參考，但通常只需要「在變動的路徑上」淺拷貝即可。

```js
const user = { name: 'Shack', address: { city: 'Taipei' } };

// 淺拷貝
const a = { ...user };            // 或 Object.assign({}, user)
a.address.city = 'Wien';          // ❗ user.address.city 也被改了

// 深拷貝
const b = structuredClone(user);  // ✅ 現代瀏覽器內建
// JSON.parse(JSON.stringify(user)) 會遺失 Date、undefined、函式

// React 中更新巢狀 state
setUser(prev => ({ ...prev, address: { ...prev.address, city: 'Wien' } }));
```

**`map`／`filter`／`reduce`**

**🎤 口說版**：三者都不會修改原陣列。`map` 一對一轉換，`filter` 篩選，`reduce` 把陣列累積成一個值。

```js
const cases = [
  { id: 1, status: 'open', evidenceCount: 3 },
  { id: 2, status: 'closed', evidenceCount: 5 },
  { id: 3, status: 'open', evidenceCount: 2 },
];

cases.map(c => c.id);                                // [1, 2, 3]
cases.filter(c => c.status === 'open');              // id 1 和 3
cases.reduce((sum, c) => sum + c.evidenceCount, 0);  // 10

// reduce 分組
cases.reduce((acc, c) => {
  (acc[c.status] ??= []).push(c);
  return acc;
}, {});
// 現代寫法：Object.groupBy(cases, c => c.status)
```
補充：`forEach` 沒有回傳值；`find` 找第一個符合的；`some`、`every` 回傳布林值；`toSorted`、`toReversed` 是不修改原陣列的新版本。

---

### 23. Flexbox 和 Grid 的差別、RWD 的作法、CSS Modules 和 Tailwind 的取捨

**Flexbox 和 Grid**

**🎤 口說版**：Flexbox 是一維排版，處理一行或一列的元素對齊與分配，適合導覽列、按鈕群組、置中。Grid 是二維排版，同時控制列與欄，適合整頁版面、卡片網格、儀表板。兩者常常搭配使用。

```css
/* Flexbox：水平垂直置中 */
.center { display: flex; justify-content: center; align-items: center; }

/* Grid：自動適應欄數的卡片網格（不用寫 media query） */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
```

**RWD 作法**
1. **Mobile first**：預設寫手機版，再用 `min-width` 的 media query 往上擴充。
2. 使用相對單位：`rem`、`%`、`vw`、`clamp()`（例如 `font-size: clamp(1rem, 2vw, 1.5rem)`）。
3. 彈性版面：Flexbox 換行、Grid 的 `auto-fill`、`minmax`。
4. 圖片：`max-width: 100%`、`srcset`、`<picture>`。
5. **Container Queries**（`@container`）：依父容器寬度而非視窗寬度調整，適合可重用元件。
6. 記得 `<meta name="viewport" content="width=device-width, initial-scale=1">`。

**CSS Modules 和 Tailwind**
| | CSS Modules | Tailwind CSS |
|---|---|---|
| 寫法 | 獨立 `.module.css`，class 自動加上 hash 避免衝突 | 在 JSX 直接寫 utility class |
| 優點 | 標準 CSS、HTML 乾淨、適合複雜樣式 | 開發快、設計一致（design tokens）、不必命名、未使用的樣式自動移除 |
| 缺點 | 要切換檔案、要命名、容易累積無用樣式 | class 很長、初期學習成本、需要團隊共識 |
| 適合 | 樣式複雜、需要精細控制的元件 | 快速開發、有設計系統的團隊 |

**💼 連結作品**
「我兩種都用過：HumanDesign 用 **CSS Modules**（`HomePage.module.css`、`Booking.module.css` 等，依頁面拆分），DrugTurborepo 用 **Tailwind＋shadcn/ui**（Radix UI 為基礎，搭配 `class-variance-authority` 管理元件變體、`tailwind-merge` 合併 class）。我覺得 Tailwind 在團隊開發時更容易維持一致性，不過我可以配合團隊既有的規範。」

---

## 七、工程實務

### 24. 你怎麼寫前端單元測試？

**🎤 口說版**
我會用 Vitest 或 Jest 搭配 React Testing Library。原則是**測試使用者看到的行為，而不是實作細節**：用角色、文字找元素（`getByRole`、`getByLabelText`），模擬使用者操作，驗證畫面結果；不去測 state 的值或內部函式。API 則用 MSW（Mock Service Worker）模擬，讓測試接近真實情況。

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

test('欄位空白時顯示錯誤訊息', async () => {
  const user = userEvent.setup();
  render(<LoginForm onSubmit={vi.fn()} />);

  await user.click(screen.getByRole('button', { name: '登入' }));

  expect(await screen.findByText('請輸入帳號')).toBeInTheDocument();
});

test('填寫正確時呼叫 onSubmit', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<LoginForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText('帳號'), 'shack');
  await user.type(screen.getByLabelText('密碼'), 'secret123');
  await user.click(screen.getByRole('button', { name: '登入' }));

  expect(onSubmit).toHaveBeenCalledWith({ account: 'shack', password: 'secret123' });
});
```

**測試金字塔**
| 類型 | 工具 | 測什麼 |
|---|---|---|
| 單元測試 | Vitest／Jest | 純函式、自訂 Hook（`renderHook`）、工具函式 |
| 元件／整合測試 | React Testing Library＋MSW | 元件行為、表單流程、API 串接 |
| E2E | Playwright／Cypress | 關鍵使用者流程（登入、建立案件） |

**優先測試的地方**：商業邏輯、表單驗證、權限判斷、錯誤處理、曾經出過 bug 的地方。

**💼 連結作品（誠實說明）**
> 「DrugTurborepo 的後端每個模組（Case、Evidence、Users）都有 service 和 resolver 的 Jest 單元測試，還有 e2e 測試，並且在 CI 中自動執行。前端目前測試比較少，這是我接下來要補強的部分。我會先為表單驗證和權限相關的元件，用 React Testing Library 加上 MSW 撰寫測試。」

---

### 25. Code review 時你會看哪些地方？

**🎤 口說版**
我會由大到小看：先確認這個 PR 是否解決了需求、邏輯有沒有漏掉的邊界情況，再看可讀性與一致性、效能和安全性，最後是有沒有測試。給意見時對事不對人，說明原因並區分「必須修改」和「建議」，也會肯定寫得好的地方。

**檢查清單**
1. **正確性**：是否符合需求？邊界情況（空陣列、null、網路錯誤、權限不足）有處理嗎？
2. **可讀性**：命名清楚嗎？函式和元件是否過大？有沒有重複的程式碼？
3. **React 相關**：
   - `key` 是否穩定？
   - `useEffect` 的依賴是否正確？有沒有 cleanup？
   - 是否有不必要的 effect 或 state（能從其他值算出來的）？
   - 元件是否過度 re-render？
4. **型別**：TypeScript 有沒有濫用 `any`？
5. **安全性**：使用者輸入有沒有用 `dangerouslySetInnerHTML`？**有沒有寫死的金鑰、密碼**？有沒有在 log 中印出敏感資料？
6. **效能**：有沒有不必要的大型套件？有沒有 N+1 請求？
7. **無障礙**：按鈕和輸入框有沒有正確的 label？可以用鍵盤操作嗎？
8. **測試**：新功能有沒有測試？既有測試是否通過？

**溝通方式**
- 用提問代替命令：「這邊如果 `data` 是空陣列，會發生什麼事？」
- 加上標記：`[必改]`、`[建議]`、`[nit]`（小細節）。
- 能用工具自動化的（格式、lint）交給 Prettier、ESLint、CI，review 專注在邏輯與設計。

**💼 連結作品**
「我在使用 AI 輔助開發時，也是用 code review 的角度檢查它產生的程式碼。例如 CounterRiti 中有一個 PR 是 AI 協助產生的重構，我會在合併前逐一確認改動是否正確。另外，我最近也自己檢查了過去的作品，發現有 API key 寫在程式碼中的問題並修正，這讓我更重視 review 時的安全性檢查。」

---

### 26. 說明你的 CI/CD 流程

**🎤 口說版**
以 DrugTurborepo 為例：專案是 pnpm＋Turborepo 的 monorepo。每次 push 到 main 或開 PR 時，GitHub Actions 會執行 CI：安裝依賴、透過 Turborepo build 所有套件、跑 Jest 測試，失敗就不能合併。另一個 workflow 會 build 前後端的 Docker image 並推送到 GitHub Container Registry。部署時，伺服器上用 docker-compose 拉取最新的 image 並啟動，SQLite 資料庫透過 volume 掛載保存。

**流程圖**
```
開發者 push / 開 PR
        │
        ▼
GitHub Actions：CI（ci.yml）
  1. checkout
  2. 安裝 pnpm、Node 20（含 pnpm 快取）
  3. pnpm install
  4. pnpm build  → turbo run build（只重建有變動的套件，有快取）
  5. pnpm test   → turbo test（後端 Jest 單元測試）
        │ 通過
        ▼
GitHub Actions：docker-build.yml
  build 前端（Next.js）、後端（NestJS）image
  → push 到 ghcr.io/shackarbeit/drug-frontend、drug-backend
        │
        ▼
VPS：docker-compose pull && docker-compose up -d
  backend：4000 → 3001，volume 掛載 ./data（SQLite）
  frontend：3000，depends_on backend
```

**為什麼用 Turborepo**：monorepo 中的多個 app 和共用套件可以平行建置，並依照相依關係排序；有快取，沒有變動的套件不會重建，CI 更快。

**改進方向（主動提出，對應 JD「自動化部署與維護」和「提出改善意見」）**
1. CI 加入 **lint 與型別檢查**（`turbo run lint check-types`），並補上前端測試。
2. 部署自動化：image 推送後，透過 SSH 或 webhook 自動在 VPS 執行 `docker-compose pull`，達成真正的 CD。
3. 環境變數與秘密改用 GitHub Secrets 管理，前端 API 位址改用環境變數，不寫死 IP。
4. 加上 **Nginx 反向代理與 HTTPS**（Let's Encrypt）。
5. 資料庫：正式環境改用 PostgreSQL，並建立定期備份。
6. 部署策略：保留前一版 image 的 tag，出問題時可以快速 rollback。

---

## 附錄：現場手寫題

### A. 計數器（含 functional update）
```tsx
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(0)}>重設</button>
    </div>
  );
}
```

### B. Todo List
```tsx
type Todo = { id: string; text: string; done: boolean };

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setTodos(prev => [...prev, { id: crypto.randomUUID(), text: text.trim(), done: false }]);
    setText('');
  };
  const toggle = (id: string) =>
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) =>
    setTodos(prev => prev.filter(t => t.id !== id));

  return (
    <>
      <form onSubmit={add}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="新增待辦" />
        <button type="submit">新增</button>
      </form>
      <ul>
        {todos.map(t => (
          <li key={t.id}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
            </label>
            <button onClick={() => remove(t.id)}>刪除</button>
          </li>
        ))}
      </ul>
    </>
  );
}
```

### C. 抓取 API 並處理 loading、error、競態
```tsx
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    fetch('/api/users', { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => { setUsers(data); setStatus('success'); })
      .catch(err => { if (err.name !== 'AbortError') setStatus('error'); });
    return () => controller.abort();
  }, []);

  if (status === 'loading') return <p>載入中…</p>;
  if (status === 'error') return <p>載入失敗，請重試</p>;
  if (users.length === 0) return <p>目前沒有資料</p>;
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

### D. 修正無限 re-render
```tsx
// ❌ 問題 1：render 中直接 setState
function Bad1() {
  const [n, setN] = useState(0);
  setN(n + 1);          // 每次 render 都觸發 render → 無限迴圈
}

// ❌ 問題 2：onClick 直接呼叫而不是傳函式
<button onClick={setOpen(true)}>    // render 時就執行了
<button onClick={() => setOpen(true)}>   // ✅

// ❌ 問題 3：effect 依賴每次都是新物件
const options = { page: 1 };
useEffect(() => { fetchData(options); }, [options]);   // 每次 render options 都是新的
// ✅ 改為依賴原始值，或把物件移到元件外、用 useMemo
useEffect(() => { fetchData({ page }); }, [page]);
```

### E. `useDebounce`
見第 12 題。

---

## 最後提醒：回答的通用公式

> **定義（一句話）→ 為什麼／怎麼運作 → 實際範例或自己作品中的經驗 → 取捨或改進方向**

不知道的題目，誠實說「這部分我實際經驗比較少，我的理解是⋯⋯」，比硬掰更能建立信任。
