"use client";

import styles from "./landingpage.module.css";
import Header from "./_component/header";
import Body from "./_component/body";
import Count from "./_component/count";
import Review from "./_component/review";
import ReviewList from "./_component/reviewlist";
import Footer from "./_component/footer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 페이지 제목 변경
    document.title = "Teaming";
  }, []);

  useEffect(() => {
    // ✅ 이미 로그인된 세션이 있으면 자동으로 mainpage로 이동
    if (status === "authenticated" && session) {
      console.log("✅ 기존 로그인 세션 감지됨, mainpage로 이동");
      router.push("/mainpage");
    }
  }, [status, session, router]);

  // 세션 확인 중일 때 로딩 표시 (선택사항)
  if (status === "loading") {
    return (
      <div className={styles.loadingScreen}>
        <p>로그인 상태 확인 중...</p>
      </div>
    );
  }

  // 로그인되지 않았으면 원래 랜딩 페이지 표시
  return (
    <>
      <div className={styles.container}>
        <Header />
        <Body />
        <Count />
        <Review />
        <ReviewList />
        <Footer />
      </div>
    </>
  );
}
