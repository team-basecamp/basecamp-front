/**
 * 앱의 진입점(entry point) — index.html의 #root에 React 앱을 마운트함
 * - QueryClientProvider로 감싸두었지만, 현재는 실제 API 연동 전이라 useQuery를 쓰는 곳은 없음
 *   (백엔드 연동 시 서버 상태 관리를 위해 TanStack Query를 바로 쓸 수 있도록 미리 준비해둔 것)
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./styles/index.css";

// 추후 서버 연동 시 사용할 QueryClient (현재는 실사용 안함, 연동 대비용)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
