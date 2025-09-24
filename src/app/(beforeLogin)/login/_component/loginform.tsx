"use client";

import styles from "./loginform.module.css";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 입력값 검증
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1단계: 백엔드 로그인 API 직접 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/teaming/sign-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      console.log("로그인 API 응답 상태:", response.status);

      if (!response.ok) {
        let errorMessage = "로그인에 실패했습니다.";

        try {
          const errorText = await response.text();
          console.error("로그인 API 오류 응답:", errorText);

          if (response.status === 401) {
            errorMessage = "이메일 또는 비밀번호가 올바르지 않습니다.";
          } else if (response.status === 400) {
            errorMessage = "입력한 정보를 확인해주세요.";
          } else if (response.status === 404) {
            errorMessage = "존재하지 않는 계정입니다.";
          } else if (response.status === 429) {
            errorMessage = "너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.";
          } else if (response.status >= 500) {
            errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          }
        } catch (textError) {
          console.error("에러 텍스트 파싱 실패:", textError);
        }

        throw new Error(errorMessage);
      }

      const data: LoginResponse = await response.json();
      console.log("로그인 성공:", { hasAccessToken: !!data.accessToken, hasRefreshToken: !!data.refreshToken });

      // 2단계: NextAuth credentials provider를 통해 세션 생성
      const signInResult = await signIn("credentials", {
        email: email.trim(),
        password: password.trim(),
        accessToken: data.accessToken, // 백엔드에서 받은 토큰 전달
        refreshToken: data.refreshToken, // 백엔드에서 받은 리프레시 토큰 전달
        redirect: false,
      });

      console.log("NextAuth signIn 결과:", signInResult);

      if (signInResult?.error) {
        throw new Error("세션 생성에 실패했습니다. 다시 시도해주세요.");
      }

      if (signInResult?.ok) {
        console.log("로그인 완료, 메인페이지로 이동");
        router.push("/mainpage");
        router.refresh(); // 페이지 새로고침으로 세션 상태 반영
      } else {
        throw new Error("로그인 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.login_form}>
      <p className={styles.form_title}>로그인</p>

      <form onSubmit={handleLogin}>
        <div className={styles.input_group}>
          <div className={styles.input_wrapper}>
            <input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className={styles.input}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className={styles.input_wrapper}>
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              className={styles.input}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && <div className={styles.error_message}>{error}</div>}

        <div className={styles.button_group}>
          <button
            type="submit"
            className={`${styles.login_button} ${isLoading ? styles.loading : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>

          <Link href="/signup" className={styles.signup_button}>
            회원가입
          </Link>
        </div>
      </form>
    </div>
  );
}
