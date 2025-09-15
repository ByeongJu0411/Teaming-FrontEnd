import styles from "@/app/(afterLogin)/mainpage/_component/mypage.module.css";
import Link from "next/link";

export default function DangerSection() {
  return (
    <div className={styles.dangerSection}>
      <div className={styles.sectionCard}>
        <h3 className={styles.dangerTitle}>계정 관리</h3>

        <Link href="/" className={styles.logoutBtn}>
          로그아웃
        </Link>

        <button className={styles.deleteAccountBtn} type="button">
          회원탈퇴
        </button>
      </div>
    </div>
  );
}
