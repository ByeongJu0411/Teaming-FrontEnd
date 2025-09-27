"use client";
import { useEffect } from "react";
import DarkVeil from "@/app/_component/DarkVeil";
import styles from "./success.module.css";

export default function PaymentSuccess() {
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
          <svg className={styles.checkIcon} viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
            <circle className={styles.checkCircle} cx="26" cy="26" r="25" fill="none" />
            <path className={styles.checkMark} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <h1 className={styles.title}>결제 성공!</h1>
        <p className={styles.description}>결제가 성공적으로 완료되었습니다</p>
        <p className={styles.subText}>잠시 후 창이 자동으로 닫힙니다...</p>
      </div>
    </div>
  );
}
