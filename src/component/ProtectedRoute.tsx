// component/ProtectedRoute.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireBackendAuth?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  fallback = (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">로그인이 필요합니다</h2>
        <p className="text-gray-600">이 페이지에 접근하려면 로그인해주세요.</p>
      </div>
    </div>
  ),
  requireBackendAuth = true,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // 로딩 중일 때는 대기

    if (status === "unauthenticated") {
      router.push(redirectTo);
      return;
    }

    // 백엔드 인증이 필요한 경우 추가 체크
    if (requireBackendAuth && session && !session.isBackendAuthenticated) {
      console.warn("백엔드 토큰이 없습니다. 다시 로그인해주세요.");
      router.push(redirectTo);
      return;
    }
  }, [status, session, router, requireBackendAuth, redirectTo]);

  // 로딩 중
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않음
  if (status === "unauthenticated") {
    return <>{fallback}</>;
  }

  // 백엔드 토큰이 필요하지만 없는 경우
  if (requireBackendAuth && session && !session.isBackendAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">인증 중...</h2>
          <p className="text-gray-600">백엔드 인증을 처리하고 있습니다.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
