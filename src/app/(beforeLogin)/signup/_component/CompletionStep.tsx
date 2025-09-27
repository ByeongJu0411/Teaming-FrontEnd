import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "../signup.module.css";

interface CompletionStepProps {
  nickname: string;
  signupData: {
    email: string;
    password: string;
    name: string;
    avatarFile?: File; // 임시 저장된 파일
    avatarKey?: string;
    avatarVersion?: number;
  };
}

export default function CompletionStep({ nickname, signupData }: CompletionStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

        // 프로필 사진이 있는 경우 업로드 프로세스 진행
        if (result.accessToken && signupData.avatarFile) {
          console.log("=== 프로필 이미지 업로드 시작 ===");

          try {
            const file = signupData.avatarFile;

            // 이미지 크기 정보 추출
            const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
              return new Promise((resolve, reject) => {
                const img = new window.Image();
                img.onload = () => {
                  resolve({ width: img.naturalWidth, height: img.naturalHeight });
                  URL.revokeObjectURL(img.src);
                };
                img.onerror = () => {
                  URL.revokeObjectURL(img.src);
                  reject(new Error("이미지를 로드할 수 없습니다."));
                };
                img.src = URL.createObjectURL(file);
              });
            };

            const dimensions = await getImageDimensions(file);
            console.log("이미지 크기:", dimensions);

            // 1. Intent API 호출 (업로드 사전 준비)
            console.log("1. Intent API 호출");
            const intentResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/avatar/intent`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${result.accessToken}`,
              },
              body: JSON.stringify({
                ownerType: "USER",
                contentType: file.type.toLowerCase(),
                byteSize: file.size,
              }),
            });

            if (!intentResponse.ok) {
              const errorText = await intentResponse.text();
              throw new Error(`Intent API 실패: ${errorText}`);
            }

            const intentData = await intentResponse.json();
            console.log("Intent 성공:", intentData);

            // 2. S3 업로드
            console.log("2. S3 업로드 시작");
            const headers: Record<string, string> = {};
            if (intentData.requiredHeaders) {
              Object.keys(intentData.requiredHeaders).forEach((key) => {
                headers[key] = intentData.requiredHeaders[key];
              });
            }

            const s3Response = await fetch(intentData.url, {
              method: "PUT",
              headers: headers,
              body: file,
            });

            if (!s3Response.ok) {
              throw new Error(`S3 업로드 실패: ${s3Response.status}`);
            }

            console.log("S3 업로드 성공");

            // 3. Complete API 호출 (아바타 업로드 확정)
            console.log("3. Complete API 호출");
            const completeResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/avatar/complete`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${result.accessToken}`,
              },
              body: JSON.stringify({
                ownerType: "USER",
                key: intentData.key,
                width: dimensions.width,
                height: dimensions.height,
              }),
            });

            if (completeResponse.ok) {
              const completeData = await completeResponse.json();
              console.log("프로필 이미지 설정 완료:", completeData);
            } else {
              const errorText = await completeResponse.text();
              console.warn("Complete API 실패:", errorText);
            }
          } catch (avatarError) {
            console.error("프로필 이미지 업로드 오류:", avatarError);
            // 실패해도 회원가입은 성공했으므로 계속 진행
            alert(
              "프로필 이미지 업로드에 실패했지만, 회원가입은 완료되었습니다. 나중에 마이페이지에서 변경할 수 있습니다."
            );
          }
        }

        // 회원가입 성공 후 자동 로그인
        console.log("=== 자동 로그인 시도 중 ===");

        const signInResult = await signIn("credentials", {
          email: signupData.email,
          password: signupData.password,
          accessToken: result.accessToken || undefined,
          refreshToken: result.refreshToken || undefined,
          redirect: false,
        });

        console.log("로그인 결과:", signInResult);

        if (signInResult?.error) {
          console.error("자동 로그인 실패:", signInResult.error);
          alert(`회원가입은 완료되었으나 자동 로그인에 실패했습니다. 로그인 페이지에서 직접 로그인해주세요.`);
          router.push("/login");
        } else if (signInResult?.ok) {
          console.log("자동 로그인 성공!");
          alert(`${nickname}님, 환영합니다!`);
          router.push("/mainpage");
        }
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
