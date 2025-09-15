"use client";
import styles from "@/app/(afterLogin)/mainpage/_component/mypage.module.css";
import { useState } from "react";

interface UserInfo {
  email: string;
  nickname: string;
  profileImage: string;
  joinDate: string;
  emailVerified: boolean;
}

export default function AccountSection() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: "user@example.com",
    nickname: "티밍유저",
    profileImage: "/images/default-avatar.png",
    joinDate: "2024.03.15",
    emailVerified: true,
  });
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPasswordChange, setShowPasswordChange] = useState<boolean>(false);

  const [newEmail, setNewEmail] = useState<string>("");
  const [emailVerificationCode, setEmailVerificationCode] = useState<string>("");
  const [isEmailCodeSent, setIsEmailCodeSent] = useState<boolean>(false);
  const [showEmailChange, setShowEmailChange] = useState<boolean>(false);

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

  return (
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
            <span className={`${styles.settingValue} ${userInfo.emailVerified ? styles.verified : styles.unverified}`}>
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
  );
}
