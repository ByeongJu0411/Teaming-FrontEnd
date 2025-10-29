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
    avatarFile?: File;
  };
  isDataValid: boolean; // ⭐ 추가
}

interface SignUpResponse {
  accessToken: string;
  refreshToken: string;
}

interface AvatarIntentResponse {
  key: string;
  bucket: string;
  url: string;
  version?: number;
  requiredHeaders: Record<string, string>;
}

interface AvatarCompleteResponse {
  avatarKey: string;
  avatarVersion: number;
  publicUrl: string;
}

interface UserMeResponse {
  email: string;
  name: string;
  avatarKey: string;
  avatarVersion: number;
  avatarUrl?: string;
}

export default function CompletionStep({ nickname, signupData, isDataValid }: CompletionStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

  const getUploadIntent = async (file: File, accessToken: string): Promise<AvatarIntentResponse> => {
    console.log("=== Intent API 호출 ===");
    console.log("파일 정보:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/avatar/intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ownerType: "USER",
        contentType: file.type.toLowerCase(),
        byteSize: file.size,
      }),
    });

    console.log("Intent API 응답 상태:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Intent API 실패:", errorText);
      throw new Error(`Intent API 실패: ${errorText}`);
    }

    const intentData: AvatarIntentResponse = await response.json();
    console.log("Intent 성공:", intentData);
    return intentData;
  };

  const uploadToS3 = async (file: File, intentData: AvatarIntentResponse): Promise<void> => {
    console.log("=== S3 업로드 시작 ===");
    console.log("업로드 URL:", intentData.url);

    const headers: Record<string, string> = {};
    if (intentData.requiredHeaders) {
      Object.keys(intentData.requiredHeaders).forEach((key) => {
        headers[key] = intentData.requiredHeaders[key];
      });
    }

    console.log("업로드 헤더:", headers);

    const s3Response = await fetch(intentData.url, {
      method: "PUT",
      headers: headers,
      body: file,
    });

    console.log("S3 응답 상태:", s3Response.status);

    if (!s3Response.ok) {
      const errorText = await s3Response.text();
      console.error("S3 업로드 실패:", errorText);
      throw new Error(`S3 업로드 실패: ${s3Response.status}`);
    }

    console.log("S3 업로드 성공!");
  };

  const completeAvatarUpload = async (
    accessToken: string,
    key: string,
    dimensions: { width: number; height: number }
  ): Promise<string> => {
    console.log("=== Complete API 호출 ===");
    console.log("요청 데이터:", {
      ownerType: "USER",
      key: key,
      width: dimensions.width,
      height: dimensions.height,
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/avatar/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ownerType: "USER",
        key: key,
        width: dimensions.width,
        height: dimensions.height,
      }),
    });

    console.log("Complete API 응답 상태:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Complete API 실패:", errorText);
      throw new Error(`Complete API 실패: ${errorText}`);
    }

    const completeData: AvatarCompleteResponse = await response.json();
    console.log("Complete API 성공:", completeData);
    console.log("업로드된 이미지 publicUrl:", completeData.publicUrl);

    return completeData.publicUrl;
  };

  const verifyAvatarUrl = async (accessToken: string, expectedUrl: string): Promise<void> => {
    console.log("=== /users/me로 avatarUrl 검증 ===");

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error("사용자 정보 조회 실패:", response.status);
      return;
    }

    const userData: UserMeResponse = await response.json();
    console.log("사용자 정보:", userData);
    console.log("/users/me의 avatarUrl:", userData.avatarUrl);

    if (userData.avatarUrl === expectedUrl) {
      console.log("✅ publicUrl과 avatarUrl이 일치합니다!");
      console.log("   publicUrl  :", expectedUrl);
      console.log("   avatarUrl  :", userData.avatarUrl);
    } else {
      console.warn("⚠️ publicUrl과 avatarUrl이 다릅니다!");
      console.warn("   publicUrl  :", expectedUrl);
      console.warn("   avatarUrl  :", userData.avatarUrl || "(없음)");
    }
  };

  const handleStart = async () => {
    // ⭐ isDataValid로 유효성 검증
    if (!isDataValid) {
      alert("필수 정보가 누락되었거나 올바르지 않습니다. 이전 단계를 다시 확인해주세요.");
      return;
    }

    if (!signupData.email || !signupData.password || !signupData.name) {
      alert("필수 정보가 누락되었습니다. 이전 단계를 다시 확인해주세요.");
      return;
    }

    console.log("==========================================");
    console.log("=== CompletionStep 시작 ===");
    console.log("==========================================");
    console.log("signupData:", signupData);
    console.log("avatarFile 존재?:", !!signupData.avatarFile);
    if (signupData.avatarFile) {
      console.log("avatarFile 정보:", {
        name: signupData.avatarFile.name,
        size: signupData.avatarFile.size,
        type: signupData.avatarFile.type,
      });
    }
    console.log("==========================================");

    setIsLoading(true);

    try {
      // 1. 회원가입 API 호출
      console.log("\n=== 1. 회원가입 API 호출 ===");

      const requestBody = {
        email: signupData.email,
        password: signupData.password,
        name: signupData.name,
        avatarKey: null,
        avatarVersion: 0,
      };

      console.log("요청 데이터:", requestBody);

      const signUpResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/teaming/sign-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("회원가입 응답 상태:", signUpResponse.status);

      if (!signUpResponse.ok) {
        const errorText = await signUpResponse.text();
        console.error("회원가입 실패:", errorText);

        let errorMessage = "회원가입에 실패했습니다.";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `서버 오류 (${signUpResponse.status}): ${errorText || "알 수 없는 오류"}`;
        }
        alert(errorMessage);
        return;
      }

      const signUpResult: SignUpResponse = await signUpResponse.json();
      console.log("✅ 회원가입 성공! JWT 토큰 받음");

      let uploadedImageUrl: string | null = null;

      // 2. 프로필 이미지가 있다면 업로드 프로세스 시작
      if (signupData.avatarFile) {
        console.log("\n프로필 이미지가 있습니다! 업로드를 시작합니다.");

        try {
          console.log("\n=== 2. 프로필 이미지 업로드 시작 ===");

          const file = signupData.avatarFile;
          const dimensions = await getImageDimensions(file);
          console.log("이미지 크기:", dimensions);

          // Intent API 호출
          const intentData = await getUploadIntent(file, signUpResult.accessToken);

          // S3 업로드
          await uploadToS3(file, intentData);

          // Complete API 호출
          uploadedImageUrl = await completeAvatarUpload(signUpResult.accessToken, intentData.key, dimensions);

          // /users/me로 avatarUrl 검증
          await verifyAvatarUrl(signUpResult.accessToken, uploadedImageUrl);
        } catch (avatarError) {
          console.error("프로필 이미지 업로드 오류:", avatarError);
          alert(
            "프로필 이미지 설정에 실패했지만, 회원가입은 완료되었습니다.\n나중에 마이페이지에서 변경할 수 있습니다."
          );
        }
      } else {
        console.log("\n프로필 이미지가 없습니다. 업로드를 건너뜁니다.");
      }

      // 3. 자동 로그인
      console.log("\n=== 3. 자동 로그인 시도 ===");

      const signInResult = await signIn("credentials", {
        email: signupData.email,
        password: signupData.password,
        accessToken: signUpResult.accessToken,
        refreshToken: signUpResult.refreshToken,
        redirect: false,
      });

      console.log("로그인 결과:", signInResult);

      if (signInResult?.error) {
        console.error("자동 로그인 실패:", signInResult.error);
        alert("회원가입은 완료되었으나 자동 로그인에 실패했습니다.\n로그인 페이지에서 직접 로그인해주세요.");
        router.push("/login");
      } else if (signInResult?.ok) {
        console.log("✅ 자동 로그인 성공!");

        if (uploadedImageUrl) {
          console.log("✅ 프로필 이미지 URL:", uploadedImageUrl);
        }

        router.push("/mainpage");
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
