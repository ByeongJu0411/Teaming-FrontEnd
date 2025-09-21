// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";

interface BackendJWTResponse {
  accessToken: string;
  refreshToken: string;
}

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

  debug: true,

  callbacks: {
    async jwt({ token, account, profile }) {
      console.log("=== JWT CALLBACK START ===");
      console.log("Account:", account ? `${account.provider} - ${account.type}` : "없음");
      console.log("Access Token 존재:", !!account?.access_token);

      if (account) {
        try {
          let endpoint = "";
          switch (account.provider) {
            case "google":
              endpoint = "/api/auth/google";
              break;
            case "kakao":
              endpoint = "/api/auth/kakao";
              break;
            case "naver":
              endpoint = "/api/auth/naver";
              break;
            default:
              console.error("지원하지 않는 제공자:", account.provider);
              return token;
          }

          const backendUrl = process.env.BACKEND_URL || "http://13.125.193.243:8080";
          const fullUrl = `${backendUrl}${endpoint}`;

          console.log("백엔드 요청 URL:", fullUrl);
          console.log("요청 데이터:", { accessToken: account.access_token?.substring(0, 20) + "..." });

          const response = await fetch(fullUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              accessToken: account.access_token,
            }),
          });

          console.log("백엔드 응답 상태:", response.status);
          console.log("백엔드 응답 헤더:", Object.fromEntries(response.headers.entries()));

          const responseText = await response.text();
          console.log("백엔드 응답 내용:", responseText);

          if (response.ok) {
            try {
              const backendTokens: BackendJWTResponse = JSON.parse(responseText);
              console.log("백엔드 JWT 파싱 성공");
              console.log("Access Token 길이:", backendTokens.accessToken?.length);
              console.log("Refresh Token 길이:", backendTokens.refreshToken?.length);

              token.backendAccessToken = backendTokens.accessToken;
              token.backendRefreshToken = backendTokens.refreshToken;
              token.provider = account.provider;
              token.backendError = false;

              console.log("백엔드 토큰 저장 완료");
            } catch (parseError) {
              console.error("JSON 파싱 실패:", parseError);
              console.error("응답 내용:", responseText);
              token.backendError = true;
            }
          } else {
            console.error(`백엔드 API 실패 (${response.status}):`, responseText);

            if (response.status === 404) {
              console.error("API 엔드포인트를 찾을 수 없습니다. 백엔드 서버 확인 필요");
            } else if (response.status === 500) {
              console.error("백엔드 서버 내부 오류");
            } else if (response.status === 401) {
              console.error("인증 토큰이 유효하지 않습니다");
            }

            token.provider = account.provider;
            token.backendError = true;
            token.backendErrorStatus = response.status;
            token.backendErrorMessage = responseText;
          }
        } catch (error) {
          console.error("백엔드 API 호출 중 네트워크 오류:", error);

          if (error instanceof TypeError && error.message.includes("fetch")) {
            console.error("네트워크 연결 실패 - 백엔드 서버가 실행 중인지 확인하세요");
          }

          token.provider = account.provider;
          token.backendError = true;
          token.networkError = true;
        }
      }

      console.log("=== JWT CALLBACK END ===");
      console.log("최종 토큰 상태:", {
        hasBackendToken: !!token.backendAccessToken,
        hasError: !!token.backendError,
        provider: token.provider,
      });

      return token;
    },

    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");

      session.accessToken = token.backendAccessToken as string;
      session.refreshToken = token.backendRefreshToken as string;
      session.provider = token.provider as string;
      session.isBackendAuthenticated = !!token.backendAccessToken && !token.backendError;

      if (token.backendError) {
        session.backendError = {
          hasError: true,
          status: token.backendErrorStatus as number,
          message: token.backendErrorMessage as string,
          isNetworkError: !!token.networkError,
        };
      }

      console.log("세션 생성 완료:", {
        isBackendAuthenticated: session.isBackendAuthenticated,
        hasBackendError: !!session.backendError,
        provider: session.provider,
      });

      return session;
    },
  },

  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
