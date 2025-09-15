"use client";

import styles from "./login.module.css";
import DarkVeil from "@/app/_component/DarkVeil";
import Link from "next/link";
import SocialLoginButton from "./_component/social";
import LoginForm from "./_component/loginform";
export default function LoginPage() {
  return (
    <>
      {/* 애니메이션 배경 */}
      <div className={styles.backgroundContainer}>
        <DarkVeil />
      </div>

      {/* 메인 컨텐츠 컨테이너 */}
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <p className={styles.header_name}>Teaming</p>
            <Link href="/" className={styles.header_back}>
              돌아가기
            </Link>
          </div>
          <LoginForm />
          <div className={styles.divider}>
            <div className={styles.divider_line}></div>
            <span className={styles.divider_text}>또는 아래 소셜 계정으로 로그인</span>
            <div className={styles.divider_line}></div>
          </div>

          <SocialLoginButton />
        </div>
      </div>
    </>
  );
}
