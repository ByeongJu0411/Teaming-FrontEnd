"use client";
import styles from "./profilesection.module.css";
import Image from "next/image";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

// API 응답 타입 정의
interface UserInfoResponse {
  email: string;
  name: string;
  avatarKey: string;
  avatarVersion: number;
  avatarUrl?: string; // 추가
}

interface AvatarIntentResponse {
  key: string;
  bucket: string;
  url: string;
  requiredHeaders: Record<string, string>;
}

interface AvatarCompleteResponse {
  avatarKey: string;
  avatarVersion: number;
  publicUrl: string;
}

interface UserInfo {
  email: string;
  nickname: string;
  profileImage: string;
  joinDate: string;
  emailVerified: boolean;
}

export default function ProfileSection() {
  const { data: session } = useSession();

  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: "",
    nickname: "",
    profileImage: "/basicProfile.webp",
    joinDate: "2024.03.15",
    emailVerified: true,
  });

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editNickname, setEditNickname] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 회원정보 조회 API 함수
  const fetchUserInfo = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const token = session?.accessToken;

      if (!token) {
        throw new Error("인증 토큰이 없습니다. 로그인이 필요합니다.");
      }

      if (!session?.isBackendAuthenticated) {
        if (session?.backendError?.hasError) {
          throw new Error(session.backendError.message || "백엔드 인증에 실패했습니다.");
        } else {
          throw new Error("백엔드 인증이 완료되지 않았습니다.");
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ProfileSection: Error response:", errorText);

        if (response.status === 401) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (response.status === 403) {
          throw new Error("접근 권한이 없습니다.");
        } else {
          throw new Error(`서버 오류가 발생했습니다. (${response.status})`);
        }
      }

      const data: UserInfoResponse = await response.json();
      console.log("사용자 정보 조회 성공:", data);

      // avatarUrl이 응답에 포함되어 있으면 바로 사용
      const avatarUrl = data.avatarUrl || "/basicProfile.webp";

      console.log("프로필 이미지 URL:", avatarUrl);

      setUserInfo((prev) => ({
        ...prev,
        email: data.email,
        nickname: data.name,
        profileImage: avatarUrl,
      }));

      setEditNickname(data.name);
    } catch (err) {
      console.error("ProfileSection: 회원정보를 가져오는데 실패했습니다:", err);
      setError(err instanceof Error ? err.message : "회원정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [
    session?.accessToken,
    session?.isBackendAuthenticated,
    session?.backendError?.hasError,
    session?.backendError?.message,
  ]);

  useEffect(() => {
    if (session) {
      fetchUserInfo();
    }
  }, [session, fetchUserInfo]);

  const handleEditToggle = async (): Promise<void> => {
    if (isEditMode) {
      await updateUserName();
    } else {
      setEditNickname(userInfo.nickname);
    }
    setIsEditMode(!isEditMode);
  };

  const updateUserName = async (): Promise<void> => {
    try {
      const token = session?.accessToken;

      if (!token) {
        alert("인증 토큰이 없습니다. 로그인이 필요합니다.");
        return;
      }

      if (!session?.isBackendAuthenticated) {
        alert("백엔드 인증이 완료되지 않았습니다.");
        return;
      }

      if (editNickname.trim() === userInfo.nickname) {
        console.log("이름이 변경되지 않았습니다.");
        return;
      }

      if (!editNickname.trim()) {
        alert("이름을 입력해주세요.");
        return;
      }

      if (editNickname.trim().length > 12) {
        alert("이름은 12자 이하로 입력해주세요.");
        return;
      }

      console.log("이름 변경 API 호출:", editNickname);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/name`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editNickname.trim(),
        }),
      });

      console.log("이름 변경 응답 상태:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("이름 변경 실패:", errorText);

        if (response.status === 401) {
          alert("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (response.status === 403) {
          alert("접근 권한이 없습니다.");
        } else if (response.status === 400) {
          alert("잘못된 요청입니다. 이름을 확인해주세요.");
        } else {
          alert(`서버 오류가 발생했습니다. (${response.status})`);
        }
        return;
      }

      setUserInfo({ ...userInfo, nickname: editNickname.trim() });
      console.log("이름 변경 성공:", editNickname);
      alert("이름이 성공적으로 변경되었습니다!");
    } catch (error) {
      console.error("이름 변경 중 오류:", error);
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error("이미지를 로드할 수 없습니다."));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const completeAvatarUpload = async (
    intentData: AvatarIntentResponse,
    dimensions: { width: number; height: number }
  ) => {
    try {
      const token = session?.accessToken;

      if (!token) {
        throw new Error("인증 토큰이 없습니다.");
      }

      console.log("아바타 업로드 완료 처리 중...", {
        key: intentData.key,
        width: dimensions.width,
        height: dimensions.height,
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/avatar/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ownerType: "USER",
          key: intentData.key,
          width: dimensions.width,
          height: dimensions.height,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("아바타 완료 처리 실패:", errorText);

        if (response.status === 401) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (response.status === 400) {
          throw new Error(`잘못된 요청입니다: ${errorText}`);
        } else {
          throw new Error(`서버 오류가 발생했습니다. (${response.status}): ${errorText}`);
        }
      }

      const completeData: AvatarCompleteResponse = await response.json();
      console.log("아바타 업로드 완료 응답:", completeData);

      return completeData;
    } catch (error) {
      console.error("아바타 완료 처리 중 오류:", error);
      throw error;
    }
  };

  const prepareAvatarUpload = async (file: File) => {
    try {
      const token = session?.accessToken;

      if (!token) {
        throw new Error("인증 토큰이 없습니다. 로그인이 필요합니다.");
      }

      if (!session?.isBackendAuthenticated) {
        throw new Error("백엔드 인증이 완료되지 않았습니다.");
      }

      if (!file.type.startsWith("image/")) {
        throw new Error("이미지 파일만 업로드 가능합니다.");
      }

      if (typeof file.size !== "number" || isNaN(file.size) || file.size <= 0) {
        throw new Error("파일 크기 정보를 읽을 수 없습니다. 다른 파일을 선택해주세요.");
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("파일 크기는 5MB 이하로 제한됩니다.");
      }

      console.log("=== 아바타 업로드 준비 ===");
      console.log("파일 정보:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      const dimensions = await getImageDimensions(file);
      console.log("이미지 크기:", dimensions);

      const requestBody = {
        ownerType: "USER",
        contentType: file.type.toLowerCase(),
        byteSize: file.size,
      };

      console.log("Intent API 요청 데이터:", requestBody);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/avatar/intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Intent API 응답 상태:", response.status);

      const responseText = await response.text();
      console.log("Intent API 응답 본문:", responseText);

      if (!response.ok) {
        throw new Error(`Intent API 실패: ${response.status} - ${responseText}`);
      }

      const intentData: AvatarIntentResponse = JSON.parse(responseText);
      console.log("Intent 성공, requiredHeaders:", intentData.requiredHeaders);

      await uploadToS3(file, intentData, dimensions);
    } catch (error) {
      console.error("아바타 업로드 준비 중 오류:", error);
      alert(error instanceof Error ? error.message : "아바타 업로드 준비에 실패했습니다.");
    }
  };

  const uploadToS3 = async (
    file: File,
    intentData: AvatarIntentResponse,
    dimensions: { width: number; height: number }
  ) => {
    try {
      console.log("=== S3 업로드 시작 ===");
      console.log("업로드 URL:", intentData.url);
      console.log("requiredHeaders:", intentData.requiredHeaders);

      const headers: Record<string, string> = {};
      if (intentData.requiredHeaders) {
        Object.keys(intentData.requiredHeaders).forEach((key) => {
          headers[key] = intentData.requiredHeaders[key];
        });
      }

      console.log("최종 업로드 헤더:", headers);

      const uploadResponse = await fetch(intentData.url, {
        method: "PUT",
        headers: headers,
        body: file,
      });

      console.log("=== S3 응답 ===");
      console.log("응답 상태:", uploadResponse.status, uploadResponse.statusText);

      let responseText = "";
      try {
        responseText = await uploadResponse.text();
        console.log("응답 본문:", responseText);
      } catch (textError) {
        console.log("응답 본문 읽기 실패:", textError);
      }

      if (!uploadResponse.ok) {
        console.error("S3 업로드 실패");
        throw new Error(`S3 업로드 실패: ${uploadResponse.status} - ${responseText || uploadResponse.statusText}`);
      }

      console.log("S3 업로드 성공!");

      await completeAvatarUpload(intentData, dimensions);
      alert("프로필 이미지가 성공적으로 업로드되었습니다!");

      // 업로드 완료 후 사용자 정보 새로고침
      await fetchUserInfo();
    } catch (error) {
      console.error("S3 업로드 에러:", error);
      alert(error instanceof Error ? error.message : "파일 업로드에 실패했습니다.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      prepareAvatarUpload(file);
    }
  };

  if (loading) {
    return (
      <div className={styles.profileSection}>
        <div className={styles.profileCard}>
          <div className={styles.loadingMessage}>사용자 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profileSection}>
        <div className={styles.profileCard}>
          <div className={styles.errorMessage}>
            <p>{error}</p>
            <button onClick={fetchUserInfo} className={styles.retryButton}>
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileSection}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatar}>
              <Image
                src={userInfo.profileImage}
                alt="프로필"
                width={100}
                height={100}
                priority
                unoptimized
                style={{ objectFit: "cover", borderRadius: "50%" }}
                key={userInfo.profileImage}
              />
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
  );
}
