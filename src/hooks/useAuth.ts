// hooks/useAuth.ts
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth(requireAuth: boolean = true) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, requireAuth, router]);

  return {
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    backendToken: session?.accessToken,
    isBackendAuthenticated: session?.isBackendAuthenticated,
    user: session?.user,
    provider: session?.provider,
  };
}

// API 호출 시 자동으로 토큰 포함하는 훅
export function useAuthenticatedFetch() {
  const { session } = useAuth(false);

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    // 백엔드 서버 URL이 포함되지 않은 경우 자동 추가
    const fullUrl = url.startsWith("http")
      ? url
      : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}${url}`;

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      ...(session?.accessToken && {
        Authorization: `Bearer ${session.accessToken}`,
      }),
    };

    return fetch(fullUrl, {
      ...options,
      headers,
    });
  };

  return authenticatedFetch;
}

// 로그인 상태 체크만 하는 훅 (리다이렉트 없음)
export function useAuthStatus() {
  const { data: session, status } = useSession();

  return {
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    backendToken: session?.accessToken,
    isBackendAuthenticated: session?.isBackendAuthenticated,
    user: session?.user,
    provider: session?.provider,
  };
}
