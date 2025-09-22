/**
 * NextAuth 설정 파일
 *
 * 이 파일은 NextAuth를 사용한 소셜 로그인과 백엔드 JWT 토큰 관리를 위한
 * 핵심 설정을 담고 있습니다.
 *
 * 주요 기능:
 * 1. 소셜 로그인 제공자 설정 (Google, Kakao, Naver)
 * 2. 백엔드 서버와의 JWT 토큰 교환
 * 3. 토큰 자동 갱신 처리
 * 4. 세션 관리
 */

// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import { JWT } from "next-auth/jwt";

/**
 * 백엔드에서 반환하는 JWT 토큰 응답 타입
 */
interface BackendJWTResponse {
  accessToken: string; // 백엔드 JWT 액세스 토큰
  refreshToken: string; // 백엔드 JWT 리프레시 토큰
  expiresIn?: number; // 토큰 만료 시간 (초 단위, 선택적)
}

/**
 * JWT 토큰의 만료 시간을 파싱하는 함수
 *
 * JWT는 세 부분으로 구성됩니다: header.payload.signature
 * payload 부분에는 토큰의 만료 시간(exp)이 포함되어 있습니다.
 *
 * @param token - JWT 토큰 문자열
 * @returns 만료 시간 (밀리초) 또는 null (파싱 실패 시)
 */
function getTokenExpiration(token: string): number | null {
  try {
    // JWT의 두 번째 부분(payload)을 base64 디코딩
    const payload = JSON.parse(atob(token.split(".")[1]));

    // exp 필드가 있으면 초 단위를 밀리초로 변환하여 반환
    return payload.exp ? payload.exp * 1000 : null;
  } catch (error) {
    console.error("JWT 토큰 파싱 실패:", error);
    return null;
  }
}

/**
 * 토큰 갱신 함수
 *
 * refresh token을 사용하여 새로운 access token을 받아오는 함수입니다.
 * 토큰이 만료되기 전에 자동으로 호출되어 seamless한 사용자 경험을 제공합니다.
 *
 * @param token - 현재 JWT 토큰 객체
 * @returns 갱신된 JWT 토큰 객체
 */

