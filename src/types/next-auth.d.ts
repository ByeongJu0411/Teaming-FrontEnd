// types/next-auth.d.ts
import NextAuth from "next-auth";

// NextAuth의 기본 타입을 확장하여 우리가 필요한 필드들을 추가
declare module "next-auth" {
  interface Session {
    // 🔑 백엔드에서 발급받은 JWT 토큰을 저장할 필드
    accessToken?: string;
    refreshToken?: string;
    // 📝 어떤 소셜 로그인을 사용했는지 (google, kakao 등)
    provider?: string;

    // 🆔 소셜 플랫폼에서의 사용자 고유 ID
    providerAccountId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // 🔑 NextAuth 내부 JWT에 백엔드 토큰을 저장
    backendAccessToken?: string; // 🔑 백엔드 JWT
    backendRefreshTOken?: string; // 🔄 백엔드 리프레시 토큰
    // 📝 로그인 제공자 정보
    provider?: string;

    // 🆔 소셜 플랫폼 사용자 ID
    providerAccountId?: string;
  }
}
