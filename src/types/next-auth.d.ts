// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
    providerAccountId?: string;
    isBackendAuthenticated?: boolean;
    backendError?: {
      hasError: boolean;
      status: number;
      message: string;
      isNetworkError: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendAccessToken?: string;
    backendRefreshToken?: string; // 오타 수정: TOken -> Token
    provider?: string;
    providerAccountId?: string;
    backendError?: boolean;
    backendErrorStatus?: number;
    backendErrorMessage?: string;
    networkError?: boolean;
  }
}
