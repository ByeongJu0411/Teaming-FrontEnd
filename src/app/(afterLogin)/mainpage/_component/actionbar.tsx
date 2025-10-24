"use client";

import { JSX, useState, useEffect, useCallback } from "react";
import { Room, Member } from "@/types/room";
import { useSession } from "next-auth/react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import styles from "./actionbar.module.css";

// API 응답 타입 정의

interface LastMessage {
  id: number;
  type: "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO" | "SYSTEM_NOTICE";
  content: string;
  sender: {
    id: number;
    name: string;
    avatarUrl: string;
    avatarVersion: number;
  };
  createdAt: string;
}

interface RoomData {
  roomId: number;
  role: "LEADER" | "MEMBER";
  unreadCount: number;
  lastMessage: LastMessage;
  title: string;
  imageKey: string;
  imageVersion: number;
  type: "BASIC" | "STANDARD" | "ELITE" | "DEMO";
  memberCount: number;
  success: boolean;
  members: Member[];
  avatarUrl: string;
  paymentStatus: "PAID" | "NOT_PAID"; // 추가됨
}

// 사용자 정보 API 응답 타입
interface UserInfoResponse {
  email: string;
  name: string;
  avatarKey: string;
  avatarVersion: number;
  avatarUrl?: string;
}

interface ActionBarProps {
  onMenuSelect: (menu: string) => void;
  onRoomSelect: (room: Room) => void;
  selectedRoom: Room | null;
  refreshTrigger?: number;
  userInfo?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface UserRoomEvent {
  roomId: number;
  unreadCount: number;
  lastMessage: {
    id: number;
    type: "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO" | "SYSTEM_NOTICE";
    content: string | null;
    sender: {
      id: number | null;
      name: string;
      avatarUrl: string | null;
    };
    createdAt: string;
  } | null;
}

export default function ActionBar({
  onMenuSelect,
  onRoomSelect,
  selectedRoom,
  refreshTrigger,
}: ActionBarProps): JSX.Element {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false);
  const { data: session } = useSession();

  // 자체 로그인 사용자 정보 상태 추가
  const [credentialsUserInfo, setCredentialsUserInfo] = useState<{
    name: string;
    image: string;
  } | null>(null);

  const navItems: string[] = ["티밍룸 생성", "티밍룸 찾기", "마이페이지"];

