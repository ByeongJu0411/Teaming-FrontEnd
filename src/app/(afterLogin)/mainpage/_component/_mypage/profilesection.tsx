/* eslint-disable @next/next/no-img-element */
"use client";
import styles from "./profilesection.module.css";

import { useState } from "react";
interface UserInfo {
  email: string;
  nickname: string;
  profileImage: string;
  joinDate: string;
  emailVerified: boolean;
}
export default function ProfileSection() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: "user@example.com",
    nickname: "티밍유저",
    profileImage: "/images/default-avatar.png",
    joinDate: "2024.03.15",
    emailVerified: true,
  });
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editNickname, setEditNickname] = useState<string>(userInfo.nickname);

  const handleEditToggle = (): void => {
    if (isEditMode) {
      // 저장 로직
      setUserInfo({ ...userInfo, nickname: editNickname });
      console.log("닉네임 변경:", editNickname);
    }
    setIsEditMode(!isEditMode);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserInfo({ ...userInfo, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.profileSection}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatar}>
              <img src="/basicProfile.webp" alt="프로필" />
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
