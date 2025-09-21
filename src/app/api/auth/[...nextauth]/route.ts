// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";

// 백엔드 JWT 응답 타입 정의
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
  callbacks: {
    async jwt({ token, account, profile }) {
      // 🔄 소셜 로그인 직후에 백엔드 JWT 발급받기
      if (account) {
        try {
          // 🎯 제공자별로 올바른 엔드포인트 호출 (스웨거 기준)
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
              throw new Error(`지원하지 않는 제공자: ${account.provider}`);
          }

          console.log(`백엔드 ${account.provider} 인증 시도:`, endpoint);

          const response = await fetch(`${process.env.BACKEND_URL}${endpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              accessToken: account.access_token, // 소셜 플랫폼에서 받은 액세스 토큰
            }),
          });

          if (response.ok) {
            const backendTokens: BackendJWTResponse = await response.json();
            console.log(`${account.provider} 백엔드 JWT 발급 성공`);

            // 🔑 백엔드 JWT를 NextAuth 토큰에 저장
            token.backendAccessToken = backendTokens.accessToken;
            token.backendRefreshToken = backendTokens.refreshToken;
            token.provider = account.provider;

            // 디버깅용 (프로덕션에서는 제거)
            console.log("Backend Access Token:", backendTokens.accessToken?.substring(0, 20) + "...");
          } else {
            const errorText = await response.text();
            console.error(`백엔드 JWT 발급 실패 (${response.status}):`, errorText);
            throw new Error(`백엔드 인증 실패: ${response.status}`);
          }
        } catch (error) {
          console.error("백엔드 연동 오류:", error);
          // 에러가 발생해도 NextAuth 로그인은 계속 진행
          // 필요에 따라 여기서 로그인을 중단하고 싶다면 throw error; 사용
        }
      }

      // 🔄 토큰 갱신 로직 (선택사항)
      if (token.backendRefreshToken && isTokenExpired(token.backendAccessToken)) {
        try {
          const refreshedTokens = await refreshBackendToken(token.backendRefreshToken as string);
          token.backendAccessToken = refreshedTokens.accessToken;
          token.backendRefreshToken = refreshedTokens.refreshToken;
        } catch (error) {
          console.error("토큰 갱신 실패:", error);
          // 갱신 실패 시 기존 토큰 제거
          delete token.backendAccessToken;
          delete token.backendRefreshToken;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // 🎯 백엔드 JWT를 세션에 제공
      session.accessToken = token.backendAccessToken as string;
      session.refreshToken = token.backendRefreshToken as string;
      session.provider = token.provider as string;

      // 백엔드 토큰이 있는지 확인
      session.isBackendAuthenticated = !!token.backendAccessToken;

      return session;
    },

    // 🛡️ 로그인 성공 여부 제어 (선택사항)
    async signIn({ user, account, profile, email, credentials }) {
      // 모든 소셜 로그인 허용
      // 백엔드 연동 실패 시에도 NextAuth 로그인은 허용
      return true;
    },
  },

  // 🔧 NextAuth 설정
  session: {
    strategy: "jwt", // JWT 전략 사용
  },

  // 🎨 커스텀 페이지 (선택사항)
  pages: {
    signIn: "/auth/signin", // 커스텀 로그인 페이지
    error: "/auth/error", // 에러 페이지
  },
});

// 🔄 토큰 만료 확인 함수
function isTokenExpired(token: string | undefined): boolean {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
}

// 🔄 백엔드 토큰 갱신 함수
async function refreshBackendToken(refreshToken: string): Promise<BackendJWTResponse> {
  const response = await fetch(`${process.env.BACKEND_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`토큰 갱신 실패: ${response.status}`);
  }

  return response.json();
}

export { handler as GET, handler as POST };