  // 자체 로그인 사용자 정보 조회
  const fetchCredentialsUserInfo = useCallback(async (): Promise<void> => {
    if (!session?.accessToken || !session?.isBackendAuthenticated) {
      return;
    }

    // 소셜 로그인이면 조회 안 함
    if (session.provider && session.provider !== "credentials") {
      return;
    }

    try {
      console.log("ActionBar: 자체 로그인 사용자 정보 조회 시작");

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        console.error("ActionBar: 사용자 정보 조회 실패:", response.status);
        return;
      }

      const data: UserInfoResponse = await response.json();
      console.log("ActionBar: 사용자 정보 조회 성공:", data);

      setCredentialsUserInfo({
        name: data.name,
        image: data.avatarUrl || "/basicProfile.webp",
      });
    } catch (err) {
      console.error("ActionBar: 사용자 정보 조회 오류:", err);
    }
  }, [session?.accessToken, session?.isBackendAuthenticated, session?.provider]);

  // 세션이 변경될 때 사용자 정보 조회
  useEffect(() => {
    if (session && session.provider === "credentials") {
      fetchCredentialsUserInfo();
    }
  }, [session, fetchCredentialsUserInfo]);

  // 사용자 정보 업데이트 이벤트 리스너 추가
  useEffect(() => {
    const handleUserInfoUpdate = () => {
      console.log("ActionBar: 사용자 정보 업데이트 이벤트 감지, 사용자 정보 새로고침");
      if (session?.provider === "credentials") {
        fetchCredentialsUserInfo();
      }
    };

    // 이벤트 리스너 등록 (아바타 업데이트 & 이름 업데이트)
    window.addEventListener("userAvatarUpdated", handleUserInfoUpdate);
    window.addEventListener("userNameUpdated", handleUserInfoUpdate);

    // 클린업 함수
    return () => {
      window.removeEventListener("userAvatarUpdated", handleUserInfoUpdate);
      window.removeEventListener("userNameUpdated", handleUserInfoUpdate);
    };
  }, [session?.provider, fetchCredentialsUserInfo]);

  const fetchRooms = useCallback(async (): Promise<void> => {
    if (!session?.accessToken || !session?.isBackendAuthenticated) {
      console.log("ActionBar: 세션 또는 토큰이 없어서 API 호출하지 않음");
      setHasInitialLoad(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = session.accessToken;
      console.log("ActionBar: API 요청 시작");

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/rooms`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("ActionBar: Response status:", response.status);

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

      if (!Array.isArray(data)) {
        console.error("ActionBar: Response is not an array:", typeof data);
        throw new Error("서버 응답이 배열 형식이 아닙니다.");
      }

      const convertedRooms: Room[] = data.map((room) => {
        const membersWithAvatarUrl = room.members.map((member) => ({
          ...member,
          avatarUrl: member.avatarUrl || "",
        }));

        const roomImageUrl = room.avatarUrl || "/good_space1.jpg";

        return {
          id: room.roomId?.toString() || "0",
          name: room.title || "제목 없음",
          lastChat: room.lastMessage?.content || "메시지가 없습니다",
          unreadCount: room.unreadCount || 0,
          memberCount: room.memberCount || 0,
          members: membersWithAvatarUrl,
          type: room.type || "BASIC",
          role: room.role || "MEMBER",
          roomImageUrl: roomImageUrl,
          success: room.success || false,
          paymentStatus: room.paymentStatus || "NOT_PAID", // 추가됨
        };
      });

      console.log("ActionBar: 방 개수:", convertedRooms.length);
      setRooms(convertedRooms);
    } catch (err) {
      console.error("ActionBar: 채팅방 목록을 가져오는데 실패했습니다:", err);
      setError(err instanceof Error ? err.message : "채팅방 목록을 불러올 수 없습니다");
      setRooms([]);
    } finally {
      setLoading(false);
      setHasInitialLoad(true);
    }
  }, [session?.accessToken, session?.isBackendAuthenticated]);

  // WebSocket으로 방 목록 실시간 업데이트
  useEffect(() => {
    if (!session?.accessToken) return;

    const wsUrl = `${
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"
    }/ws-sockjs?token=${encodeURIComponent(session.accessToken)}`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      debug: (str: string) => {
        console.log("ActionBar STOMP Debug:", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      client.subscribe("/user/queue/room-events", (message: IMessage) => {
        try {
          const event: UserRoomEvent = JSON.parse(message.body);
          console.log("ActionBar: 방 이벤트 수신:", event);

          setRooms((prevRooms) =>
            prevRooms.map((room) => {
              if (room.id === event.roomId.toString()) {
                // ✅ lastMessage가 있을 때만 업데이트
                const newLastChat = event.lastMessage?.content ? event.lastMessage.content : room.lastChat;

                return {
                  ...room,
                  lastChat: newLastChat,
                  unreadCount: event.unreadCount,
                };
              }
              return room;
            })
          );
        } catch (error) {
          console.error("ActionBar: 방 이벤트 파싱 오류:", error);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error("ActionBar STOMP Error:", frame.headers["message"]);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [session?.accessToken]);

  useEffect(() => {
    if (session && !hasInitialLoad) {
      console.log("ActionBar: 초기 로딩");
      fetchRooms();
    }
  }, [session, hasInitialLoad, fetchRooms]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && hasInitialLoad) {
      console.log("ActionBar: 방 생성으로 인한 새로고침, refreshTrigger:", refreshTrigger);
      fetchRooms();
    }
  }, [refreshTrigger, hasInitialLoad, fetchRooms]);

  const handleItemClick = (item: string): void => {
    setSelectedItem(item);
    onMenuSelect(item);
  };

  const handleRoomClick = (room: Room): void => {
    console.log("ActionBar: 방 선택됨:", room.name);
    console.log("ActionBar: 결제 상태:", room.paymentStatus); // 추가됨
    console.log("ActionBar: 전달되는 멤버 정보:", room.members);

    // 결제 상태와 함께 방으로 입장 (결제 모달은 방 내부에서 처리)
    onRoomSelect(room);
    setSelectedItem(null);
  };

  const handleHomeClick = (): void => {
    setSelectedItem(null);
    onMenuSelect("");
  };

  // 사용자 이미지와 이름 결정 로직
  const userImage = session?.provider === "credentials" ? credentialsUserInfo?.image : session?.user?.image;

  const userName =
    session?.provider === "credentials" ? credentialsUserInfo?.name || "사용자" : session?.user?.name || "사용자";

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
              <div className={styles.roomImg}>
                {room.roomImageUrl && room.roomImageUrl !== "/good_space1.jpg" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={room.roomImageUrl}
                    alt={room.name}
                    className={styles.roomImage}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.src = "/good_space1.jpg";
                    }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/good_space1.jpg" alt="기본 프로필" className={styles.roomImage} />
                )}
              </div>
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
