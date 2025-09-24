/* eslint-disable @next/next/no-img-element */
import styles from "../signup.module.css";

interface ProfileImageStepProps {
  profileImage: File | null;
  setProfileImage: (image: File | null) => void;
  previewUrl: string;
  setPreviewUrl: (url: string) => void;
}

export default function ProfileImageStep({
  profileImage,
  setProfileImage,
  previewUrl,
  setPreviewUrl,
}: ProfileImageStepProps) {
  // 프로필 이미지 선택
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 제거
  const handleRemoveImage = () => {
    setProfileImage(null);
    setPreviewUrl("");
    // 파일 input 리셋
    const fileInput = document.getElementById("profile-image-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div>
      <h2>프로필 사진</h2>
      <p>프로필에 사용할 사진을 선택해주세요.</p>

      <div className={styles.profileImageContainer}>
        <img src={previewUrl || "/basicProfile.webp"} alt="프로필 미리보기" className={styles.profileImage} />
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className={styles.hiddenInput}
        id="profile-image-input"
      />

      <label htmlFor="profile-image-input" className={`${styles.button} ${styles.buttonPrimary} ${styles.fileLabel}`}>
        사진 선택하기
      </label>

      {profileImage && (
        <button type="button" onClick={handleRemoveImage} className={`${styles.button} ${styles.buttonSecondary}`}>
          사진 제거
        </button>
      )}

      <div className={styles.profileTip}>
        <p className={styles.profileTipTitle}>💡 선택사항입니다</p>
        <p>프로필 사진은 나중에 마이페이지에서 언제든지 설정하실 수 있습니다.</p>
      </div>
    </div>
  );
}
