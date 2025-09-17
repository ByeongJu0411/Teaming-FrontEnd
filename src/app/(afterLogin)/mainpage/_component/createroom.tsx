"use client";
import { useState, ChangeEvent, JSX } from "react";
import styles from "./createroom.module.css";
import Image from "next/image";

export default function CreateRoom() {
  const [teamCount, setTeamCount] = useState<number>(1);
  const [roomTitle, setRoomTitle] = useState<string>("");
  const [roomSubTitle, setRoomSubTitle] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("/basicProfile.webp");

  const handleCountChange = (increment: boolean): void => {
    if (increment) {
      setTeamCount((prev) => prev + 1);
    } else {
      setTeamCount((prev) => Math.max(1, prev - 1));
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          setProfileImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = (): void => {
    setProfileImage(null);
    setProfileImagePreview("/basicProfile.webp");
  };

  interface RoomType {
    id: string;
    name: string;
    price: string;
    description: string;
    icon: string;
    iconClass: string;
    isElite?: boolean;
  }

  const roomTypes: RoomType[] = [
    {
      id: "basic",
      name: "Basic Room",
      price: "팀원당 2060원",
      description: "메가커피 아이스 아메리카노 1개",
      icon: "/megacoffe.webp",
      iconClass: "megacoffeeIcon",
    },
    {
      id: "standard",
      name: "Standard Room",
      price: "팀원당 4841원",
      description: "스타벅스 아이스 아메리카노 1개",
      icon: "/starbucks.png",
      iconClass: "starbucksIcon",
    },
    {
      id: "elite",
      name: "Elite Room",
      price: "팀원당 2060원",
      description: "스타벅스 아이스 음료 1개 + 프렌치 크루아상",
      icon: "/starbucks.png",
      iconClass: "starbucksIcon",
      isElite: true,
    },
  ];

  // teamCount만큼 초대 입력 섹션을 렌더링
  const renderInviteSections = (): JSX.Element[] => {
    return Array.from({ length: teamCount }, (_, index) => (
      <div key={index} className={styles.inviteInputSection}>
        <input className={styles.inviteInputUpdated} placeholder={`팀원 ${index + 1}의 이메일을 입력해주세요.`} />
        <div className={styles.inviteButton}>초대코드 발송</div>
      </div>
    ));
  };

  return (
    <div className={styles.createRoom}>
      <p className={styles.titleUpdated}>티밍룸 생성</p>

      <div className={styles.roomTitle}>
        <p className={styles.title_title}>티밍룸 제목</p>
        <input
          className={styles.roomTitleInputUpdated}
          value={roomTitle}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomTitle(e.target.value)}
          placeholder="티밍룸 제목"
        />
        <p className={styles.title_title2}>부제목 및 한줄소개</p>
        <input
          className={styles.roomTitleInputUpdated}
          value={roomSubTitle}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomSubTitle(e.target.value)}
          placeholder="부제목 및 한줄소개"
        />
      </div>

      <div className={styles.roomTitle}>
        <p className={styles.title_title}>팀원 수</p>
        <div className={styles.countBoxUpdated}>
          <button className={styles.countBtnUpdated} onClick={() => handleCountChange(false)}>
            -
          </button>
          <div className={styles.countDisplayUpdated}>{teamCount}</div>
          <button className={styles.countBtnUpdated} onClick={() => handleCountChange(true)}>
            +
          </button>
        </div>
      </div>

      {/* 새로 추가된 프로필 사진 설정 섹션 */}
      <div className={styles.roomTitle}>
        <p className={styles.title_title}>티밍룸 프로필 사진</p>
        <div className={styles.profileImageSection}>
          <div className={styles.profileImageUpload}>
            {profileImagePreview ? (
              <div className={styles.profileImagePreview}>
                <Image
                  src={profileImagePreview}
                  alt="프로필 미리보기"
                  width={80}
                  height={80}
                  className={styles.profileImage}
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            ) : (
              <div className={styles.profileImagePlaceholder}>
                <div className={styles.profileImageIcon}>📷</div>
                <p className={styles.profileImageText}>프로필 사진 추가</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className={styles.profileImageInput}
              id="profileImageInput"
            />
          </div>
          <div className={styles.profileImageButton}>
            <label htmlFor="profileImageInput" className={styles.profileImageLabel}>
              {profileImagePreview ? "사진 변경" : "사진 선택"}
            </label>
            <button className={styles.removeImageBtn} onClick={removeProfileImage} type="button">
              초기화
            </button>
          </div>
          <div className={styles.profileImageInfo}>
            <p className={styles.profileImageInfoText}>• 권장 크기: 500x500px</p>
            <p className={styles.profileImageInfoText}>• 지원 형식: JPG, PNG, GIF</p>
            <p className={styles.profileImageInfoText}>• 최대 크기: 5MB</p>
          </div>
        </div>
      </div>

      <div className={styles.roomTypeSection}>
        <p className={styles.sectionTitleUpdated}>티밍룸 설정</p>
        <div className={styles.roomTypeGrid}>
          {roomTypes.map((room) => (
            <div
              key={room.id}
              className={`${styles.roomCard} ${room.isElite ? styles.eliteRoomCard : ""} ${
                selectedRoom === room.id ? styles.selected : ""
              }`}
              onClick={() => setSelectedRoom(room.id)}
            >
              <div className={styles.roomCardContent}>
                <div className={styles.roomCardLeft}>
                  <h3 className={styles.roomCardTitleUpdated}>{room.name}</h3>
                  <p className={styles.roomCardPriceUpdated}>{room.price}</p>
                </div>
                <div className={`${styles.roomCardIcon} ${styles[room.iconClass]}`}>
                  <Image
                    src={room.icon}
                    alt={room.name}
                    width={40}
                    height={40}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>
              </div>
              <p className={styles.roomCardDescriptionUpdated}>{room.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.noticeSection}>
        <div className={styles.noticeBox}>
          <div className={styles.noticeIcon}>💡</div>
          <div className={styles.noticeContent}>
            <p className={styles.noticeTitle}>방 입장 시, 팀원 수에 따라 해당 기프티콘을 결제해야 합니다.</p>
            <p className={styles.noticeSubtext}>만약 패널티를 받지 않는다면 이후 완료 후에 전액 환불됩니다.</p>
          </div>
        </div>
      </div>

      <div className={styles.inviteSection}>
        <p className={styles.inviteSectionTitle}>팀원 초대하기</p>
        {renderInviteSections()}
      </div>

      <div className={styles.buttonSection}>
        <button className={styles.createBtnUpdated}>티밍룸 생성하기</button>
      </div>
    </div>
  );
}
