// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 🔄 소셜 로그인 직후에 백엔드 JWT 발급받기
      if (account) {
        try {
          // 🎯 제공자별로 올바른 엔드포인트 호출
          let endpoint = "";
          switch (account.provider) {
            case "google":
              endpoint = "/authorization/google/app";
              break;
            case "kakao":
              endpoint = "/authorization/kakao/app"; // 백엔드에서 구현 필요
              break;
            case "naver":
              endpoint = "/authorization/naver/app"; // 백엔드에서 구현 필요
              break;
            default:
              throw new Error(`지원하지 않는 제공자: ${account.provider}`);
          }

          const response = await fetch(`${process.env.BACKEND_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken: account.access_token, // 소셜 플랫폼 토큰
            }),
          });

          if (response.ok) {
            const backendTokens = await response.json();
            // 🔑 백엔드 JWT를 NextAuth 토큰에 저장
            token.backendAccessToken = backendTokens.accessToken;
            token.backendRefreshToken = backendTokens.refreshToken;
            token.provider = account.provider;
          } else {
            console.error("백엔드 JWT 발급 실패");
          }
        } catch (error) {
          console.error("백엔드 연동 오류:", error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      // 🎯 백엔드 JWT를 세션에 제공 (소셜 토큰이 아닌!)
      session.accessToken = token.backendAccessToken as string;
      session.refreshToken = token.backendRefreshToken as string;
      session.provider = token.provider as string;
      return session;
    },

    // ❌ signIn 콜백 제거 (jwt 콜백에서 처리하므로 불필요)
  },
});

export { handler as GET, handler as POST };
