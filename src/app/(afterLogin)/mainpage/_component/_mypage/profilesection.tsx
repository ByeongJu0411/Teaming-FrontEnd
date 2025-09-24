/* eslint-disable @next/next/no-img-element */
"use client";
import styles from "./profilesection.module.css";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

// API 응답 타입 정의
interface UserInfoResponse {
  email: string;
  name: string;
  avatarKey: string;
  avatarVersion: number;
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

  // 회원정보 조회 API 함수 - useCallback으로 메모이제이션하고 의존성을 명확히 지정
  const fetchUserInfo = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // 세션에서 JWT 토큰 가져오기
      const token = session?.accessToken;

      if (!token) {
        throw new Error("인증 토큰이 없습니다. 로그인이 필요합니다.");
      }

      // 백엔드 인증 상태 확인
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

      // API 응답을 컴포넌트 상태에 맞게 변환
      setUserInfo((prev) => ({
        ...prev,
        email: data.email,
        nickname: data.name,
        // avatarKey가 있으면 이미지 URL 생성, 없으면 기본 이미지
        profileImage: data.avatarKey
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/files/${data.avatarKey}?v=${data.avatarVersion}`
          : "/basicProfile.webp",
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

  // 사용자 이름 변경 API 함수 - useCallback으로 메모이제이션
  const updateUserName = useCallback(async (): Promise<void> => {
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

      // 이름이 변경되지 않았으면 API 호출하지 않음
      if (editNickname.trim() === userInfo.nickname) {
        console.log("이름이 변경되지 않았습니다.");
        return;
      }

      // 이름 유효성 검사
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

      // 성공 시 로컬 상태 업데이트
      setUserInfo((prev) => ({ ...prev, nickname: editNickname.trim() }));
      console.log("이름 변경 성공:", editNickname);
      alert("이름이 성공적으로 변경되었습니다!");
    } catch (error) {
      console.error("이름 변경 중 오류:", error);
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }, [session?.accessToken, session?.isBackendAuthenticated, editNickname, userInfo.nickname]);

  // 세션이 변경되면 회원정보 조회
  useEffect(() => {
    if (session) {
      fetchUserInfo();
    }
  }, [session, fetchUserInfo]);

  const handleEditToggle = async (): Promise<void> => {
    if (isEditMode) {
      // 저장 로직 - 닉네임 변경 API 호출
      await updateUserName();
    } else {
      // 수정 모드로 진입시 현재 닉네임으로 초기화
      setEditNickname(userInfo.nickname);
    }
    setIsEditMode(!isEditMode);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      // 추후 이미지 업로드 API 연결
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserInfo((prev) => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className={styles.profileSection}>
        <div className={styles.profileCard}>
          <div className={styles.loadingMessage}>사용자 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  // 에러 상태
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
              <img src={userInfo.profileImage} alt="프로필" />
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
