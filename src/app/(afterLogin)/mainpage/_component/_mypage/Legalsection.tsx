"use client";

import { JSX } from "react";
import styles from "../mypage.module.css";

interface LegalSectionProps {
  onTermsClick: () => void;
  onPrivacyClick: () => void;
}

export default function LegalSection({ onTermsClick, onPrivacyClick }: LegalSectionProps): JSX.Element {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>법적 정보</h2>
      </div>

      <div className={styles.legalSection}>
        <div className={styles.legalList}>
          <div onClick={onTermsClick} className={styles.legalItem}>
            <div className={styles.legalInfo}>
              <span className={styles.legalIcon}>📋</span>
              <div className={styles.legalText}>
                <h3 className={styles.legalTitle}>이용약관</h3>
                <p className={styles.legalDescription}>서비스 이용에 관한 약관을 확인하세요</p>
              </div>
            </div>
            <span className={styles.legalArrow}>›</span>
          </div>

          <div onClick={onPrivacyClick} className={styles.legalItem}>
            <div className={styles.legalInfo}>
              <span className={styles.legalIcon}>🔒</span>
              <div className={styles.legalText}>
                <h3 className={styles.legalTitle}>개인정보 처리방침</h3>
                <p className={styles.legalDescription}>개인정보 보호 및 처리 방침을 확인하세요</p>
              </div>
            </div>
            <span className={styles.legalArrow}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}
