/**
 * 인증 관련 커스텀 훅들
 *
 * 이 파일에는 NextAuth를 사용한 소셜 로그인과 백엔드 JWT 토큰 관리를 위한
 * 커스텀 훅들이 포함되어 있습니다.
 *
 * 주요 기능:
 * 1. 사용자 인증 상태 관리
 * 2. 자동 토큰 갱신
 * 3. API 요청 시 토큰 자동 포함
 * 4. 인증 에러 처리
 */

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";

/**
 * 메인 인증 훅
 *
 * 사용자의 인증 상태를 관리하고, 토큰 만료 시 자동 갱신을 처리합니다.
 *
 * @param requireAuth - true면 인증되지 않은 사용자를 로그인 페이지로 리다이렉트
 * @returns 인증 관련 상태와 메서드들
 */
export function useAuth(requireAuth: boolean = true) {
  // NextAuth에서 제공하는 세션 훅 사용
  // data: 현재 세션 정보 (Session | null)
  // status: 세션 상태 ("loading" | "authenticated" | "unauthenticated")
  // update: 세션을 수동으로 갱신하는 함수
  const { data: session, status, update } = useSession();
  const router = useRouter();

  /**
   * 세션 상태를 체크하고 필요시 토큰을 갱신하는 함수
   * useCallback으로 메모이제이션하여 불필요한 재생성을 방지
   */
  const checkAndRefreshSession = useCallback(async () => {
    // 세션이 없으면 체크할 필요 없음
    if (!session) return;

    // 백엔드 인증 에러가 있는 경우 처리
    if (session.backendError?.hasError) {
      console.error("백엔드 인증 에러:", session.backendError);

      // 인증이 필요한 페이지라면 로그아웃 후 로그인 페이지로 이동
      if (requireAuth) {
        await signOut({ redirect: false }); // 자동 리다이렉트 비활성화
        router.push("/login");
      }
      return;
    }

    // 토큰 만료 시간이 설정되어 있고, 현재 시간이 만료 시간을 초과한 경우
    if (session.tokenExpires && Date.now() > session.tokenExpires) {
      console.log("세션이 만료되었습니다. 갱신을 시도합니다.");

      try {
        // NextAuth의 세션 갱신 함수 호출
        // 이 함수는 jwt callback을 다시 실행하여 토큰을 갱신합니다
        await update();
      } catch (error) {
        console.error("세션 갱신 실패:", error);

        // 갱신 실패 시 로그아웃 처리
        if (requireAuth) {
          await signOut({ redirect: false });
          router.push("/login");
        }
      }
    }
  }, [session, update, requireAuth, router]);

  /**
   * 인증되지 않은 사용자를 로그인 페이지로 리다이렉트
   * status가 변경될 때마다 실행
   */
  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, requireAuth, router]);

  /**
   * 세션이 인증된 상태일 때 주기적으로 토큰 상태를 체크
   * 5분마다 토큰 만료 시간을 확인하여 사전에 갱신 처리
   */
  useEffect(() => {
    if (session && status === "authenticated") {
      // 즉시 한 번 체크
      checkAndRefreshSession();

      // 5분마다 주기적으로 체크
      const interval = setInterval(checkAndRefreshSession, 5 * 60 * 1000);

      // 컴포넌트 언마운트 시 interval 정리
      return () => clearInterval(interval);
    }
  }, [session, status, checkAndRefreshSession]);

  // 인증 관련 상태와 메서드를 객체로 반환
  return {
    session, // 현재 세션 정보
    status, // 세션 상태
    isLoading: status === "loading", // 로딩 중 여부
    isAuthenticated: status === "authenticated", // 인증 여부
    backendToken: session?.accessToken, // 백엔드 JWT 토큰
    isBackendAuthenticated: session?.isBackendAuthenticated, // 백엔드 인증 여부
    user: session?.user, // 사용자 정보
    provider: session?.provider, // 로그인 제공자 (google, kakao, naver)
    refreshSession: update, // 세션 수동 갱신 함수
  };
}

/**
 * 인증된 API 요청을 위한 훅
 *
 * 모든 API 요청에 자동으로 Authorization 헤더를 추가하고,
 * 토큰 만료 시 자동 갱신을 처리하는 fetch 함수를 제공합니다.
 *
 * @returns authenticatedFetch 함수
 */
