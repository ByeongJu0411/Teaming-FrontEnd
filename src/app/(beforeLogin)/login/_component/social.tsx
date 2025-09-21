// components/SocialLoginButton.tsx
"use client";

import styles from "./social.module.css";
import { RiKakaoTalkFill } from "react-icons/ri";
import { AiFillApple } from "react-icons/ai";
import { FaGoogle } from "react-icons/fa";
import { SiNaver } from "react-icons/si";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SocialLoginButton() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  // 로그인 성공 시 자동으로 메인 페이지로 이동
  useEffect(() => {
    if (status === "authenticated" && session) {
      console.log("✅ 로그인 성공 - 메인 페이지로 이동");
      console.log("🔐 백엔드 인증 상태:", session.isBackendAuthenticated);

      // 잠시 후 페이지 이동 (백엔드 토큰 발급 시간 고려)
      setTimeout(() => {
        router.push("/mainpage");
      }, 1000);
    }
  }, [status, session, router]);

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(provider);
    try {
      console.log(`🚀 ${provider} 로그인 시작`);

      // ✅ NextAuth가 전체 OAuth 플로우를 처리하도록 함
      // redirect: true로 설정하여 NextAuth 콜백 과정을 모두 거치도록 함
      const result = await signIn(provider, {
        callbackUrl: "/mainpage", // 최종 리다이렉트 URL
        redirect: true, // ⭐ 중요: NextAuth가 자동으로 콜백 처리하도록 함
      });

      // redirect: true일 때는 이 부분이 실행되지 않음
      // NextAuth가 자동으로 OAuth 플로우를 처리하고 콜백 URL로 리다이렉트
    } catch (error) {
      console.error("❌ 소셜 로그인 에러:", error);
      setIsLoading(null);
    }
  };

  // 로딩 중일 때 표시
  if (status === "loading") {
    return (
      <div className={styles.social_buttons}>
        <div className={styles.loading_message}>인증 상태 확인 중...</div>
      </div>
    );
  }

  // 이미 로그인된 상태일 때
  if (status === "authenticated") {
    return (
      <div className={styles.social_buttons}>
        <div className={styles.success_message}>✅ 로그인 성공! 메인 페이지로 이동 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.social_buttons}>
      {/* 카카오 로그인 버튼 */}
      <button
        className={`${styles.social_button} ${styles.kakao_button}`}
        onClick={() => handleSocialLogin("kakao")}
        disabled={!!isLoading}
      >
        {isLoading === "kakao" ? <div className={styles.loading_spinner} /> : <RiKakaoTalkFill />}
      </button>

      {/* 구글 로그인 버튼 */}
      <button
        className={`${styles.social_button} ${styles.google_button}`}
        onClick={() => handleSocialLogin("google")}
        disabled={!!isLoading}
      >
        {isLoading === "google" ? <div className={styles.loading_spinner} /> : <FaGoogle />}
      </button>

      {/* 네이버 로그인 버튼 */}
      <button
        className={`${styles.social_button} ${styles.naver_button}`}
        onClick={() => handleSocialLogin("naver")}
        disabled={!!isLoading}
      >
        {isLoading === "naver" ? <div className={styles.loading_spinner} /> : <SiNaver />}
      </button>

      {/* 애플 로그인 버튼 (미구현) */}
      <button
        className={`${styles.social_button} ${styles.apple_button}`}
        onClick={() => alert("Apple 로그인은 준비 중입니다")}
        disabled
      >
        <AiFillApple />
      </button>
    </div>
  );
}
