/* eslint-disable @next/next/no-img-element */
"use client";

import { JSX, useState } from "react";
import styles from "./mypage.module.css";
import Link from "next/link";

interface UserInfo {
  email: string;
  nickname: string;
  profileImage: string;
  joinDate: string;
  emailVerified: boolean;
}

interface Gifticon {
  id: string;
  type: "메가커피" | "스타벅스";
  name: string;
  description: string;
  receivedDate: string;
  isUsed: boolean;
  expiryDate: string;
  barcode: string;
  icon: string;
}

export default function MyPage(): JSX.Element {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: "user@example.com",
    nickname: "티밍유저",
    profileImage: "/images/default-avatar.png",
    joinDate: "2024.03.15",
    emailVerified: true,
  });

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editNickname, setEditNickname] = useState<string>(userInfo.nickname);

  // 기프티콘 목록 상태
  const [gifticons, setGifticons] = useState<Gifticon[]>([
    {
      id: "1",
      type: "메가커피",
      name: "아이스 아메리카노",
      description: "메가커피 아이스 아메리카노 1개",
      receivedDate: "2024.09.08",
      isUsed: false,
      expiryDate: "2024.12.31",
      barcode: "1234567890123",
      icon: "/megacoffe.webp",
    },
    {
      id: "2",
      type: "스타벅스",
      name: "아이스 아메리카노",
      description: "스타벅스 아이스 아메리카노 1개",
      receivedDate: "2024.09.05",
      isUsed: true,
      expiryDate: "2024.12.31",
      barcode: "9876543210987",
      icon: "/starbucks.png",
    },
    {
      id: "3",
      type: "스타벅스",
      name: "아이스 음료 + 크루아상 세트",
      description: "스타벅스 아이스 음료 1개 + 프렌치 크루아상",
      receivedDate: "2024.09.01",
      isUsed: false,
      expiryDate: "2024.12.31",
      barcode: "5678901234567",
      icon: "/starbucks.png",
    },
  ]);

  const [selectedTab, setSelectedTab] = useState<"all" | "unused" | "used">("all");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPasswordChange, setShowPasswordChange] = useState<boolean>(false);

  const [newEmail, setNewEmail] = useState<string>("");
  const [emailVerificationCode, setEmailVerificationCode] = useState<string>("");
  const [isEmailCodeSent, setIsEmailCodeSent] = useState<boolean>(false);
  const [showEmailChange, setShowEmailChange] = useState<boolean>(false);

  const handleEditToggle = (): void => {
    if (isEditMode) {
      // 저장 로직
      setUserInfo({ ...userInfo, nickname: editNickname });
      console.log("닉네임 변경:", editNickname);
    }
    setIsEditMode(!isEditMode);
  };

  const handleEmailChange = (): void => {
    if (!newEmail) {
      alert("새 이메일을 입력해주세요.");
      return;
    }

    // 이메일 인증번호 발송 API 호출
    console.log(`인증번호를 ${newEmail}로 발송합니다.`);
    setIsEmailCodeSent(true);
    alert("인증번호가 발송되었습니다!");
  };

  const handleEmailVerify = (): void => {
    if (!emailVerificationCode) {
      alert("인증번호를 입력해주세요.");
      return;
    }

    // 임시로 "123456"을 정답으로 설정
    if (emailVerificationCode === "123456") {
      setUserInfo({ ...userInfo, email: newEmail });
      setNewEmail("");
      setEmailVerificationCode("");
      setIsEmailCodeSent(false);
      setShowEmailChange(false);
      alert("이메일이 변경되었습니다!");
    } else {
      alert("인증번호가 올바르지 않습니다.");
    }
  };

  const handlePasswordChange = (): void => {
    if (newPassword !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    // 비밀번호 변경 API 호출
    console.log("비밀번호 변경");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordChange(false);
    alert("비밀번호가 변경되었습니다.");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserInfo({ ...userInfo, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // 기프티콘 사용 처리
  const handleUseGifticon = (id: string): void => {
    setGifticons(gifticons.map((gift) => (gift.id === id ? { ...gift, isUsed: true } : gift)));
    alert("기프티콘이 사용 처리되었습니다.");
  };

  // 기프티콘 필터링
  const getFilteredGifticons = (): Gifticon[] => {
    switch (selectedTab) {
      case "unused":
        return gifticons.filter((gift) => !gift.isUsed);
      case "used":
        return gifticons.filter((gift) => gift.isUsed);
      default:
        return gifticons;
    }
  };

  const unusedCount = gifticons.filter((gift) => !gift.isUsed).length;
  const usedCount = gifticons.filter((gift) => gift.isUsed).length;

  return (
    <div className={styles.mypage}>
      <p className={styles.title}>마이페이지</p>

      {/* 프로필 섹션 */}
      <div className={styles.profileSection}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatar}>
                <img src="/basicProfile.webp" alt="프로필" />
              </div>
              <label className={styles.avatarEdit} htmlFor="profile-upload">
                📷
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
                id="profile-upload"
              />
            </div>

            <div className={styles.profileInfo}>
              <div className={styles.nicknameSection}>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className={styles.nicknameInput}
                    maxLength={12}
                  />
                ) : (
                  <h2 className={styles.nickname}>{userInfo.nickname}</h2>
                )}
                <button className={styles.editBtn} onClick={handleEditToggle} type="button">
                  {isEditMode ? "저장" : "수정"}
                </button>
              </div>

              <div className={styles.userMeta}>
                <span className={styles.email}>{userInfo.email}</span>
                {userInfo.emailVerified && <span className={styles.verifiedBadge}>✓ 인증됨</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 계정 설정 섹션 */}
      <div className={styles.accountSection}>
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>계정 설정</h3>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>이메일</span>
              <span className={styles.settingValue}>{userInfo.email}</span>
            </div>
            <button className={styles.settingBtn} onClick={() => setShowEmailChange(!showEmailChange)} type="button">
              변경
            </button>
          </div>

          {showEmailChange && (
            <div className={styles.emailChangeForm}>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="새 이메일 주소"
                className={styles.emailInput}
              />

              <button
                className={styles.emailVerifyBtn}
                onClick={handleEmailChange}
                disabled={!newEmail || isEmailCodeSent}
                type="button"
              >
                {isEmailCodeSent ? "인증번호 발송됨" : "인증번호 발송"}
              </button>

              {isEmailCodeSent && (
                <div className={styles.verificationSection}>
                  <input
                    type="text"
                    value={emailVerificationCode}
                    onChange={(e) => setEmailVerificationCode(e.target.value)}
                    placeholder="인증번호 6자리"
                    maxLength={6}
                    className={styles.verificationInput}
                  />
                  <button
                    className={styles.confirmBtn}
                    onClick={handleEmailVerify}
                    disabled={!emailVerificationCode}
                    type="button"
                  >
                    인증하기
                  </button>
                  <p className={styles.testCode}>테스트용 인증번호: 123456</p>
                </div>
              )}

              <div className={styles.emailActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowEmailChange(false);
                    setNewEmail("");
                    setEmailVerificationCode("");
                    setIsEmailCodeSent(false);
                  }}
                  type="button"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>비밀번호</span>
              <span className={styles.settingValue}>••••••••</span>
            </div>
            <button
              className={styles.settingBtn}
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              type="button"
            >
              변경
            </button>
          </div>

          {showPasswordChange && (
            <div className={styles.passwordChangeForm}>
              <input type="password" placeholder="현재 비밀번호" className={styles.passwordInput} />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (8자 이상)"
                className={styles.passwordInput}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재확인"
                className={styles.passwordInput}
              />
              <div className={styles.passwordActions}>
                <button className={styles.cancelBtn} onClick={() => setShowPasswordChange(false)} type="button">
                  취소
                </button>
                <button className={styles.confirmBtn} onClick={handlePasswordChange} type="button">
                  변경하기
                </button>
              </div>
            </div>
          )}

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>이메일 인증</span>
              <span
                className={`${styles.settingValue} ${userInfo.emailVerified ? styles.verified : styles.unverified}`}
              >
                {userInfo.emailVerified ? "인증 완료" : "미인증"}
              </span>
            </div>
            {!userInfo.emailVerified && (
              <button className={styles.settingBtn} type="button">
                인증하기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 기프티콘 관리 섹션 */}
      <div className={styles.gifticonSection}>
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>내 기프티콘</h3>
            <div className={styles.gifticonSummary}>
              <span className={styles.gifticonCount}>
                미사용 {unusedCount}개 · 사용완료 {usedCount}개
              </span>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className={styles.tabMenu}>
            <button
              className={`${styles.tabBtn} ${selectedTab === "all" ? styles.active : ""}`}
              onClick={() => setSelectedTab("all")}
              type="button"
            >
              전체 ({gifticons.length})
            </button>
            <button
              className={`${styles.tabBtn} ${selectedTab === "unused" ? styles.active : ""}`}
              onClick={() => setSelectedTab("unused")}
              type="button"
            >
              미사용 ({unusedCount})
            </button>
            <button
              className={`${styles.tabBtn} ${selectedTab === "used" ? styles.active : ""}`}
              onClick={() => setSelectedTab("used")}
              type="button"
            >
              사용완료 ({usedCount})
            </button>
          </div>

          {/* 기프티콘 목록 */}
          <div className={styles.gifticonList}>
            {getFilteredGifticons().length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🎁</span>
                <p className={styles.emptyMessage}>
                  {selectedTab === "unused"
                    ? "미사용 기프티콘이 없습니다."
                    : selectedTab === "used"
                    ? "사용완료된 기프티콘이 없습니다."
                    : "받은 기프티콘이 없습니다."}
                </p>
              </div>
            ) : (
              getFilteredGifticons().map((gifticon) => (
                <div key={gifticon.id} className={`${styles.gifticonCard} ${gifticon.isUsed ? styles.used : ""}`}>
                  <div className={styles.gifticonIcon}>
                    <img src={gifticon.icon} alt={gifticon.type} />
                  </div>

                  <div className={styles.gifticonInfo}>
                    <div className={styles.gifticonHeader}>
                      <h4 className={styles.gifticonName}>{gifticon.name}</h4>
                      <span className={`${styles.gifticonStatus} ${gifticon.isUsed ? styles.used : styles.unused}`}>
                        {gifticon.isUsed ? "사용완료" : "미사용"}
                      </span>
                    </div>

                    <p className={styles.gifticonDescription}>{gifticon.description}</p>

                    <div className={styles.gifticonMeta}>
                      <span className={styles.gifticonDate}>받은 날짜: {gifticon.receivedDate}</span>
                      <span className={styles.gifticonExpiry}>유효기간: {gifticon.expiryDate}</span>
                    </div>

                    {!gifticon.isUsed && (
                      <div className={styles.gifticonBarcode}>
                        <span className={styles.barcodeLabel}>바코드: </span>
                        <span className={styles.barcodeNumber}>{gifticon.barcode}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.gifticonActions}>
                    {!gifticon.isUsed && (
                      <button className={styles.useBtn} onClick={() => handleUseGifticon(gifticon.id)} type="button">
                        사용하기
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <p className={styles.gifticonDescription}>
            팀플 벌칙으로 받은 기프티콘입니다. 바코드를 매장에서 제시하여 사용하세요.
          </p>
        </div>
      </div>

      {/* 이용 안내 섹션 */}
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

      {/* 위험 구역 */}
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
    </div>
  );
}
