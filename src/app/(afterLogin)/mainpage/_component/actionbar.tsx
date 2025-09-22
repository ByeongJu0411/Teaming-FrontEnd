"use client";

import { JSX, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./actionbar.module.css";

// API 응답 타입 정의
interface Member {
  memberId: number;
  lastReadMessageId: number;
  name: string;
  avatarKey: string;
  avatarVersion: number;
  roomRole: "LEADER" | string;
}

interface LastMessage {
  id: number;
  type: "TEXT" | string;
  content: string;
  sender: {
    id: number;
    name: string;
    avatarUrl: string;
  };
  createdAt: string;
}

interface RoomData {
  roomId: number;
  unreadCount: number;
  lastMessage: LastMessage;
  title: string;
  imageKey: string;
  imageVersion: number;
  type: "BASIC" | string;
  memberCount: number;
  success: boolean;
  members: Member[];
}

// Props에서 사용하는 Room 타입 (기존과 호환성 유지)
interface Room {
  id: string;
  name: string;
  lastChat: string;
  unreadCount?: number;
  memberCount?: number;
}

interface ActionBarProps {
  onMenuSelect: (menu: string) => void;
  onRoomSelect: (room: Room) => void;
  selectedRoom: Room | null;
  userInfo?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function ActionBar({ onMenuSelect, onRoomSelect, selectedRoom }: ActionBarProps): JSX.Element {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const navItems: string[] = ["티밍룸 생성", "티밍룸 찾기", "마이페이지"];

  // 시간 포맷팅 함수
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return "방금";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;

    return date.toLocaleDateString();
  };
  // API에서 채팅방 목록 가져오기
  const fetchRooms = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // 세션에서 JWT 토큰 가져오기
      const token = session?.accessToken;

      // 토큰 상태 상세 로깅
      console.log("ActionBar: 전체 세션 정보:", session);
      console.log("ActionBar: 토큰 존재 여부:", !!token);
      console.log("ActionBar: 토큰 길이:", token?.length);
      console.log("ActionBar: 백엔드 인증 상태:", session?.isBackendAuthenticated);

      if (!token) {
        console.error("ActionBar: 토큰이 없음");
        throw new Error("인증 토큰이 없습니다. 로그인이 필요합니다.");
      }

      // 백엔드 인증 상태 확인
      if (!session?.isBackendAuthenticated) {
        console.error("ActionBar: 백엔드 인증되지 않음");
        if (session?.backendError?.hasError) {
          throw new Error(session.backendError.message || "백엔드 인증에 실패했습니다.");
        } else {
          throw new Error("백엔드 인증이 완료되지 않았습니다.");
        }
      }

      console.log("ActionBar: 요청 시작");
      console.log("ActionBar: URL:", `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/rooms`);
      console.log("ActionBar: Token exists:", !!token);

      // 스웨거 스펙에 맞게 헤더 최소화
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/rooms`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          // Content-Type 제거 - GET 요청에는 필요없음
        },
      });

      console.log("ActionBar: Response status:", response.status);
      console.log("ActionBar: Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ActionBar: Error response:", errorText);

        if (response.status === 400) {
          throw new Error(`잘못된 요청입니다: ${errorText}`);
        } else if (response.status === 401) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (response.status === 403) {
          throw new Error(`접근 권한이 없습니다: ${errorText}`);
        } else {
          throw new Error(`서버 오류가 발생했습니다. (${response.status}): ${errorText}`);
        }
      }

      const responseText = await response.text();
      console.log("ActionBar: Raw response:", responseText);

      let data: RoomData[];
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("ActionBar: JSON parse error:", parseError);
        throw new Error("서버 응답을 파싱할 수 없습니다.");
      }

      console.log("ActionBar: Parsed data:", data);

      // 배열 확인
      if (!Array.isArray(data)) {
        console.error("ActionBar: Response is not an array:", typeof data);
        throw new Error("서버 응답이 배열 형식이 아닙니다.");
      }

      // 멤버 정보 디버깅 추가
      console.log("ActionBar: 방 목록과 멤버 정보:");
      data.forEach((room, index) => {
        console.log(`방 ${index + 1} (ID: ${room.roomId}):`, room.title);
        console.log(`  - 멤버 수: ${room.memberCount}`);
        console.log(`  - 멤버 목록:`, room.members);

        if (room.members && room.members.length > 0) {
          room.members.forEach((member, memberIndex) => {
            console.log(
              `    멤버 ${memberIndex + 1}: ID(${member.memberId}), 이름(${member.name}), 역할(${member.roomRole})`
            );
          });
        } else {
          console.log("    멤버 정보 없음");
        }
        console.log("---");
      });

      // 안전한 데이터 변환
      const convertedRooms: Room[] = data.map((room) => ({
        id: room.roomId?.toString() || "0",
        name: room.title || "제목 없음",
        lastChat: room.lastMessage?.content || "메시지가 없습니다",
        unreadCount: room.unreadCount || 0,
        memberCount: room.memberCount || 0,
      }));

      console.log("ActionBar: Converted rooms:", convertedRooms);
      setRooms(convertedRooms);
    } catch (err) {
      console.error("ActionBar: 채팅방 목록을 가져오는데 실패했습니다:", err);
      setError(err instanceof Error ? err.message : "채팅방 목록을 불러올 수 없습니다");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트시 및 세션 변경시 채팅방 목록 가져오기
  useEffect(() => {
    if (session) {
      fetchRooms();
    }
  }, [session]);

  const handleItemClick = (item: string): void => {
    setSelectedItem(item);
    onMenuSelect(item);
  };

  const handleRoomClick = (room: Room): void => {
    onRoomSelect(room);
    setSelectedItem(null);
  };

  const handleHomeClick = (): void => {
    setSelectedItem(null);
    onMenuSelect("");
  };

  // 사용자 정보 추출
  const userImage = session?.user?.image;
  const userName = session?.user?.name || "사용자";

  return (
    <div className={styles.actionBar}>
      <div className={styles.header} onClick={handleHomeClick}>
        Teaming
      </div>
      <div className={styles.navBar}>
        <div className={styles.userInfo}>
          <div className={styles.userImg}>
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt="사용자 프로필" className={styles.profileImage} />
            ) : (
              <div className={styles.defaultAvatar}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className={styles.userName}>{userName}님</div>
        </div>
        <div className={styles.navItem}>
          {navItems.map((item) => (
            <p
              key={item}
              className={`${styles.Item} ${selectedItem === item ? styles.selected : ""}`}
              onClick={() => handleItemClick(item)}
            >
              {item}
            </p>
          ))}
        </div>
      </div>
      <div className={styles.roomList}>
        {loading ? (
          <div className={styles.loadingMessage}>채팅방을 불러오는 중...</div>
        ) : error ? (
          <div className={styles.errorMessage}>
            <p>{error}</p>
            <button onClick={fetchRooms} className={styles.retryButton}>
              다시 시도
            </button>
          </div>
        ) : rooms.length === 0 ? (
          <div className={styles.emptyMessage}>참여한 채팅방이 없습니다</div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className={`${styles.roomItem} ${selectedRoom?.id === room.id ? styles.selectedRoom : ""}`}
              onClick={() => handleRoomClick(room)}
            >
              <div className={styles.roomImg}></div>
              <div className={styles.roomInfo}>
                <div className={styles.roomHeader}>
                  <p className={styles.roomName}>{room.name}</p>
                </div>
                <div className={styles.roomDetails}>
                  <p className={styles.lastChat}>{room.lastChat}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
