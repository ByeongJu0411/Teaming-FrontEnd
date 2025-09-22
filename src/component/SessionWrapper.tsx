// component/SessionWrapper.tsx (기존 파일 확인 후 필요시 수정)
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionWrapperProps {
  children: ReactNode;
}

export default function SessionWrapper({ children }: SessionWrapperProps) {
  return (
    <SessionProvider
      // 세션 갱신 간격 설정 (기본: 24시간)
      refetchInterval={5 * 60} // 5분마다 세션 확인
      // 창이 포커스될 때 세션 갱신
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
