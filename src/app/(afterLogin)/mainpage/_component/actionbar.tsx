"use client";

import { JSX, useState, useEffect, useCallback, useRef } from "react";
import { Room, Member } from "@/types/room";
import { useSession } from "next-auth/react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import styles from "./actionbar.module.css";

// ✅ 백엔드 API 응답 타입 정의 - type이 객체 형태
interface RoomTypeInfo {
  typeName: string;
  price: number;
  description: string;
}

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
  type: RoomTypeInfo;
  memberCount: number;
  success: boolean;
  members: Member[];
  avatarUrl: string;
  paymentStatus: "PAID" | "NOT_PAID";
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

  // 🔥 WebSocket 재연결 방지: useRef로 현재 선택된 방 추적
  const selectedRoomRef = useRef<Room | null>(selectedRoom);

  // 통합된 사용자 정보 상태 (자체 로그인 + 소셜 로그인 모두 사용)
  const [userInfo, setUserInfo] = useState<{
    name: string;
    image: string;
  } | null>(null);

  const navItems: string[] = ["티밍룸 생성", "티밍룸 찾기", "마이페이지"];

  // 🔥 selectedRoom이 변경될 때 ref 업데이트
  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  // 통합된 사용자 정보 조회 함수 (자체/소셜 로그인 모두 처리)
  const fetchUserInfo = useCallback(async (): Promise<void> => {
    if (!session?.accessToken || !session?.isBackendAuthenticated) {
      return;
    }

    try {
      console.log("ActionBar: 사용자 정보 조회 시작", {
        provider: session.provider,
      });

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

      setUserInfo({
        name: data.name,
        image: data.avatarUrl || "/basicProfile.webp",
      });
    } catch (err) {
      console.error("ActionBar: 사용자 정보 조회 오류:", err);
    }
  }, [session?.accessToken, session?.isBackendAuthenticated, session?.provider]);

  // 세션이 변경될 때 사용자 정보 조회 (모든 로그인 타입)
  useEffect(() => {
    if (session) {
      fetchUserInfo();
    }
  }, [session, fetchUserInfo]);

  // ✅ 사용자 정보 & 채팅 메시지 업데이트 이벤트 리스너
  useEffect(() => {
    const handleUserInfoUpdate = () => {
      console.log("ActionBar: 사용자 정보 업데이트 이벤트 감지");
      fetchUserInfo();
    };

    // ✅ 채팅 메시지 수신 시 방 목록 실시간 업데이트
    const handleRoomUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { roomId, lastMessage, isMyMessage } = customEvent.detail;

      console.log("🔔 ActionBar: 커스텀 이벤트로 방 업데이트 수신:", customEvent.detail);

      setRooms((prevRooms) => {
        const updatedRooms = prevRooms.map((room) => {
          if (room.id === roomId.toString()) {
            // 현재 선택된 방이 아니고, 내가 보낸 메시지가 아니면 unreadCount 증가
            const shouldIncreaseUnread = selectedRoom?.id !== room.id && !isMyMessage;

            console.log("✅ ActionBar: 방 업데이트!", {
              roomId,
              roomName: room.name,
              oldLastChat: room.lastChat,
              newLastChat: lastMessage?.content,
              oldUnreadCount: room.unreadCount,
              shouldIncreaseUnread,
              isSelectedRoom: selectedRoom?.id === room.id,
              isMyMessage,
            });

            return {
              ...room,
              lastChat: lastMessage?.content || room.lastChat,
              lastMessageTime: lastMessage?.createdAt || room.lastMessageTime,
              unreadCount: shouldIncreaseUnread ? (room.unreadCount || 0) + 1 : room.unreadCount || 0,
            };
          }
          return room;
        });

        // 최신 메시지 순으로 정렬
        const sortedRooms = [...updatedRooms].sort((a, b) => {
          const timeA = a.lastMessageTime || "";
          const timeB = b.lastMessageTime || "";
          return timeB.localeCompare(timeA);
        });

        return sortedRooms;
      });
    };

    // ✅ unreadCount 리셋 이벤트 핸들러 추가
    const handleResetUnreadCount = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { roomId } = customEvent.detail;

      console.log("🔄 ActionBar: unreadCount 리셋 요청:", roomId);

      setRooms((prevRooms) =>
        prevRooms.map((room) => (room.id === roomId.toString() ? { ...room, unreadCount: 0 } : room))
      );
    };

    // 이벤트 리스너 등록
    window.addEventListener("userAvatarUpdated", handleUserInfoUpdate);
    window.addEventListener("userNameUpdated", handleUserInfoUpdate);
    window.addEventListener("actionBarRoomUpdate", handleRoomUpdate);
    window.addEventListener("resetUnreadCount", handleResetUnreadCount);

    // 클린업
    return () => {
      window.removeEventListener("userAvatarUpdated", handleUserInfoUpdate);
      window.removeEventListener("userNameUpdated", handleUserInfoUpdate);
      window.removeEventListener("actionBarRoomUpdate", handleRoomUpdate);
      window.removeEventListener("resetUnreadCount", handleResetUnreadCount);
    };
  }, [fetchUserInfo, selectedRoom?.id]);

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

        const normalizeRoomType = (typeName: string): "BASIC" | "STANDARD" | "ELITE" | "DEMO" => {
          const typeNameUpper = typeName.toUpperCase();

          if (typeNameUpper.includes("BASIC")) return "BASIC";
          if (typeNameUpper.includes("STANDARD")) return "STANDARD";
          if (typeNameUpper.includes("ELITE")) return "ELITE";
          if (typeNameUpper.includes("DEMO")) return "DEMO";

          return "BASIC";
        };

        const roomType = room.type?.typeName ? normalizeRoomType(room.type.typeName) : "BASIC";

        return {
          id: room.roomId?.toString() || "0",
          name: room.title || "제목 없음",
          lastChat: room.lastMessage?.content || "메시지가 없습니다",
          unreadCount: room.unreadCount || 0,
          memberCount: room.memberCount || 0,
          members: membersWithAvatarUrl,
          type: roomType,
          role: room.role || "MEMBER",
          roomImageUrl: roomImageUrl,
          success: room.success || false,
          paymentStatus: room.paymentStatus || "NOT_PAID",
          roomTypeInfo: room.type || undefined,
          lastMessageTime: room.lastMessage?.createdAt || new Date().toISOString(), // ✅ 정렬용
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

  // WebSocket으로 방 목록 실시간 업데이트 (서버 이벤트용)
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
      console.log("=== ActionBar: WebSocket 연결 성공 ===");

      client.subscribe("/user/queue/room-events", (message: IMessage) => {
        try {
          console.log("🔔 ActionBar: 서버에서 방 이벤트 수신 (Raw):", message.body);
          const event: UserRoomEvent = JSON.parse(message.body);
          console.log("🔔 ActionBar: 파싱된 이벤트:", {
            roomId: event.roomId,
            unreadCount: event.unreadCount,
            lastMessage: event.lastMessage,
          });

          setRooms((prevRooms) => {
            console.log(
              "📋 WebSocket - 현재 방 목록:",
              prevRooms.map((r) => ({ id: r.id, name: r.name, unreadCount: r.unreadCount }))
            );

            const updatedRooms = prevRooms.map((room) => {
              if (room.id === event.roomId.toString()) {
                // 🔥 핵심 수정: useRef로 현재 선택된 방 확인 (WebSocket 재연결 방지)
                const isCurrentlySelectedRoom = selectedRoomRef.current?.id === room.id;

                console.log("✅ ActionBar WebSocket: 방 업데이트!", {
                  roomId: event.roomId,
                  roomName: room.name,
                  oldUnreadCount: room.unreadCount,
                  newUnreadCount: event.unreadCount,
                  oldLastChat: room.lastChat,
                  newLastChat: event.lastMessage?.content,
                  isCurrentlySelectedRoom,
                  willUpdateUnreadCount: !isCurrentlySelectedRoom,
                });

                return {
                  ...room,
                  lastChat: event.lastMessage?.content || room.lastChat,
                  // 🔥 선택된 방이면 기존 unreadCount 유지, 아니면 서버 값으로 업데이트
                  unreadCount: isCurrentlySelectedRoom ? room.unreadCount : event.unreadCount,
                  lastMessageTime: event.lastMessage?.createdAt || room.lastMessageTime,
                };
              }
              return room;
            });

            const sortedRooms = [...updatedRooms].sort((a, b) => {
              const timeA = a.lastMessageTime || "";
              const timeB = b.lastMessageTime || "";
              return timeB.localeCompare(timeA);
            });

            console.log(
              "📋 WebSocket - 업데이트된 방 목록:",
              sortedRooms.map((r) => ({ id: r.id, name: r.name, unreadCount: r.unreadCount }))
            );
            return sortedRooms;
          });
        } catch (error) {
          console.error("ActionBar: 방 이벤트 파싱 오류:", error);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error("ActionBar STOMP Error:", frame.headers["message"]);
    };

    client.onWebSocketClose = () => {
      console.log("ActionBar: WebSocket 연결 종료");
    };

    client.activate();

    return () => {
      console.log("ActionBar: WebSocket 연결 해제");
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
      console.log("ActionBar: 방 생성으로 인한 새로고침");
      fetchRooms();
    }
  }, [refreshTrigger, hasInitialLoad, fetchRooms]);

  const handleItemClick = (item: string): void => {
    setSelectedItem(item);
    onMenuSelect(item);
  };

  const handleRoomClick = (room: Room): void => {
    console.log("🖱️ 방 클릭:", room.name, "현재 unreadCount:", room.unreadCount);

    // 방 선택
    onRoomSelect(room);
    setSelectedItem(null);

    // unreadCount를 즉시 0으로 리셋
    if (room.unreadCount !== undefined && room.unreadCount > 0) {
      console.log("✅ 방 클릭 - unreadCount 0으로 리셋:", room.id);
      setRooms((prevRooms) => prevRooms.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r)));
    }
  };

  const handleHomeClick = (): void => {
    setSelectedItem(null);
    onMenuSelect("");
  };

  const displayUserImage = userInfo?.image || "/basicProfile.webp";
  const displayUserName = userInfo?.name || "사용자";

  return (
    <div className={styles.actionBar}>
      <div className={styles.header} onClick={handleHomeClick}>
        Teaming
      </div>
      <div className={styles.navBar}>
        <div className={styles.userInfo}>
          <div className={styles.userImg}>
            {displayUserImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayUserImage} alt="사용자 프로필" className={styles.profileImage} />
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
          <div className={styles.userName}>{displayUserName}님</div>
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
                  {room.unreadCount !== undefined && room.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{room.unreadCount}</span>
                  )}
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
