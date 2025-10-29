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
  // 현재 스텝 상태 추가
  const [currentStep, setCurrentStep] = useState<number>(1);

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
    setCurrentStep(step);
  };

  const handleFinalCompleted = () => {
    console.log("회원가입 완료!");
  };

  // 회원가입 데이터 준비 - avatarFile 포함
  const signupData = {
    email,
    password,
    name: nickname,
    avatarFile: profileImage || undefined,
  };

  // ⭐ 비밀번호 확인 일치 여부 추가
  const isSignupDataValid: boolean =
    !!email &&
    isVerified &&
    !!password &&
    password.length >= 8 &&
    !!confirmPassword &&
    password === confirmPassword && // ⭐ 비밀번호 일치 여부 추가
    !!nickname &&
    nickname.length >= 2;

  // 비밀번호 스텝(Step 3) 유효성 검사
  const canProceedPasswordStep = password && confirmPassword && password === confirmPassword && password.length >= 8;

  // 현재 스텝이 3(비밀번호 스텝)일 때만 검증
  const isNextButtonDisabled = currentStep === 3 && !canProceedPasswordStep;

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
            nextButtonProps={{
              disabled: isNextButtonDisabled,
              style: {
                opacity: isNextButtonDisabled ? 0.5 : 1,
                cursor: isNextButtonDisabled ? "not-allowed" : "pointer",
              },
            }}
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
              <CompletionStep nickname={nickname} signupData={signupData} isDataValid={isSignupDataValid} />
            </Step>
          </Stepper>
        </div>
      </div>
    </>
  );
}
