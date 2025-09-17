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
  // 🔍 NextAuth가 자동으로 관리하는 세션 정보 가져오기
  // - 로그인 상태, 사용자 정보, 토큰 등을 포함
  const { data: session, status } = useSession();

  // 🔄 로딩 상태 관리 (어떤 소셜 버튼이 로딩 중인지)
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(provider);
    try {
      // 🚀 NextAuth의 signIn 함수 호출
      // NextAuth가 자동으로 처리하는 것들:
      // 1. 해당 소셜 플랫폼(구글, 카카오 등)의 OAuth 페이지로 리다이렉트
      // 2. 사용자가 로그인하면 authorization code 받기
      // 3. authorization code를 access token으로 교환
      // 4. 사용자 정보 가져오기
      // 5. NextAuth 세션에 정보 저장
      const result = await signIn(provider, {
        // ✅ 로그인 성공 시 자동으로 이동할 페이지
        callbackUrl: "/mainpage",

        // ❌ 자동 리다이렉트 비활성화 (수동으로 처리하기 위해)
        redirect: false,
      });

      // 🚨 NextAuth에서 반환하는 결과 처리
      if (result?.error) {
        console.error("로그인 실패:", result.error);
        // 에러 처리 (토스트 메시지 등)
      } else if (result?.ok) {
        console.log("로그인 성공!");
        // ⚠️ 현재 문제점: 여기서 바로 페이지 이동하면
        // 백엔드 JWT 발급 과정이 빠짐!
        window.location.href = "/mainpage";
      }
    } catch (error) {
      console.error("소셜 로그인 에러:", error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className={styles.social_buttons}>
      {/* 🟡 카카오 로그인 버튼 */}
      <button
        className={`${styles.social_button} ${styles.kakao_button}`}
        onClick={() => handleSocialLogin("kakao")}
        disabled={isLoading === "kakao"}
      >
        {isLoading === "kakao" ? <div className={styles.loading_spinner} /> : <RiKakaoTalkFill />}
      </button>

      {/* 🔴 구글 로그인 버튼 */}
      <button
        className={`${styles.social_button} ${styles.google_button}`}
        onClick={() => handleSocialLogin("google")}
        disabled={isLoading === "google"}
      >
        {isLoading === "google" ? <div className={styles.loading_spinner} /> : <FaGoogle />}
      </button>

      {/* 🟢 네이버 로그인 버튼 */}
      <button
        className={`${styles.social_button} ${styles.naver_button}`}
        onClick={() => handleSocialLogin("naver")}
        disabled={isLoading === "naver"}
      >
        {isLoading === "naver" ? <div className={styles.loading_spinner} /> : <SiNaver />}
      </button>

      {/* ⚫ 애플 로그인 버튼 (미구현) */}
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

/* 
🔥 현재 코드의 핵심 문제점:

1. ❌ 구글 토큰 → 백엔드 JWT 변환 로직 없음
   → NextAuth callbacks에서 백엔드 API 호출 필요

2. ❌ 로그인 성공 후 바로 페이지 이동
   → 백엔드 JWT 발급 완료를 기다려야 함

NextAuth가 자동으로 해주는 것:
✅ OAuth 리다이렉트 URL 생성
✅ 사용자를 소셜 플랫폼으로 리다이렉트
✅ Authorization Code 받기
✅ Access Token 교환
✅ 사용자 정보 조회
✅ 세션 관리

아직 구현 필요한 것:
❌ 소셜 토큰 → 백엔드 JWT 변환
❌ 백엔드 JWT를 세션에 저장
❌ API 호출 시 백엔드 JWT 사용
*/