export function useAuthenticatedFetch() {
  const { data: session, update } = useSession();
  const router = useRouter();

  /**
   * 인증된 API 요청을 수행하는 함수
   *
   * @param url - 요청할 URL (상대 경로 또는 절대 경로)
   * @param options - fetch 옵션 (method, body, headers 등)
   * @returns Promise<Response>
   */
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      // 토큰 만료 사전 체크
      // API 요청 전에 토큰이 만료되었는지 확인하고 필요시 갱신
      if (session?.tokenExpires && Date.now() > session.tokenExpires) {
        try {
          console.log("토큰이 만료되어 갱신 중...");
          await update();
        } catch (error) {
          console.error("토큰 갱신 실패:", error);
          await signOut({ redirect: false });
          router.push("/login");
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        }
      }

      // URL 처리: 상대 경로인 경우 백엔드 URL을 앞에 붙임
      const fullUrl = url.startsWith("http")
        ? url // 이미 완전한 URL인 경우 그대로 사용
        : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}${url}`;

      // 기본 헤더 설정
      const headers = {
        "Content-Type": "application/json", // 기본적으로 JSON 요청
        ...options.headers, // 사용자가 전달한 추가 헤더
        // 세션에 accessToken이 있으면 Authorization 헤더 추가
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      };

      try {
        // 실제 API 요청 수행
        const response = await fetch(fullUrl, {
          ...options, // 사용자가 전달한 fetch 옵션
          headers, // 위에서 구성한 헤더
        });

        // 401 Unauthorized 에러 처리
        // 토큰이 유효하지 않거나 만료된 경우
        if (response.status === 401) {
          console.error("인증 실패: 401 Unauthorized");

          // 토큰 갱신을 시도하고 재요청
          try {
            console.log("401 에러로 인한 토큰 갱신 시도...");
            await update();

            // 갱신된 토큰으로 헤더 재구성
            const newHeaders = {
              ...headers,
              Authorization: `Bearer ${session?.accessToken}`,
            };

            // 동일한 요청을 갱신된 토큰으로 재시도
            return await fetch(fullUrl, {
              ...options,
              headers: newHeaders,
            });
          } catch (refreshError) {
            console.error("토큰 갱신 및 재요청 실패:", refreshError);
            await signOut({ redirect: false });
            router.push("/login");
            throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
          }
        }

        // 403 Forbidden 에러 처리
        // 인증은 되었지만 해당 리소스에 대한 권한이 없는 경우
        if (response.status === 403) {
          console.error("권한 없음: 403 Forbidden");
          throw new Error("이 작업을 수행할 권한이 없습니다.");
        }

        // 정상 응답 반환
        return response;
      } catch (error) {
        // 네트워크 에러 처리
        if (error instanceof TypeError && error.message.includes("fetch")) {
          console.error("네트워크 연결 오류:", error);
          throw new Error("서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.");
        }

        // 다른 에러는 그대로 전달
        throw error;
      }
    },
    [session, update, router]
  );

  return authenticatedFetch;
}

/**
 * 로그인 상태만 확인하는 훅 (리다이렉트 없음)
 *
 * useAuth와 달리 인증되지 않은 사용자를 자동으로 리다이렉트하지 않습니다.
 * 조건부로 컨텐츠를 보여주거나 숨길 때 사용합니다.
 *
 * @returns 인증 관련 상태 정보
 */
export function useAuthStatus() {
  const { data: session, status } = useSession();

  return {
    session, // 현재 세션 정보
    status, // 세션 상태
    isLoading: status === "loading", // 로딩 중 여부
    isAuthenticated: status === "authenticated", // 인증 여부
    backendToken: session?.accessToken, // 백엔드 JWT 토큰
    isBackendAuthenticated: session?.isBackendAuthenticated, // 백엔드 인증 여부
    user: session?.user, // 사용자 정보
    provider: session?.provider, // 로그인 제공자
  };
}

/**
 * 세션 상태를 모니터링하는 훅 (개발/디버깅 용도)
 *
 * 세션 상태 변화를 콘솔에 로그로 출력하여 디버깅을 도와줍니다.
 * 토큰 만료 예정 시 경고 메시지도 출력합니다.
 *
 * @returns 세션과 상태 정보
 */
export function useSessionMonitor() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // 인증된 상태일 때만 모니터링
    if (session && status === "authenticated") {
      console.log("현재 세션 상태:", {
        isAuthenticated: status === "authenticated",
        isBackendAuthenticated: session.isBackendAuthenticated,
        tokenExpires: session.tokenExpires ? new Date(session.tokenExpires).toLocaleString() : "N/A",
        provider: session.provider,
      });

      // 토큰 만료 10분 전 경고 알림
      if (session.tokenExpires) {
        const timeUntilExpiry = session.tokenExpires - Date.now();

        // 0보다 크고 10분(600,000ms) 이내에 만료되는 경우
        if (timeUntilExpiry > 0 && timeUntilExpiry < 10 * 60 * 1000) {
          console.warn(`⚠️ 토큰이 ${Math.floor(timeUntilExpiry / 60000)}분 후 만료됩니다.`);
        }
      }
    }
  }, [session, status]); // 세션이나 상태가 변경될 때마다 실행

  return { session, status };
}

/**
 * 사용 예시:
 *
 * // 1. 기본 인증 훅 사용
 * const { isAuthenticated, user, backendToken } = useAuth();
 *
 * // 2. 인증된 API 요청
 * const authenticatedFetch = useAuthenticatedFetch();
 * const response = await authenticatedFetch('/api/users/profile');
 *
 * // 3. 상태만 확인 (리다이렉트 없음)
 * const { isAuthenticated } = useAuthStatus();
 *
 * // 4. 세션 모니터링 (개발 시에만 사용)
 * useSessionMonitor();
 */
