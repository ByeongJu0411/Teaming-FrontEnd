// components/SocialLoginButton.tsx
"use client";

import styles from "./social.module.css";
import { RiKakaoTalkFill } from "react-icons/ri";
import { AiFillApple } from "react-icons/ai";
import { FaGoogle } from "react-icons/fa";
import { SiNaver } from "react-icons/si";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";

export default function SocialLoginButton() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(provider);
    try {
      const result = await signIn(provider, {
        // 로그인 성공 시 리다이렉트할 페이지
        callbackUrl: "/mainpage", // 또는 원하는 페이지
        redirect: false, // false로 하면 수동으로 리다이렉트 처리 가능
      });

      if (result?.error) {
        console.error("로그인 실패:", result.error);
        // 에러 처리 (토스트 메시지 등)
      } else if (result?.ok) {
        console.log("로그인 성공!");
        // 성공 처리
        window.location.href = "/mainpage"; // 또는 router.push 사용
      }
    } catch (error) {
      console.error("소셜 로그인 에러:", error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className={styles.social_buttons}>
      <button
        className={`${styles.social_button} ${styles.kakao_button}`}
        onClick={() => handleSocialLogin("kakao")}
        disabled={isLoading === "kakao"}
      >
        {isLoading === "kakao" ? <div className={styles.loading_spinner} /> : <RiKakaoTalkFill />}
      </button>

      <button
        className={`${styles.social_button} ${styles.google_button}`}
        onClick={() => handleSocialLogin("google")}
        disabled={isLoading === "google"}
      >
        {isLoading === "google" ? <div className={styles.loading_spinner} /> : <FaGoogle />}
      </button>

      <button
        className={`${styles.social_button} ${styles.naver_button}`}
        onClick={() => handleSocialLogin("naver")}
        disabled={isLoading === "naver"}
      >
        {isLoading === "naver" ? <div className={styles.loading_spinner} /> : <SiNaver />}
      </button>

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
