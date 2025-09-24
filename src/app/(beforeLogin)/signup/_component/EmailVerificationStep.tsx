import { useState, useEffect } from "react";
import styles from "../signup.module.css";

interface EmailVerificationStepProps {
  email: string;
  setEmail: (email: string) => void;
  isVerified: boolean;
  setIsVerified: (verified: boolean) => void;
}

export default function EmailVerificationStep({
  email,
  setEmail,
  isVerified,
  setIsVerified,
}: EmailVerificationStepProps) {
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 상태 변화 추적을 위한 useEffect
  useEffect(() => {
    console.log("상태 업데이트:", { isCodeSent, isVerified, email });
  }, [isCodeSent, isVerified, email]);

  // 이메일 인증번호 발송
  const handleSendVerification = async () => {
    if (!email) {
      alert("이메일을 입력해주세요.");
      return;
    }

    // 이메일 형식 간단 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("올바른 이메일 형식이 아닙니다.");
      return;
    }

    setIsLoading(true);
    console.log("인증번호 발송 요청:", { email, shouldAlreadyExists: false });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/email/send-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          shouldAlreadyExists: false,
        }),
      });

      console.log("응답 상태:", response.status, response.statusText);

      if (response.ok) {
        // 상태를 명시적으로 true로 설정
        setIsCodeSent(true);
        setVerificationCode(""); // 인증코드 입력 필드 초기화
        console.log("isCodeSent를 true로 설정 완료");
        alert("인증번호가 발송되었습니다! 이메일을 확인해주세요.");
      } else {
        const responseText = await response.text();
        console.error("서버 응답:", responseText);

        let errorMessage = "인증번호 발송에 실패했습니다.";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("JSON 파싱 오류:", parseError);
          errorMessage = `서버 오류 (${response.status}): ${responseText || "알 수 없는 오류"}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("인증번호 발송 오류:", error);
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
      console.log("로딩 완료, 현재 isCodeSent 상태:", isCodeSent);
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      alert("인증번호를 입력해주세요.");
      return;
    }

    if (verificationCode.length !== 6) {
      alert("인증번호는 6자리여야 합니다.");
      return;
    }

    setIsLoading(true);
    console.log("인증번호 확인 요청:", { email, code: verificationCode });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/email/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          code: verificationCode,
        }),
      });

      if (response.ok) {
        setIsVerified(true);
        setIsCodeSent(false); // 인증 완료 시 코드 발송 상태 초기화
        alert("인증이 완료되었습니다!");
      } else {
        const responseText = await response.text();
        console.error("서버 응답:", responseText);

        let errorMessage = "인증번호가 올바르지 않습니다.";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("JSON 파싱 오류:", parseError);
          errorMessage = `서버 오류 (${response.status}): ${responseText || "알 수 없는 오류"}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("인증번호 확인 오류:", error);
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  console.log("렌더링 시점 상태:", { isCodeSent, isVerified, isLoading });

  return (
    <div>
      <h2>이메일 인증</h2>
      <p>사용하실 이메일 주소를 입력해주세요.</p>

      <div style={{ marginBottom: "16px" }}>
        <input
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setEmail(e.target.value);
            // 이메일 변경 시 인증 상태 초기화
            if (isCodeSent || isVerified) {
              setIsCodeSent(false);
              setIsVerified(false);
              setVerificationCode("");
            }
          }}
          placeholder="example@email.com"
          disabled={isVerified}
          className={`${styles.input} ${isVerified ? styles.inputDisabled : ""}`}
          style={{ width: "100%", marginBottom: "8px" }}
        />

        {!isVerified && !isCodeSent && (
          <button
            type="button"
            onClick={handleSendVerification}
            disabled={!email || isLoading}
            className={`${styles.button} ${!email || isLoading ? styles.buttonDisabled : styles.buttonPrimary}`}
            style={{ width: "100%" }}
          >
            {isLoading ? "발송 중..." : "인증번호 발송"}
          </button>
        )}
      </div>

      {/* 인증번호 입력 섹션 */}
      {isCodeSent && !isVerified && (
        <div className={styles.verificationSection} style={{ marginTop: "16px" }}>
          <p style={{ marginBottom: "8px", fontSize: "14px", color: "#666" }}>
            이메일로 발송된 6자리 인증번호를 입력해주세요.
          </p>
          <div className={styles.checkSection}>
            <input
              type="text"
              value={verificationCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                // 숫자만 입력 가능하도록
                const value = e.target.value.replace(/[^0-9]/g, "");
                if (value.length <= 6) {
                  setVerificationCode(value);
                }
              }}
              placeholder="인증번호 6자리"
              maxLength={6}
              className={styles.input1}
              style={{ flex: 1 }}
              autoFocus
            />
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={!verificationCode || verificationCode.length !== 6 || isLoading}
              className={`${styles.button1} ${
                !verificationCode || verificationCode.length !== 6 || isLoading
                  ? styles.buttonDisabled
                  : styles.buttonPrimary
              }`}
            >
              {isLoading ? "확인 중..." : "확인"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