async function refreshAccessToken(token: JWT): Promise<JWT> {
  console.log("=== 토큰 갱신 시작 ===");

  try {
    // refresh token이 없으면 갱신 불가
    if (!token.backendRefreshToken) {
      console.error("Refresh Token이 없습니다.");
      throw new Error("No refresh token available");
    }

    const backendUrl = process.env.BACKEND_URL || "http://13.125.193.243:8080";

    // 명세서에 따른 정확한 요청
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
      console.error("토큰 갱신 실패:", response.status, await response.text());
      throw new Error("Token refresh failed");
    }

    const refreshedTokens: BackendJWTResponse = await response.json();
    console.log("토큰 갱신 성공");

    // 명세서 응답에는 accessToken만 있으므로 refreshToken은 기존 것 유지
    // expiresIn은 명세서에 없으므로 JWT에서 추출하거나 기본값 사용
    const tokenExpiration = getTokenExpiration(refreshedTokens.accessToken);
    const fallbackExpiration = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7일

    return {
      ...token,
      backendAccessToken: refreshedTokens.accessToken,
      // refreshToken은 명세서 응답에 없으므로 기존 것 유지
      backendRefreshToken: token.backendRefreshToken,
      backendTokenExpires: tokenExpiration || fallbackExpiration,
      backendError: false,
    };
  } catch (error) {
    console.error("토큰 갱신 중 오류:", error);

    // 갱신 실패 시 에러 상태로 마킹
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
  /**
   * 소셜 로그인 제공자 설정
   * 각 제공자는 클라이언트 ID와 시크릿이 필요합니다.
   */
  providers: [
    /**
     * Google OAuth 제공자
     * Google은 표준적인 사용자 정보를 제공하므로 추가 profile 함수가 불필요합니다.
     */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    /**
     * 카카오 OAuth 제공자
     * 카카오는 고유한 사용자 정보 구조를 가지므로 profile 함수로 표준화합니다.
     */
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,

      /**
       * 카카오 사용자 정보를 표준 형태로 변환
       * @param profile - 카카오에서 받은 원본 프로필 정보
       * @returns 표준화된 사용자 정보
       */
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
     * 네이버도 고유한 사용자 정보 구조를 가지므로 profile 함수로 표준화합니다.
     */
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,

      /**
       * 네이버 사용자 정보를 표준 형태로 변환
       * @param profile - 네이버에서 받은 원본 프로필 정보
       * @returns 표준화된 사용자 정보
       */
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

  /**
   * 디버그 모드 활성화
   * 개발 중에는 true로 설정하여 상세한 로그를 확인할 수 있습니다.
   */
  debug: true,

  /**
   * 세션 설정
   */
  session: {
    strategy: "jwt", // JWT 기반 세션 사용
    maxAge: 7 * 24 * 60 * 60, // 세션 최대 지속 시간: 7일
    updateAge: 24 * 60 * 60, // 세션 업데이트 주기: 24시간
  },

  /**
   * 콜백 함수들
   * NextAuth의 인증 플로우 중 특정 시점에 실행되는 함수들입니다.
   */
  callbacks: {
    /**
     * 로그인 시도 시 호출되는 콜백
     * 로그인을 허용할지 거부할지 결정합니다.
     *
     * @param user - 사용자 정보
     * @param account - OAuth 계정 정보
     * @param profile - 제공자에서 받은 프로필 정보
     * @returns true면 로그인 허용, false면 거부
     */
    async signIn({ user, account, profile }) {
      console.log("=== SIGNIN CALLBACK ===");
      console.log("Provider:", account?.provider);
      console.log("User:", {
        id: user.id,
        name: user.name,
        email: user.email,
      });
      console.log("Original Profile:", profile);

      // 현재는 모든 로그인을 허용
      return true;
    },

    /**
     * JWT 토큰 생성/수정 시 호출되는 콜백
     * 이 함수는 세션이 체크될 때마다 실행되며, 토큰 갱신 로직의 핵심입니다.
     *
     * @param token - 현재 JWT 토큰
     * @param account - OAuth 계정 정보 (초기 로그인 시에만 존재)
     * @param profile - 제공자 프로필 정보 (초기 로그인 시에만 존재)
     * @param user - 사용자 정보 (초기 로그인 시에만 존재)
     * @param trigger - 콜백이 호출된 이유
     * @returns 수정된 JWT 토큰
     */
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
      }

      /**
       * 토큰 만료 체크 및 자동 갱신
       * 초기 로그인이 아닌 경우(account가 없는 경우)에만 실행
       */
      if (!account && token.backendAccessToken && token.backendTokenExpires) {
        const now = Date.now();
        const timeUntilExpiry = (token.backendTokenExpires as number) - now;
        const fiveMinutes = 5 * 60 * 1000; // 5분을 밀리초로 변환

        console.log(`토큰 만료까지: ${Math.floor(timeUntilExpiry / 60000)}분`);

        // 토큰이 5분 이내에 만료되거나 이미 만료된 경우 갱신 시도
        if (timeUntilExpiry < fiveMinutes) {
          console.log("토큰 갱신이 필요합니다.");
          return await refreshAccessToken(token);
        }
      }

      /**
       * 초기 로그인 시 백엔드 JWT 토큰 교환
       * OAuth 토큰을 백엔드 JWT 토큰으로 교환하는 과정
       */
      if (account) {
        console.log("OAuth Account 정보:", {
          provider: account.provider,
          type: account.type,
          access_token: account.access_token ? "존재" : "없음",
        });

        try {
          // 제공자별 백엔드 API 엔드포인트 결정
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
              return token;
          }

          const backendUrl = process.env.BACKEND_URL || "http://13.125.193.243:8080";
          const fullUrl = `${backendUrl}${endpoint}`;

          console.log("백엔드 요청 URL:", fullUrl);

          // 백엔드에 보낼 요청 데이터
          const requestBody = {
            accessToken: account.access_token,
          };

          console.log("요청 데이터:", {
            accessToken: account.access_token?.substring(0, 20) + "...",
          });

          // 백엔드 API 호출
          const response = await fetch(fullUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(requestBody),
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

              // JWT 토큰에서 만료 시간 추출 시도
              const tokenExpiration = getTokenExpiration(backendTokens.accessToken);
              // 만료 시간 추출 실패 시 기본값 사용 (7일)
              const fallbackExpiration = Date.now() + (backendTokens.expiresIn || 7 * 24 * 60 * 60) * 1000;

              // 백엔드 토큰 정보를 JWT 토큰에 저장
              token.backendAccessToken = backendTokens.accessToken;
              token.backendRefreshToken = backendTokens.refreshToken;
              token.backendTokenExpires = tokenExpiration || fallbackExpiration;
              token.provider = account.provider;
              token.backendError = false;

              console.log("백엔드 토큰 저장 완료");
              console.log("토큰 만료 시간:", new Date(token.backendTokenExpires).toLocaleString());
            } catch (parseError) {
              console.error("JSON 파싱 실패:", parseError);
              console.error("응답 내용:", responseText);
              token.backendError = true;
            }
          } else {
            // 백엔드 API 호출 실패 시 에러 처리
            console.error(`백엔드 API 실패 (${response.status}):`, responseText);

            // 상태 코드별 상세 에러 메시지
            switch (response.status) {
              case 400:
                console.error("잘못된 요청 - 요청 Body 형식을 확인하세요");
                console.error("현재 요청:", JSON.stringify(requestBody, null, 2));
                break;
              case 401:
                console.error("인증 실패 - accessToken이 유효하지 않습니다");
                break;
              case 404:
                console.error("API 엔드포인트를 찾을 수 없습니다:", fullUrl);
                break;
              case 500:
                console.error("백엔드 서버 내부 오류");
                break;
              default:
                console.error("알 수 없는 오류");
            }

            // 에러 정보를 토큰에 저장
            token.provider = account.provider;
            token.backendError = true;
            token.backendErrorStatus = response.status;
            token.backendErrorMessage = responseText;
          }
        } catch (error) {
          // 네트워크 오류 등 예외 상황 처리
          console.error("백엔드 API 호출 중 네트워크 오류:", error);

          if (error instanceof TypeError && error.message.includes("fetch")) {
            console.error("네트워크 연결 실패 - 백엔드 서버가 실행 중인지 확인하세요");
          }

          // 네트워크 에러 정보를 토큰에 저장
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
        userName: token.name,
        tokenExpires: token.backendTokenExpires
          ? new Date(token.backendTokenExpires as number).toLocaleString()
          : "N/A",
      });

      return token;
    },

    /**
     * 세션 객체 생성 시 호출되는 콜백
     * JWT 토큰의 정보를 클라이언트에서 접근 가능한 세션 객체로 변환합니다.
     *
     * 보안상 민감한 정보(refresh token 등)는 세션에 포함하지 않는 것이 좋습니다.
     *
     * @param session - 현재 세션 객체
     * @param token - JWT 토큰
     * @returns 수정된 세션 객체
     */
    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");

      // 사용자 정보를 세션에 추가
      if (token.name) session.user.name = token.name as string;
      if (token.email) session.user.email = token.email as string;
      if (token.image) session.user.image = token.image as string;
      if (token.id) session.user.id = token.id as string;

      // 백엔드 관련 정보를 세션에 추가
      session.accessToken = token.backendAccessToken as string;
      session.refreshToken = token.backendRefreshToken as string; // 주의: 보안상 위험할 수 있음
      session.provider = token.provider as string;
      session.isBackendAuthenticated = !!token.backendAccessToken && !token.backendError;
      session.tokenExpires = token.backendTokenExpires as number;

      // 백엔드 에러 정보가 있는 경우 세션에 포함
      if (token.backendError) {
        const sessionWithError = session as typeof session & {
          backendError?: {
            hasError: boolean;
            status: number;
            message: string;
            isNetworkError: boolean;
          };
        };

        sessionWithError.backendError = {
          hasError: true,
          status: token.backendErrorStatus as number,
          message: token.backendErrorMessage as string,
          isNetworkError: !!token.networkError,
        };
      }

      console.log("세션 생성 완료:", {
        isBackendAuthenticated: session.isBackendAuthenticated,
        hasBackendError: !!token.backendError,
        provider: session.provider,
        userName: session.user.name,
        tokenExpires: session.tokenExpires ? new Date(session.tokenExpires).toLocaleString() : "N/A",
      });

      return session;
    },
  },

  /**
   * 이벤트 핸들러
   * 특정 인증 이벤트가 발생했을 때 실행되는 함수들입니다.
   */
  events: {
    /**
     * 로그아웃 시 호출되는 이벤트
     * 백엔드에도 로그아웃을 알려 토큰을 무효화합니다.
     *
     * @param token - 로그아웃하는 사용자의 JWT 토큰
     */
    async signOut({ token }) {
      console.log("=== SIGNOUT EVENT ===");

      // 백엔드에 로그아웃 알림
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
          // 로그아웃 실패해도 클라이언트 로그아웃은 진행
        }
      }
    },

    /**
     * 세션이 업데이트될 때 호출되는 이벤트
     * 토큰 만료 예정 시 경고 메시지를 출력합니다.
     *
     * @param session - 업데이트된 세션
     * @param token - JWT 토큰
     */
    async session({ session, token }) {
      // 토큰 만료 예정 알림 (10분 이내)
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

/**
 * 사용법 및 주의사항:
 *
 * 1. 환경 변수 설정 필요:
 *    - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *    - KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET
 *    - NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
 *    - BACKEND_URL
 *    - NEXTAUTH_SECRET, NEXTAUTH_URL
 *
 * 2. 백엔드 API 엔드포인트 필요:
 *    - POST /api/auth/web/google
 *    - POST /api/auth/web/kakao
 *    - POST /api/auth/web/naver
 *    - POST /api/auth/refresh
 *    - POST /api/auth/logout
 *
 * 3. 토큰 갱신 플로우:
 *    - 토큰 만료 5분 전에 자동 갱신 시도
 *    - 갱신 실패 시 사용자를 로그인 페이지로 리다이렉트
 *
 * 4. 보안 고려사항:
 *    - refresh token을 세션에 포함하는 것은 보안상 위험할 수 있음
 *    - 프로덕션에서는 refresh token을 HttpOnly 쿠키에 저장하는 것을 고려
 *    - 토큰 만료 시간을 적절히 설정하여 보안과 사용성의 균형 유지
 */
