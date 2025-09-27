"use client";

import { useState } from "react";
import styles from "./signup.module.css";
import DarkVeil from "@/app/_component/DarkVeil";
import Link from "next/link";
import Stepper, { Step } from "@/app/_component/Stepper";

// Step 컴포넌트들 import
import WelcomeStep from "./_component/WelcomeStep";
import EmailVerificationStep from "./_component/EmailVerificationStep";
import PasswordStep from "./_component/PasswordStep";
import NicknameStep from "./_component/NicknameStep";
import ProfileImageStep from "./_component/ProfileImageStep";
import CompletionStep from "./_component/CompletionStep";

export default function SignupPage() {
  // 폼 상태 관리
  const [email, setEmail] = useState<string>("");
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
  };

  // 회원가입 데이터 준비 - avatarFile 포함
  const signupData = {
    email,
    password,
    name: nickname,
    avatarFile: profileImage || undefined, // ⭐ File 객체 전달
  };

  // 유효성 검사 함수들
  const canProceedToPassword = isVerified;
  const canProceedToNickname = password && confirmPassword && password === confirmPassword && password.length >= 8;
  const canProceedToProfile = nickname && nickname.length >= 2;
  const canComplete = canProceedToProfile;

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
              <WelcomeStep />
            </Step>

            {/* Step 2: 이메일 인증 */}
            <Step>
              <EmailVerificationStep
                email={email}
                setEmail={setEmail}
                isVerified={isVerified}
                setIsVerified={setIsVerified}
              />
            </Step>

            {/* Step 3: 비밀번호 설정 */}
            <Step>
              <PasswordStep
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
              />
            </Step>

            {/* Step 4: 닉네임 설정 */}
            <Step>
              <NicknameStep nickname={nickname} setNickname={setNickname} />
            </Step>

            {/* Step 5: 프로필 사진 */}
            <Step>
              <ProfileImageStep
                profileImage={profileImage}
                setProfileImage={setProfileImage}
                previewUrl={previewUrl}
                setPreviewUrl={setPreviewUrl}
              />
            </Step>

            {/* Step 6: 회원가입 완료 */}
            <Step>
              <CompletionStep nickname={nickname} signupData={signupData} />
            </Step>
          </Stepper>
        </div>
      </div>
    </>
  );
}
