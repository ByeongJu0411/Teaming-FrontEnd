"use client";
import { useState, ChangeEvent } from "react";
import Image from "next/image";
import styles from "./createroom.module.css";
import { useSession } from "next-auth/react";

// NextAuth 세션 타입 확장
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    isBackendAuthenticated?: boolean;
    backendError?: {
      hasError: boolean;
      status: number;
      message: string;
      isNetworkError: boolean;
    };
  }
}

// 카카오 SDK 타입 정의
declare global {
  interface Window {
    Kakao?: {
      Share: {
        sendDefault: (options: {
          objectType: string;
          text: string;
          link: {
            webUrl: string;
            mobileWebUrl: string;
          };
        }) => void;
      };
    };
  }
}

// 모달 컴포넌트 Props 타입
interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  roomTitle: string;
}

// 룸 타입 정의
interface RoomType {
  id: string;
  name: string;
  price: string;
  description: string;
  icon: string;
  iconClass: string;
  isElite?: boolean;
}

// CreateRoom Props 타입 (부모 컴포넌트에서 전달받음)
interface CreateRoomProps {
  onRoomCreated?: () => void;
}

// 모달 컴포넌트
const InviteLinkModal = ({ isOpen, onClose, inviteCode }: InviteLinkModalProps) => {
  if (!isOpen) return null;

  const inviteLink = `${window.location.origin}/invite/${inviteCode}`;

  const copyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("초대 코드가 복사되었습니다!");
    } catch (err) {
      console.error("복사 실패:", err);
      alert("복사에 실패했습니다.");
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>티밍룸이 생성되었습니다!</h2>
          <button onClick={onClose} className={styles.modalCloseBtn} type="button">
            ×
          </button>
        </div>

        <div className={styles.inviteLinkSection}>
          <h3 className={styles.inviteLinkTitle}>초대 코드</h3>
          <div className={styles.inviteCodeInfo}>
            <span className={styles.inviteCodeHighlight}>{inviteCode}</span>
          </div>
        </div>

        <div className={styles.modalButtonGroup}>
          <button onClick={copyToClipboard} className={styles.modalButton} type="button">
            초대 코드 복사
          </button>
        </div>

        <div className={styles.modalNotice}>
          <p className={styles.modalNoticeText}>팀원들에게 초대코드를 공유하여 티밍룸에 초대해보세요!</p>
        </div>
      </div>
    </div>
  );
};

