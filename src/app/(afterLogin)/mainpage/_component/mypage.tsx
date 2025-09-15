"use client";

import { JSX } from "react";
import styles from "./mypage.module.css";

import ProfileSection from "./_mypage/profilesection";
import AccountSection from "./_mypage/accountsection";
import GifticonSection from "./_mypage/gifticonsection";
import GuideSection from "./_mypage/guidesection";
import DangerSection from "./_mypage/dangersection";

export default function MyPage(): JSX.Element {
  return (
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

      {/* 위험 구역 */}
      <DangerSection />
    </div>
  );
}
