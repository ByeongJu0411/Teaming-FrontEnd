// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
    tokenExpires?: number;
    providerAccountId?: string;
    isBackendAuthenticated?: boolean;
    backendError?: {
      hasError: boolean;
      status: number;
      message: string;
      isNetworkError: boolean;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    backendAccessToken?: string;
    backendRefreshToken?: string;
    backendTokenExpires?: number;
    provider?: string;
    providerAccountId?: string;
    backendError?: boolean;
    backendErrorStatus?: number;
    backendErrorMessage?: string;
    networkError?: boolean;
    sub?: string;
  }
}
