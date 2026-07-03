/**
 * 앱 최상위 루트 컴포넌트
 * - 실제 화면 구성/로직은 여기 없고, router/index.tsx 에 정의된 라우트 트리를
 *   RouterProvider에 연결해주는 역할만 함
 * - 어떤 페이지가 어떤 경로에 매핑되는지는 src/router/index.tsx 참고
 */
import { RouterProvider } from "react-router-dom";
import router from "./router";

export default function App() {
  return <RouterProvider router={router} />;
}
