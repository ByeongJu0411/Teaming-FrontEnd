import { useEffect, useRef, useState, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// 명세서 기반 정확한 타입 정의

interface RoomSuccessEvent {
  roomId: number;
}

interface MessageAttachment {
  fileId: number;
  uploaderId: number;
  sortOrder: number;
  name: string;
  type: "IMAGE" | "FILE" | "VIDEO" | "AUDIO";
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  previewUrl: string | null;
  thumbnailUrl: string | null;
  downloadUrl: string | null;
  antiVirusScanStatus: "PENDING" | "PASSED" | "FAILED" | "INFECTED";
  transcodeStatus: "NONE" | "PENDING" | "COMPLETED" | "FAILED";
  ready: boolean;
}

interface SenderSummary {
  id: number | null;
  name: string;
  avatarUrl: string | null;
}

interface ChatMessage {
  messageId: number;
  roomId: number;
  clientMessageId: string;
  type: "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO" | "SYSTEM_NOTICE";
  content: string | null;
  createdAt: string;
  sender: SenderSummary;
  attachments: MessageAttachment[];
}

interface ReadBoundaryUpdate {
  roomId: number;
  userId: number;
  lastReadMessageId: number | null;
  unreadCount: number;
}

interface LastMessagePreview {
  id: number;
  type: "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO" | "SYSTEM_NOTICE";
  content: string | null;
  sender: SenderSummary;
  createdAt: string;
}

interface UserRoomEvent {
  roomId: number;
  unreadCount: number;
  lastMessage: LastMessagePreview | null;
}

interface MemberEnteredEvent {
  roomId: number;
  member: {
    memberId: number;
    lastReadMessageId: number | null;
    name: string;
    avatarUrl: string | null;
    avatarVersion: number | null;
    roomRole: "LEADER" | string;
  };
}

interface UseWebSocketProps {
  roomId: string;
  token: string;
  onMessageReceived: (message: ChatMessage) => void;
  onReadBoundaryUpdate?: (update: ReadBoundaryUpdate) => void;
  onRoomEvent?: (event: UserRoomEvent) => void;
  onMemberEntered?: (event: MemberEnteredEvent) => void;
  onRoomSuccess?: (event: RoomSuccessEvent) => void;
  onError?: (error: string) => void;
}

export const useWebSocket = ({
  roomId,
  token,
  onMessageReceived,
  onReadBoundaryUpdate,
  onRoomEvent,
  onMemberEntered,
  onRoomSuccess,
  onError,
}: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(() => {
    if (clientRef.current?.connected) return;

    setIsConnecting(true);

    const wsUrl = `${
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"
    }/ws-sockjs?token=${encodeURIComponent(token)}`;

    console.log("WebSocket 연결 시도:", wsUrl);

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log("STOMP Debug:", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("WebSocket Connected");
      setIsConnected(true);
      setIsConnecting(false);

      // 1. 채팅방 메시지 구독
      client.subscribe(`/topic/rooms/${roomId}`, (message: IMessage) => {
        try {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          console.log("메시지 수신:", chatMessage);
          onMessageReceived(chatMessage);
        } catch (error) {
          console.error("메시지 파싱 오류:", error);
        }
      });

      // 2. 읽음 경계 업데이트 구독
      client.subscribe(`/topic/rooms/${roomId}/read`, (message: IMessage) => {
        try {
          const update: ReadBoundaryUpdate = JSON.parse(message.body);
          console.log("읽음 경계 업데이트:", update);
          if (onReadBoundaryUpdate) {
            onReadBoundaryUpdate(update);
          }
        } catch (error) {
          console.error("읽음 업데이트 파싱 오류:", error);
        }
      });

      // 3. 멤버 입장 이벤트 구독
      client.subscribe(`/topic/rooms/${roomId}/enter`, (message: IMessage) => {
        try {
          const event: MemberEnteredEvent = JSON.parse(message.body);
          console.log("멤버 입장 이벤트:", event);
          if (onMemberEntered) {
            onMemberEntered(event);
          }
        } catch (error) {
          console.error("멤버 입장 이벤트 파싱 오류:", error);
        }
      });

      // 4. 팀플 성공, 이벤트 구독
      client.subscribe(`/topic/rooms/${roomId}/success`, (message: IMessage) => {
        try {
          const event: RoomSuccessEvent = JSON.parse(message.body);
          console.log("팀플 성공 이벤트:", event);
          if (onRoomSuccess) {
            onRoomSuccess(event);
          }
        } catch (error) {
          console.error("팀플 성공 이벤트 파싱 오류:", error);
        }
      });

      // 5. 에러 메시지 구독
      client.subscribe("/user/queue/errors", (message: IMessage) => {
        console.error("WebSocket Error:", message.body);
        try {
          const errorData = JSON.parse(message.body);
          if (onError) {
            onError(errorData.message || "알 수 없는 오류");
          }
        } catch {
          if (onError) {
            onError(message.body);
          }
        }
      });

      // 6. 개인 방 이벤트 구독 (unread 등)
      client.subscribe("/user/queue/room-events", (message: IMessage) => {
        try {
          const event: UserRoomEvent = JSON.parse(message.body);
          console.log("방 이벤트:", event);
          if (onRoomEvent) {
            onRoomEvent(event);
          }
        } catch (error) {
          console.error("방 이벤트 파싱 오류:", error);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP Error:", frame.headers["message"]);
      setIsConnected(false);
      setIsConnecting(false);
      if (onError) {
        onError(frame.headers["message"] || "Connection error");
      }
    };

    client.onWebSocketClose = () => {
      console.log("WebSocket Disconnected");
      setIsConnected(false);
      setIsConnecting(false);
    };

    client.activate();
    clientRef.current = client;
  }, [token, roomId, onMessageReceived, onReadBoundaryUpdate, onMemberEntered, onRoomSuccess, onError, onRoomEvent]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  const sendMessage = useCallback(
    (
      content: string | null,
      type: "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO" | "SYSTEM_NOTICE" = "TEXT",
      attachmentFileIds: number[] = []
    ) => {
      if (!clientRef.current?.connected) {
        console.error("WebSocket이 연결되지 않았습니다.");
        return false;
      }

      try {
        const clientMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const message = {
          clientMessageId,
          content,
          type,
          attachmentFileIdsInOrder: attachmentFileIds,
        };

        console.log("메시지 전송:", message);

        clientRef.current.publish({
          destination: `/app/rooms/${roomId}/send`,
          body: JSON.stringify(message),
        });

        return true;
      } catch (error) {
        console.error("메시지 전송 오류:", error);
        return false;
      }
    },
    [roomId]
  );
  useEffect(() => {
    if (token && roomId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, roomId, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    sendMessage,
    connect,
    disconnect,
  };
};