export default function CreateRoom({ onRoomCreated }: CreateRoomProps) {
  const { data: session, status } = useSession();

  // 상태 관리
  const [teamCount, setTeamCount] = useState<number>(1);
  const [roomTitle, setRoomTitle] = useState<string>("");
  const [roomSubTitle, setRoomSubTitle] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("/basicProfile.webp");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string>("");

  // 룸 타입 정의
  const roomTypes: RoomType[] = [
    {
      id: "BASIC",
      name: "Basic Room",
      price: "팀원당 2060원",
      description: "메가커피 아이스 아메리카노 1개",
      icon: "/megacoffe.webp",
      iconClass: "megacoffeeIcon",
    },
    {
      id: "STANDARD",
      name: "Standard Room",
      price: "팀원당 4840원",
      description: "스타벅스 아이스 아메리카노 1개",
      icon: "/starbucks.png",
      iconClass: "starbucksIcon",
    },
    {
      id: "ELITE",
      name: "Elite Room",
      price: "팀원당 8240원",
      description: "스타벅스 아이스 아메리카노 1개 + 프렌치 크루아상",
      icon: "/starbucks.png",
      iconClass: "starbucksIcon",
      isElite: true,
    },
  ];

  // 이벤트 핸들러
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

  const handleModalClose = (): void => {
    setShowModal(false);

    if (onRoomCreated) {
      onRoomCreated();
    }

    // 입력 필드 초기화
    setRoomTitle("");
    setRoomSubTitle("");
    setSelectedRoom("");
    setTeamCount(1);
    removeProfileImage();
    setInviteCode("");
  };

  // 이미지 크기 가져오기 함수
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

  // 이미지 업로드 함수 (Intent → S3 → Complete)
  const uploadRoomImage = async (roomId: number): Promise<void> => {
    if (!profileImage || !session?.accessToken) {
      return;
    }

    try {
      const token = session.accessToken;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080";

      console.log("=== 방 이미지 업로드 시작 ===");
      console.log("파일 정보:", {
        name: profileImage.name,
        size: profileImage.size,
        type: profileImage.type,
      });

      // 이미지 크기 가져오기
      const dimensions = await getImageDimensions(profileImage);
      console.log("이미지 크기:", dimensions);

      // 1. Intent API 요청 (ownerType: "ROOM", roomId 추가)
      const requestBody = {
        contentType: profileImage.type,
        byteSize: profileImage.size,
        ownerType: "ROOM",
        roomId: roomId,
      };

      console.log("Intent API 요청 데이터:", requestBody);

      const intentResponse = await fetch(`${backendUrl}/users/me/avatar/intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Intent API 응답 상태:", intentResponse.status);

      if (!intentResponse.ok) {
        const errorText = await intentResponse.text();
        console.error("Intent API 실패:", errorText);
        throw new Error(`이미지 업로드 준비 실패: ${errorText}`);
      }

      const intentData = await intentResponse.json();
      console.log("Intent 성공:", intentData);

      // 2. S3에 파일 업로드 (체크섬 없이)
      console.log("=== S3 업로드 시작 ===");

      const headers: Record<string, string> = {
        "Content-Type": profileImage.type,
      };

      if (intentData.requiredHeaders) {
        Object.keys(intentData.requiredHeaders).forEach((key) => {
          headers[key] = intentData.requiredHeaders[key];
        });
      }

      console.log("최종 업로드 헤더:", headers);

      const s3UploadResponse = await fetch(intentData.url, {
        method: "PUT",
        headers: headers,
        body: profileImage,
      });

      console.log("S3 업로드 응답 상태:", s3UploadResponse.status);

      if (!s3UploadResponse.ok) {
        const errorText = await s3UploadResponse.text();
        console.error("S3 업로드 실패:", errorText);
        throw new Error("이미지 업로드에 실패했습니다.");
      }

      console.log("S3 업로드 성공!");

      // 3. Complete API 호출
      console.log("=== 이미지 업로드 확정 시작 ===");

      const completeBody = {
        key: intentData.key,
        width: dimensions.width,
        height: dimensions.height,
        ownerType: "ROOM",
        roomId: roomId,
      };

      console.log("Complete API 요청 데이터:", completeBody);

      const completeResponse = await fetch(`${backendUrl}/users/me/avatar/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(completeBody),
      });

      console.log("Complete API 응답 상태:", completeResponse.status);

      if (!completeResponse.ok) {
        const errorText = await completeResponse.text();
        console.error("Complete API 실패:", errorText);
        throw new Error("이미지 업로드 확정에 실패했습니다.");
      }

      const completeData = await completeResponse.json();
      console.log("이미지 업로드 완료:", completeData);
    } catch (error) {
      console.error("방 이미지 업로드 오류:", error);
      throw error;
    }
  };

  // 메인 API 호출 함수
  const handleCreateRoom = async (): Promise<void> => {
    // 1. 세션 상태 확인
    if (status === "loading") {
      alert("로그인 상태를 확인 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (status === "unauthenticated" || !session) {
      alert("로그인이 필요합니다. 먼저 로그인해주세요.");
      return;
    }

    // 2. 유효성 검사
    if (!roomTitle.trim()) {
      alert("티밍룸 제목을 입력해주세요.");
      return;
    }

    if (!selectedRoom) {
      alert("티밍룸 타입을 선택해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // 3. 환경 변수 확인
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080";

      // 4. NextAuth 세션에서 JWT 토큰 가져오기
      const token = session?.accessToken;

      if (!token) {
        throw new Error("인증 토큰이 없습니다. 로그인이 필요합니다.");
      }

      // 5. 백엔드 인증 상태 확인
      if (!session?.isBackendAuthenticated) {
        if (session?.backendError?.hasError) {
          throw new Error(session.backendError.message || "백엔드 인증에 실패했습니다.");
        } else {
          throw new Error("백엔드 인증이 완료되지 않았습니다.");
        }
      }

      // 6. JSON 데이터 생성
      const roomData = {
        title: roomTitle,
        description: roomSubTitle || "",
        memberCount: teamCount,
        roomType: roomTitle === "전병주 멋쟁이" ? "DEMO" : selectedRoom,
      };

      console.log("CreateRoom: 방 생성 요청 시작");
      console.log("Request Data:", JSON.stringify(roomData, null, 2));

      // 7. 방 생성 API 호출
      const response = await fetch(`${backendUrl}/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(roomData),
      });

      console.log("CreateRoom: Response Status:", response.status);

      // 8. 응답 처리
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (response.status === 403) {
          throw new Error("접근 권한이 없습니다.");
        } else if (response.status === 405) {
          throw new Error("잘못된 요청 방식입니다. 서버에서 이 방법을 지원하지 않습니다.");
        } else {
          const errorText = await response.text();
          console.error("Error Response:", errorText);
          throw new Error(`서버 오류가 발생했습니다. (${response.status}): ${errorText}`);
        }
      }

      const result = await response.json();
      console.log("CreateRoom: 방 생성 성공:", result);

      // 9. 방 생성 성공 후 이미지 업로드 (프로필 이미지가 있는 경우)
      if (profileImage && result.roomId) {
        console.log("방 이미지 업로드 시작...");
        try {
          await uploadRoomImage(result.roomId);
          console.log("방 이미지 업로드 완료!");
        } catch (imageError) {
          console.error("방 이미지 업로드 실패:", imageError);
          alert("방은 생성되었으나 이미지 업로드에 실패했습니다.");
        }
      }

      // 10. 응답에서 inviteCode 추출
      if (result.inviteCode) {
        setInviteCode(result.inviteCode);
        setShowModal(true);
        console.log("✅ 티밍룸 생성 성공! 모달 표시 중...");
      } else {
        throw new Error("초대 코드를 받지 못했습니다.");
      }
    } catch (error) {
      console.error("티밍룸 생성 실패:", error);
      alert(`티밍룸 생성에 실패했습니다:\n${error}`);
    } finally {
      setIsLoading(false);
    }
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
          type="text"
        />
        <p className={styles.title_title2}>부제목 및 한줄소개</p>
        <input
          className={styles.roomTitleInputUpdated}
          value={roomSubTitle}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomSubTitle(e.target.value)}
          placeholder="부제목 및 한줄소개"
          type="text"
        />
      </div>

      <div className={styles.roomTitle}>
        <p className={styles.title_title}>팀원 수</p>
        <div className={styles.countBoxUpdated}>
          <button className={styles.countBtnUpdated} onClick={() => handleCountChange(false)} type="button">
            -
          </button>
          <div className={styles.countDisplayUpdated}>{teamCount}</div>
          <button className={styles.countBtnUpdated} onClick={() => handleCountChange(true)} type="button">
            +
          </button>
        </div>
      </div>

      <div className={styles.roomTitle}>
        <p className={styles.title_title}>티밍룸 프로필 사진</p>
        <div className={styles.profileImageSection}>
          <div className={styles.profileImageUpload}>
            {profileImagePreview !== "/basicProfile.webp" ? (
              <div className={styles.profileImagePreview}>
                <Image
                  src={profileImagePreview}
                  alt="프로필 미리보기"
                  width={160}
                  height={160}
                  className={styles.profileImage}
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
              {profileImagePreview !== "/basicProfile.webp" ? "사진 변경" : "사진 선택"}
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
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedRoom(room.id);
                }
              }}
            >
              <div className={styles.roomCardContent}>
                <div className={styles.roomCardLeft}>
                  <h3 className={styles.roomCardTitleUpdated}>{room.name}</h3>
                  <p className={styles.roomCardPriceUpdated}>{room.price}</p>
                </div>
                <div className={`${styles.roomCardIcon} ${styles[room.iconClass]}`}>
                  <Image src={room.icon} alt={room.name} width={40} height={40} />
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

      <div className={styles.buttonSection}>
        <button className={styles.createBtnUpdated} onClick={handleCreateRoom} disabled={isLoading} type="button">
          {isLoading ? (
            <span className={styles.loading}>
              <span className={styles.loadingSpinner}></span>
              생성 중...
            </span>
          ) : (
            "티밍룸 생성하기"
          )}
        </button>
      </div>

      <InviteLinkModal isOpen={showModal} onClose={handleModalClose} inviteCode={inviteCode} roomTitle={roomTitle} />
    </div>
  );
}
