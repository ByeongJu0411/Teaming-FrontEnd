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
    // Apple은 좀 더 복잡한 설정이 필요해서 일단 제외
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 소셜 로그인 성공 시 토큰 정보 저장
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // 세션에 토큰 정보 포함
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      session.providerAccountId = token.providerAccountId as string;
      return session;
    },
    async signIn({ user, account, profile }) {
      // 소셜 로그인 성공 후 백엔드로 토큰 전송
      try {
        const response = await fetch(`${process.env.BACKEND_URL}/auth/social-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: account?.provider,
            accessToken: account?.access_token,
            refreshToken: account?.refresh_token,
            userInfo: {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            },
          }),
        });

        if (response.ok) {
          const backendData = await response.json();
          // 백엔드에서 받은 JWT 토큰 등을 저장할 수 있어요
          return true;
        }
        return false;
      } catch (error) {
        console.error("백엔드 로그인 에러:", error);
        return false;
      }
    },
  },
});

export { handler as GET, handler as POST };
