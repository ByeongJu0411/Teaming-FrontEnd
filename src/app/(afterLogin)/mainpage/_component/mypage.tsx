"use client";

import { JSX, useState } from "react";
import styles from "./mypage.module.css";

import ProfileSection from "./_mypage/profilesection";
import AccountSection from "./_mypage/accountsection";
import GifticonSection from "./_mypage/gifticonsection";
import GuideSection from "./_mypage/guidesection";
import LegalSection from "./_mypage/Legalsection";
import DangerSection from "./_mypage/dangersection";
import Terms from "./Terms";
import Privacy from "./Privacy";

export default function MyPage(): JSX.Element {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <div className={styles.mypage}>
        <p className={styles.title}>마이페이지</p>

        {/* 프로필 섹션 */}
        <ProfileSection />

        {/* 계정 설정 섹션 */}
        <AccountSection />

        {/* 기프티콘 관리 섹션 */}
        <GifticonSection />

        {/* 이용 안내 섹션 */}
        <GuideSection />

        {/* 법적 정보 섹션 */}
        <LegalSection onTermsClick={() => setShowTerms(true)} onPrivacyClick={() => setShowPrivacy(true)} />

        {/* 위험 구역 */}
        <DangerSection />
      </div>

      {/* 이용약관 오버레이 */}
      {showTerms && (
        <div className={styles.overlay} onClick={() => setShowTerms(false)}>
          <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
            <Terms onClose={() => setShowTerms(false)} />
          </div>
        </div>
      )}

      {/* 개인정보처리방침 오버레이 */}
      {showPrivacy && (
        <div className={styles.overlay} onClick={() => setShowPrivacy(false)}>
          <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
            <Privacy onClose={() => setShowPrivacy(false)} />
          </div>
        </div>
      )}
    </>
  );
}
