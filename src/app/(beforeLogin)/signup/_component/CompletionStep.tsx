import { useState } from "react";
import styles from "../signup.module.css";

interface CompletionStepProps {
  nickname: string;
  signupData: {
    email: string;
    password: string;
    name: string;
    avatarKey?: string;
    avatarVersion?: number;
  };
}

export default function CompletionStep({ nickname, signupData }: CompletionStepProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    // 필수 데이터 검증
    if (!signupData.email || !signupData.password || !signupData.name) {
      alert("필수 정보가 누락되었습니다. 이전 단계를 다시 확인해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // API 스펙에 맞는 요청 데이터 구성
      const requestBody = {
        email: signupData.email,
        password: signupData.password,
        name: signupData.name,
        avatarKey: signupData.avatarKey || null,
        avatarVersion: signupData.avatarVersion || 0,
      };

      console.log("회원가입 요청 데이터:", requestBody);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/teaming/sign-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("응답 상태:", response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log("회원가입 성공:", result);

        // 토큰을 받으면 저장 (필요시)
        if (result.accessToken) {
          console.log("Access Token 받음:", result.accessToken);
          // localStorage.setItem('accessToken', result.accessToken);
          // localStorage.setItem('refreshToken', result.refreshToken);
        }

        alert(`${nickname}님, 회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.`);
        window.location.href = "/login";
      } else {
        const errorText = await response.text();
        console.error("회원가입 실패 응답:", errorText);

        let errorMessage = "회원가입에 실패했습니다.";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("JSON 파싱 오류:", parseError);
          errorMessage = `서버 오류 (${response.status}): ${errorText || "알 수 없는 오류"}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("회원가입 네트워크 오류:", error);
      alert("네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.completionStep}>
      <div className={styles.completionEmoji}>🎉</div>
      <h2>회원가입 완료 준비!</h2>
      <p>{nickname}님의 정보가 준비되었습니다.</p>
      <p>시작하기 버튼을 눌러 회원가입을 완료해주세요.</p>

      <button
        type="button"
        onClick={handleStart}
        disabled={isLoading}
        className={`${styles.button} ${styles.buttonPrimary} ${styles.startButton} ${
          isLoading ? styles.buttonDisabled : ""
        }`}
      >
        {isLoading ? "회원가입 처리중..." : "시작하기"}
      </button>
    </div>
  );
}
