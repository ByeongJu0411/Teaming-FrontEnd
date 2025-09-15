/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import styles from "./signup.module.css";
import DarkVeil from "@/app/_component/DarkVeil";
import Link from "next/link";
import Stepper, { Step } from "@/app/_component/Stepper";

export default function SignupPage() {
  // 폼 상태 관리
  const [email, setEmail] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [nickname, setNickname] = useState<string>("");

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const handleStepChange = (step: number) => {
    console.log(`현재 스텝: ${step}`);
  };

  const handleFinalCompleted = () => {
    console.log("회원가입 완료!");
    // 여기에 회원가입 완료 후 로직 추가 (예: 페이지 리다이렉트)
  };

  // 이메일 인증번호 발송
  const handleSendVerification = () => {
    if (!email) {
      alert("이메일을 입력해주세요.");
      return;
    }
    // 여기에 실제 인증번호 발송 API 호출
    console.log(`인증번호를 ${email}로 발송합니다.`);
    setIsCodeSent(true);
    alert("인증번호가 발송되었습니다!");
  };

  // 인증번호 확인
  const handleVerifyCode = () => {
    if (!verificationCode) {
      alert("인증번호를 입력해주세요.");
      return;
    }
    // 여기에 실제 인증번호 확인 API 호출
    // 임시로 "123456"을 정답으로 설정
    if (verificationCode === "123456") {
      setIsVerified(true);
      alert("인증이 완료되었습니다!");
    } else {
      alert("인증번호가 올바르지 않습니다.");
    }
  };

  // 프로필 이미지 선택
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 제거
  const handleRemoveImage = () => {
    setProfileImage(null);
    setPreviewUrl("");
    // 파일 input 리셋
    const fileInput = document.getElementById("profile-image-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // 비밀번호 확인
  const isPasswordMatch = password && confirmPassword && password === confirmPassword;

  // 비밀번호 유효성 검사
  const isPasswordValid = password.length >= 8;

  return (
    <>
      {/* 애니메이션 배경 */}
      <div className={styles.backgroundContainer}>
        <DarkVeil />
      </div>

      {/* 메인 컨텐츠 컨테이너 */}
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <p className={styles.header_name}>Teaming</p>
            <Link href="/" className={styles.header_back}>
              돌아가기
            </Link>
          </div>

          <Stepper
            initialStep={1}
            onStepChange={handleStepChange}
            onFinalStepCompleted={handleFinalCompleted}
            backButtonText="이전"
            nextButtonText="다음"
          >
            {/* Step 1: 환영 메시지 */}
            <Step>
              <div>
                <h2>Teaming에 오신 것을 환영합니다!</h2>
                <p>간단한 단계를 통해 회원가입을 완료해보세요.</p>
                <div style={{ marginTop: "20px", fontSize: "14px", color: "#888" }}>
                  <p>✓ 이메일 인증</p>
                  <p>✓ 비밀번호 설정</p>
                  <p>✓ 닉네임 설정</p>
                  <p>✓ 프로필 사진 (선택사항)</p>
                </div>
              </div>
            </Step>

            {/* Step 2: 이메일 인증 */}
            <Step>
              <div>
                <h2>이메일 인증</h2>
                <p>사용하실 이메일 주소를 입력해주세요.</p>

                <input
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  disabled={isVerified}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    marginTop: "16px",
                    fontSize: "16px",
                    outline: "none",
                    backgroundColor: isVerified ? "#f5f5f5" : "white",
                    boxSizing: "border-box",
                  }}
                />

                {!isVerified && (
                  <button
                    type="button"
                    onClick={handleSendVerification}
                    disabled={!email || isCodeSent}
                    style={{
                      width: "100%",
                      padding: "12px",
                      marginTop: "12px",
                      backgroundColor: !email || isCodeSent ? "#ccc" : "#5227ff",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: !email || isCodeSent ? "not-allowed" : "pointer",
                      fontSize: "16px",
                    }}
                  >
                    {isCodeSent ? "인증번호 발송됨" : "인증번호 발송"}
                  </button>
                )}

                {isCodeSent && !isVerified && (
                  <div style={{ marginTop: "20px" }}>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value)}
                      placeholder="인증번호 6자리를 입력하세요"
                      maxLength={6}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        fontSize: "16px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={!verificationCode}
                      style={{
                        width: "100%",
                        padding: "12px",
                        marginTop: "12px",
                        backgroundColor: !verificationCode ? "#ccc" : "#5227ff",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: !verificationCode ? "not-allowed" : "pointer",
                        fontSize: "16px",
                      }}
                    >
                      인증번호 확인
                    </button>
                    <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>테스트용 인증번호: 123456</p>
                  </div>
                )}

                {isVerified && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "12px",
                      backgroundColor: "#e8f5e8",
                      borderRadius: "8px",
                      color: "#2e7d2e",
                    }}
                  >
                    ✓ 이메일 인증이 완료되었습니다!
                  </div>
                )}
              </div>
            </Step>

            {/* Step 3: 비밀번호 설정 */}
            <Step>
              <div>
                <h2>비밀번호 설정</h2>
                <p>안전한 비밀번호를 설정해주세요.</p>

                <input
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="비밀번호 (8자 이상)"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${password && !isPasswordValid ? "#ff4444" : "#ddd"}`,
                    borderRadius: "8px",
                    marginTop: "16px",
                    fontSize: "16px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 재확인"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${confirmPassword && !isPasswordMatch ? "#ff4444" : "#ddd"}`,
                    borderRadius: "8px",
                    marginTop: "12px",
                    fontSize: "16px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                {password && !isPasswordValid && (
                  <p style={{ color: "#ff4444", fontSize: "14px", marginTop: "8px" }}>
                    비밀번호는 8자 이상이어야 합니다.
                  </p>
                )}

                {confirmPassword && !isPasswordMatch && (
                  <p style={{ color: "#ff4444", fontSize: "14px", marginTop: "8px" }}>비밀번호가 일치하지 않습니다.</p>
                )}

                {isPasswordMatch && isPasswordValid && (
                  <p style={{ color: "#5227ff", fontSize: "14px", marginTop: "8px" }}>✓ 비밀번호가 일치합니다.</p>
                )}

                <div style={{ fontSize: "12px", color: "#888", marginTop: "12px" }}>
                  <p>• 8자 이상 입력해주세요</p>
                  <p>• 영문, 숫자, 특수문자 조합을 권장합니다</p>
                </div>
              </div>
            </Step>

            {/* Step 4: 닉네임 설정 */}
            <Step>
              <div>
                <h2>닉네임 설정</h2>
                <p>다른 사용자들에게 표시될 닉네임을 입력해주세요.</p>

                <input
                  type="text"
                  value={nickname}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNickname(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  maxLength={12}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    marginTop: "16px",
                    fontSize: "16px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                <div style={{ fontSize: "12px", color: "#888", marginTop: "8px", textAlign: "right" }}>
                  {nickname.length}/12
                </div>

                {nickname && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "12px",
                      backgroundColor: "#f0f8ff",
                      borderRadius: "8px",
                    }}
                  >
                    <p style={{ margin: 0, color: "#5227ff" }}>미리보기: {nickname}님</p>
                  </div>
                )}

                <div style={{ fontSize: "12px", color: "#888", marginTop: "12px" }}>
                  <p>• 2-12자로 입력해주세요</p>
                  <p>• 한글, 영문, 숫자 사용 가능합니다</p>
                </div>
              </div>
            </Step>

            {/* Step 5: 프로필 사진 (선택사항) */}
            <Step>
              <div>
                <h2>프로필 사진</h2>
                <p>프로필에 사용할 사진을 선택해주세요.</p>

                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    margin: "20px auto",
                    border: "2px solid #ddd",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <img
                    src={previewUrl || "/basicProfile.webp"}
                    alt="프로필 미리보기"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                  id="profile-image-input"
                />

                <label
                  htmlFor="profile-image-input"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#5227ff",
                    color: "white",
                    textAlign: "center",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "16px",
                    marginTop: "16px",
                    boxSizing: "border-box",
                  }}
                >
                  사진 선택하기
                </label>

                {profileImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      width: "100%",
                      padding: "8px",
                      backgroundColor: "#f5f5f5",
                      color: "#666",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      marginTop: "8px",
                    }}
                  >
                    사진 제거
                  </button>
                )}

                <div
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    marginTop: "16px",
                    padding: "12px",

                    borderRadius: "8px",
                  }}
                >
                  <p style={{ margin: "0 0 8px 0", fontWeight: "500" }}>💡 선택사항입니다</p>
                  <p style={{ margin: 0 }}>프로필 사진은 나중에 마이페이지에서 언제든지 설정하실 수 있습니다.</p>
                </div>
              </div>
            </Step>

            {/* Step 6: 회원가입 완료 */}
            <Step>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>🎉</div>
                <h2>회원가입 완료!</h2>
                <p>{nickname || "새로운 회원"}님, Teaming에 가입해주셔서 감사합니다!</p>
                <p>이제 모든 기능을 이용하실 수 있습니다.</p>

                <button
                  type="button"
                  onClick={() => {
                    // 로그인 페이지로 이동하거나 자동 로그인 처리
                    window.location.href = "/login";
                  }}
                  style={{
                    width: "100%",
                    padding: "16px",
                    marginTop: "24px",
                    backgroundColor: "#5227ff",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  시작하기
                </button>
              </div>
            </Step>
          </Stepper>
        </div>
      </div>
    </>
  );
}
