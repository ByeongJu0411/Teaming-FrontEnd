// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";

/**
 * 백엔드에서 반환하는 JWT 토큰 응답 타입
 */
interface BackendJWTResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  userId?: number;
}

/**
 * JWT 토큰의 만료 시간을 파싱하는 함수
 */
function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch (error) {
    console.error("JWT 토큰 파싱 실패:", error);
    return null;
  }
}

/**
 * JWT 토큰에서 userId를 추출하는 함수
 */
function extractUserIdFromToken(token: string): number | undefined {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const id = payload.userId || payload.sub || payload.id;
    return typeof id === "number" ? id : typeof id === "string" ? parseInt(id, 10) : undefined;
  } catch (error) {
    console.error("JWT userId 추출 실패:", error);
    return undefined;
  }
}

/**
 * 토큰 갱신 함수
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  console.log("=== 토큰 갱신 시작 ===");

  try {
    if (!token.backendRefreshToken) {
      console.error("Refresh Token이 없습니다.");
      throw new Error("No refresh token available");
    }

    const backendUrl = process.env.BACKEND_URL || "http://13.125.193.243:8080";
    console.log("토큰 갱신 백엔드 URL:", backendUrl);

    const response = await fetch(`${backendUrl}/api/auth/token/access-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.backendRefreshToken}`,
      },
      body: JSON.stringify({
        refreshToken: token.backendRefreshToken,
      }),
    });

    console.log("토큰 갱신 응답 상태:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("토큰 갱신 실패:", response.status, errorText);
      throw new Error("Token refresh failed");
    }

    const refreshedTokens: BackendJWTResponse = await response.json();
    console.log("토큰 갱신 성공");

    const tokenExpiration = getTokenExpiration(refreshedTokens.accessToken);
    const fallbackExpiration = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const userId = extractUserIdFromToken(refreshedTokens.accessToken);

    return {
      ...token,
      backendAccessToken: refreshedTokens.accessToken,
      backendRefreshToken: token.backendRefreshToken,
      backendTokenExpires: tokenExpiration || fallbackExpiration,
      userId: userId || token.userId,
      backendError: false,
    };
  } catch (error) {
    console.error("토큰 갱신 중 오류:", error);

    return {
      ...token,
      backendError: true,
      backendErrorMessage: error instanceof Error ? error.message : "Token refresh failed",
    };
  }
}

/**
 * NextAuth 설정 객체
 */
