import styles from "@/app/(afterLogin)/mainpage/_component/mypage.module.css";

export default function GuideSection() {
  return (
    <div className={styles.infoSection}>
      <div className={styles.sectionCard}>
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>🎁</span>
            <div className={styles.infoContent}>
              <p className={styles.infoTitle}>기프티콘 벌칙 시스템</p>
              <p className={styles.infoDescription}>과제 미제출이나 규칙 위반 시 자동으로 기프티콘이 발송됩니다.</p>
            </div>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>⏰</span>
            <div className={styles.infoContent}>
              <p className={styles.infoTitle}>기프티콘 유효기간</p>
              <p className={styles.infoDescription}>받은 기프티콘은 유효기간 내에 사용해주세요.</p>
            </div>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>📧</span>
            <div className={styles.infoContent}>
              <p className={styles.infoTitle}>이메일 인증 필수</p>
              <p className={styles.infoDescription}>티밍룸 생성 및 참여를 위해 이메일 인증이 필요합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
