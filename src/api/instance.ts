import axios from "axios";
import useAuthStore from "../store/authStore";

/**
 * 백엔드(Spring Boot, localhost:8080)와 통신하기 위한 공용 axios 인스턴스.
 * src/api/ 아래 모든 API 함수는 이 인스턴스를 통해 요청을 보낸다.
 * baseURL은 .env의 VITE_API_BASE_URL이 없으면 "/api"로 대체된다.
 */
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
  // refresh 토큰이 HttpOnly 쿠키로 오가므로, cross-origin 요청에도 쿠키를 주고받도록 허용한다.
  // (백엔드는 CORS allowCredentials=true + 오리진 화이트리스트로 응답해야 함)
  withCredentials: true,
});

// 요청 인터셉터: 매 요청마다 authStore에 저장된 accessToken을 Authorization 헤더에 자동으로 실어보낸다.
instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 인터셉터:
// - 성공 시 axios 응답 객체 전체가 아니라 res.data만 바로 반환하도록 언래핑.
// - 401(인증 만료/실패) 응답을 받으면 authStore.logout()을 호출해 자동으로 로그아웃 처리한다.
instance.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err);
  }
);

export default instance;