const handler = NextAuth({
  providers: [
    /**
     * 이메일/비밀번호 로그인을 위한 Credentials Provider
     */
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        accessToken: { label: "AccessToken", type: "text" },
        refreshToken: { label: "RefreshToken", type: "text" },
      },
      async authorize(credentials, req) {
        console.log("=== CREDENTIALS AUTHORIZE ===");

        if (!credentials?.email || !credentials?.password) {
          console.error("이메일 또는 비밀번호가 없습니다.");
          return null;
        }

        // 회원가입 후 자동 로그인: 토큰이 이미 있는 경우
        if (credentials.accessToken && credentials.refreshToken) {
          console.log("회원가입 후 자동 로그인: 백엔드에서 받은 토큰 사용");

          const userId = extractUserIdFromToken(credentials.accessToken);

          return {
            id: userId?.toString() || "temp-id",
            email: credentials.email,
            name: "사용자",
            accessToken: credentials.accessToken,
            refreshToken: credentials.refreshToken,
            userId: userId,
          };
        }

        // 일반 로그인: 백엔드 로그인 API 호출
        try {
          console.log("일반 로그인: 백엔드 로그인 API 호출");

          const backendUrl = process.env.BACKEND_URL || "http://13.125.193.243:8080";
          console.log("로그인 백엔드 URL:", `${backendUrl}/api/auth/teaming/sign-in`);

          const response = await fetch(`${backendUrl}/api/auth/teaming/sign-in`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          console.log("로그인 API 응답 상태:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("로그인 실패:", errorText);
            return null;
          }

          const loginResult = await response.json();
          console.log("로그인 성공");

          const userId = extractUserIdFromToken(loginResult.accessToken);

          return {
            id: userId?.toString() || "temp-id",
            email: credentials.email,
            name: loginResult.name || "사용자",
            accessToken: loginResult.accessToken,
            refreshToken: loginResult.refreshToken,
            userId: userId,
          };
        } catch (error) {
          console.error("로그인 API 호출 오류:", error);
          return null;
        }
      },
    }),
    /**
     * Google OAuth 제공자
     */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    /**
     * 카카오 OAuth 제공자
     */
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      profile(profile) {
        console.log("Kakao Profile:", profile);
        return {
          id: profile.id.toString(),
          name: profile.properties?.nickname || profile.kakao_account?.profile?.nickname || "카카오 사용자",
          email: profile.kakao_account?.email || "",
          image: profile.properties?.profile_image || profile.kakao_account?.profile?.profile_image_url || "",
        };
      },
    }),

    /**
     * 네이버 OAuth 제공자
     */
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
      profile(profile) {
        console.log("Naver Profile:", profile);
        return {
          id: profile.response.id,
          name: profile.response.name || profile.response.nickname || "네이버 사용자",
          email: profile.response.email || "",
          image: profile.response.profile_image || "",
        };
      },
    }),
  ],

  debug: true,

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("=== SIGNIN CALLBACK ===");
      console.log("Provider:", account?.provider);
      console.log("User:", {
        id: user.id,
        name: user.name,
        email: user.email,
      });

      return true;
    },

    async jwt({ token, account, profile, user, trigger }) {
      console.log("=== JWT CALLBACK START ===");
      console.log("Trigger:", trigger);
      console.log("Account:", account ? `${account.provider} - ${account.type}` : "없음");

      // 초기 로그인 시 사용자 정보를 토큰에 저장
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;

        // Credentials Provider에서 온 경우 백엔드 토큰 저장
        if (user.accessToken && user.refreshToken) {
          console.log("Credentials 로그인: 백엔드 토큰 저장");

          const tokenExpiration = getTokenExpiration(user.accessToken);
          const fallbackExpiration = Date.now() + 7 * 24 * 60 * 60 * 1000;
          const userId = typeof user.userId === "number" ? user.userId : extractUserIdFromToken(user.accessToken);

          token.backendAccessToken = user.accessToken;
          token.backendRefreshToken = user.refreshToken;
          token.backendTokenExpires = tokenExpiration || fallbackExpiration;
          token.userId = userId;
          token.provider = "credentials";
          token.backendError = false;

          console.log("백엔드 토큰 저장 완료, userId:", userId);
        }
      }

      /**
       * 토큰 만료 체크 및 자동 갱신
       */
      if (!account && token.backendAccessToken && token.backendTokenExpires) {
        const now = Date.now();
        const timeUntilExpiry = (token.backendTokenExpires as number) - now;
        const fiveMinutes = 5 * 60 * 1000;

        console.log(`토큰 만료까지: ${Math.floor(timeUntilExpiry / 60000)}분`);

        if (timeUntilExpiry < fiveMinutes) {
          console.log("토큰 갱신이 필요합니다.");
          return await refreshAccessToken(token);
        }
      }

      /**
       * 초기 소셜 로그인 시 백엔드 JWT 토큰 교환
       */
      if (account && account.provider !== "credentials") {
        console.log("=== 소셜 로그인 백엔드 토큰 교환 시작 ===");
        console.log("소셜 OAuth Account 정보:", {
          provider: account.provider,
          type: account.type,
          access_token: account.access_token ? "존재" : "없음",
        });

        try {
          let endpoint = "";
          switch (account.provider) {
            case "google":
              endpoint = "/api/auth/web/google";
              break;
            case "kakao":
              endpoint = "/api/auth/web/kakao";
              break;
            case "naver":
              endpoint = "/api/auth/web/naver";
              break;
            default:
              console.error("지원하지 않는 제공자:", account.provider);
              token.backendError = true;
              token.backendErrorMessage = `지원하지 않는 제공자: ${account.provider}`;
              return token;
          }

          const backendUrl = process.env.BACKEND_URL || "http://13.125.193.243:8080";
          const fullUrl = `${backendUrl}${endpoint}`;

          console.log("=== 백엔드 토큰 교환 요청 ===");
          console.log("Provider:", account.provider);
          console.log("Endpoint:", endpoint);
          console.log("Full URL:", fullUrl);
          console.log("Access Token 존재:", !!account.access_token);

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

          console.log("백엔드 응답 상태:", response.status, response.statusText);

          const responseText = await response.text();
          console.log("백엔드 응답 본문 (첫 200자):", responseText.substring(0, 200));

          if (response.ok) {
            try {
              const backendTokens: BackendJWTResponse = JSON.parse(responseText);
              console.log("✅ 백엔드 JWT 파싱 성공");
              console.log("- accessToken 존재:", !!backendTokens.accessToken);
              console.log("- refreshToken 존재:", !!backendTokens.refreshToken);

              const tokenExpiration = getTokenExpiration(backendTokens.accessToken);
              const fallbackExpiration = Date.now() + (backendTokens.expiresIn || 7 * 24 * 60 * 60) * 1000;
              const userId = backendTokens.userId || extractUserIdFromToken(backendTokens.accessToken);

              token.backendAccessToken = backendTokens.accessToken;
              token.backendRefreshToken = backendTokens.refreshToken;
              token.backendTokenExpires = tokenExpiration || fallbackExpiration;
              token.userId = userId;
              token.provider = account.provider;
              token.backendError = false;

              console.log("백엔드 토큰 저장 완료:");
              console.log("- userId:", userId);
              console.log("- provider:", account.provider);
              console.log("- tokenExpires:", new Date(token.backendTokenExpires as number).toLocaleString());
            } catch (parseError) {
              console.error("❌ JSON 파싱 실패:", parseError);
              console.error("응답 전체:", responseText);

              token.provider = account.provider;
              token.backendError = true;
              token.backendErrorMessage = `JSON 파싱 실패: ${
                parseError instanceof Error ? parseError.message : String(parseError)
              }`;
            }
          } else {
            console.error(`❌ 백엔드 API 실패 (${response.status}):`, responseText);

            token.provider = account.provider;
            token.backendError = true;
            token.backendErrorStatus = response.status;
            token.backendErrorMessage = responseText || `HTTP ${response.status} ${response.statusText}`;
          }
        } catch (error) {
          console.error("❌ 백엔드 API 호출 중 네트워크 오류:", error);
          console.error("오류 상세:", {
            name: error instanceof Error ? error.name : "Unknown",
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack?.substring(0, 200) : "No stack",
          });

          token.provider = account.provider;
          token.backendError = true;
          token.networkError = true;
          token.backendErrorMessage = error instanceof Error ? error.message : String(error);
        }

        console.log("=== 소셜 로그인 토큰 교환 완료 ===");
      }

      console.log("=== JWT CALLBACK END ===");
      console.log("최종 토큰 상태:", {
        hasBackendToken: !!token.backendAccessToken,
        hasError: !!token.backendError,
        errorMessage: token.backendErrorMessage || "없음",
        provider: token.provider,
        userId: token.userId,
        userName: token.name,
        tokenExpires: token.backendTokenExpires
          ? new Date(token.backendTokenExpires as number).toLocaleString()
          : "N/A",
      });

      return token;
    },

    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");

      // 사용자 정보를 세션에 추가
      session.user.id = token.id as string;
      session.user.name = (token.name as string) || "";
      session.user.email = (token.email as string) || "";
      session.user.image = token.image as string;

      // 백엔드 관련 정보를 세션에 추가
      session.accessToken = token.backendAccessToken as string;
      session.refreshToken = token.backendRefreshToken as string;
      session.userId = typeof token.userId === "number" ? token.userId : undefined;
      session.provider = token.provider as string;
      session.isBackendAuthenticated = !!token.backendAccessToken && !token.backendError;
      session.tokenExpires = token.backendTokenExpires as number;

      // 백엔드 에러 정보가 있는 경우 세션에 포함
      if (token.backendError) {
        session.backendError = {
          hasError: true,
          status: (token.backendErrorStatus as number) || 500,
          message: (token.backendErrorMessage as string) || "Unknown error",
          isNetworkError: !!token.networkError,
        };
      }

      console.log("세션 생성 완료:", {
        isBackendAuthenticated: session.isBackendAuthenticated,
        hasBackendError: !!token.backendError,
        userId: session.userId,
        provider: session.provider,
        userName: session.user.name,
      });

      return session;
    },
  },

  events: {
    async signOut({ token }) {
      console.log("=== SIGNOUT EVENT ===");

      if (token.backendAccessToken) {
        try {
          const backendUrl = process.env.BACKEND_URL || "http://13.125.193.243:8080";
          await fetch(`${backendUrl}/api/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token.backendAccessToken}`,
              "Content-Type": "application/json",
            },
          });
          console.log("백엔드 로그아웃 완료");
        } catch (error) {
          console.error("백엔드 로그아웃 실패:", error);
        }
      }
    },

    async session({ session, token }) {
      if (session.tokenExpires) {
        const timeLeft = session.tokenExpires - Date.now();
        if (timeLeft < 10 * 60 * 1000 && timeLeft > 0) {
          console.warn(`⚠️ 토큰이 ${Math.floor(timeLeft / 60000)}분 후 만료됩니다.`);
        }
      }
    },
  },
});

export { handler as GET, handler as POST };
