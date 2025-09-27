"use client";
import { useEffect } from "react";
import DarkVeil from "@/app/_component/DarkVeil";
import styles from "./fail.module.css";

export default function PaymentFail() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.close();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.container}>
      <DarkVeil />
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <svg className={styles.errorIcon} viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
            <circle className={styles.errorCircle} cx="26" cy="26" r="25" fill="none" />
            <path className={styles.errorLine1} fill="none" d="M16 16 L36 36" />
            <path className={styles.errorLine2} fill="none" d="M36 16 L16 36" />
          </svg>
        </div>
        <h1 className={styles.title}>결제 실패</h1>
        <p className={styles.description}>결제 처리 중 문제가 발생했습니다</p>
        <p className={styles.subText}>잠시 후 창이 자동으로 닫힙니다...</p>
      </div>
    </div>
  );
}
