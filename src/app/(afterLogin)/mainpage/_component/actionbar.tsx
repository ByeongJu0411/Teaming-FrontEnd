"use client";

import { JSX, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
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
  role: "LEADER" | "MEMBER";
  unreadCount: number;
  lastMessage: LastMessage;
  title: string;
  imageKey: string;
  imageVersion: number;
  type: "BASIC" | "STANDARD" | "ELITE";
  memberCount: number;
  success: boolean;
  members: Member[];
}

interface Room {
  id: string;
  name: string;
  lastChat: string;
  unreadCount?: number;
  memberCount?: number;
  members?: Member[];
  type?: "BASIC" | "STANDARD" | "ELITE";
  role?: "LEADER" | "MEMBER";
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

// WebSocket 이벤트 타입 정의
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

  const navItems: string[] = ["티밍룸 생성", "티밍룸 찾기", "마이페이지"];

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

      const convertedRooms: Room[] = data.map((room) => ({
        id: room.roomId?.toString() || "0",
        name: room.title || "제목 없음",
        lastChat: room.lastMessage?.content || "메시지가 없습니다",
        unreadCount: room.unreadCount || 0,
        memberCount: room.memberCount || 0,
        members: room.members || [],
        type: room.type || "BASIC",
        role: room.role || "MEMBER",
      }));

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
      console.log("ActionBar: WebSocket Connected");

      // 개인 방 이벤트 구독 (lastMessage 업데이트)
      client.subscribe("/user/queue/room-events", (message: IMessage) => {
        try {
          const event: UserRoomEvent = JSON.parse(message.body);
          console.log("ActionBar: 방 이벤트 수신:", event);

          // 방 목록에서 해당 방의 lastChat 업데이트
          setRooms((prevRooms) =>
            prevRooms.map((room) => {
              if (room.id === event.roomId.toString()) {
                return {
                  ...room,
                  lastChat: event.lastMessage?.content || room.lastChat,
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
    console.log("ActionBar: 전달되는 멤버 정보:", room.members);
    onRoomSelect(room);
    setSelectedItem(null);
  };

  const handleHomeClick = (): void => {
    setSelectedItem(null);
    onMenuSelect("");
  };

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
              {/*<div className={styles.unreadBadge}>{room.unreadCount}</div>*/}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
