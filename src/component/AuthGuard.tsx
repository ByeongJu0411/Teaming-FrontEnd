// component/AuthGuard.tsx
"use client";

import { ComponentType } from "react";
import { useSession } from "next-auth/react";
import ProtectedRoute from "./ProtectedRoute";

interface AuthGuardOptions {
  requireBackendAuth?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

// HOC로 페이지를 보호하는 방식
export function withAuthGuard<T extends object>(Component: ComponentType<T>, options: AuthGuardOptions = {}) {
  const AuthGuardedComponent = (props: T) => {
    return (
      <ProtectedRoute
        requireBackendAuth={options.requireBackendAuth}
        fallback={options.fallback}
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  AuthGuardedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;

  return AuthGuardedComponent;
}

// 간단한 인증 체크 컴포넌트
interface AuthCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showForAuthenticated?: boolean;
}

export function AuthCheck({ children, fallback = null, showForAuthenticated = true }: AuthCheckProps) {
  const { status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  if (isLoading) {
    return null;
  }

  const shouldShow = showForAuthenticated ? isAuthenticated : !isAuthenticated;

  return shouldShow ? <>{children}</> : <>{fallback}</>;
}
