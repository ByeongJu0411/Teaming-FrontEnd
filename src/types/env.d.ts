// types/env.d.ts 파일 생성
declare namespace NodeJS {
  interface ProcessEnv {
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    BACKEND_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    KAKAO_CLIENT_ID: string;
    KAKAO_CLIENT_SECRET: string;
    NAVER_CLIENT_ID: string;
    NAVER_CLIENT_SECRET: string;
  }
}
