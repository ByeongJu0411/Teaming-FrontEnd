import { useState, useEffect, useCallback, useRef } from "react";

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
  avatarVersion?: number;
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
  readBy?: number[]; // ✅ 읽음 상태 추가
}

interface ChatMessagePageResponse {
  items: ChatMessage[];
  hasNext: boolean;
  nextCursor: number | null;
}

interface UseChatMessagesProps {
  roomId: string;
  token: string;
  currentUserId: number; // ✅ 현재 사용자 ID 추가
}

export const useChatMessages = ({ roomId, token, currentUserId }: UseChatMessagesProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);

  const loadingRef = useRef(false);

  const fetchMessages = useCallback(
    async (currentCursor: number | null = null, isInitial = false) => {
      if (loadingRef.current || !token || !roomId) {
        console.warn("fetchMessages: 조건 미충족", {
          loading: loadingRef.current,
          hasToken: !!token,
          roomId,
        });
        return;
      }

      loadingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams({
          limit: "50",
          ...(currentCursor && { cursor: currentCursor.toString() }),
        });

        const url = `${
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"
        }/rooms/${roomId}/messages?${params}`;
        console.log("메시지 조회 요청:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("메시지 조회 응답 상태:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("메시지 조회 실패:", response.status, errorText);
          throw new Error(`메시지 조회 실패: ${response.status}`);
        }

        const data: ChatMessagePageResponse = await response.json();
        console.log("메시지 조회 성공:", data.items.length, "개");

        // ✅ 각 메시지에 readBy 초기화 (발신자만 포함)
        const messagesWithReadBy = data.items.map((msg) => ({
          ...msg,
          readBy: [msg.sender.id || 0],
        }));

        if (isInitial) {
          setMessages(messagesWithReadBy.reverse());
        } else {
          setMessages((prev) => [...messagesWithReadBy.reverse(), ...prev]);
        }

        setHasMore(data.hasNext);
        setCursor(data.nextCursor);
      } catch (error) {
        console.error("메시지 조회 오류:", error);
        setMessages([]);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [roomId, token]
  );

  const loadInitialMessages = useCallback(() => {
    fetchMessages(null, true);
  }, [fetchMessages]);

  const loadMoreMessages = useCallback(() => {
    if (hasMore && cursor && !loadingRef.current) {
      fetchMessages(cursor, false);
    }
  }, [hasMore, cursor, fetchMessages]);

  // ✅ 새 메시지 추가 시 readBy 포함
  const addMessage = useCallback((newMessage: ChatMessage) => {
    setMessages((prev) => [
      ...prev,
      {
        ...newMessage,
        readBy: [newMessage.sender.id || 0], // 발신자만 읽음 상태로 초기화
      },
    ]);
  }, []);

  // ✅ 읽음 경계 업데이트 처리 함수 추가
  const updateReadBoundary = useCallback((userId: number, lastReadMessageId: number) => {
    setMessages((prev) =>
      prev.map((msg) => {
        // 해당 메시지 ID 이하의 모든 메시지를 읽음 처리
        if (msg.messageId <= lastReadMessageId) {
          const readBy = msg.readBy || [msg.sender.id || 0];
          if (!readBy.includes(userId)) {
            return {
              ...msg,
              readBy: [...readBy, userId],
            };
          }
        }
        return msg;
      })
    );
  }, []);

  const markAsRead = useCallback(
    async (lastReadMessageId?: number) => {
      if (!token || !roomId) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/rooms/${roomId}/read`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lastReadMessageId: lastReadMessageId || null,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("읽음 처리 실패");
        }

        const result = await response.json();

        // ✅ 자신의 읽음 상태도 로컬에 반영
        if (lastReadMessageId) {
          updateReadBoundary(currentUserId, lastReadMessageId);
        }

        return result;
      } catch (error) {
        console.error("읽음 처리 오류:", error);
      }
    },
    [roomId, token, currentUserId, updateReadBoundary]
  );

  useEffect(() => {
    if (roomId && token) {
      setMessages([]);
      setCursor(null);
      setHasMore(true);
      loadInitialMessages();
    }
  }, [roomId, token, loadInitialMessages]);

  return {
    messages,
    loading,
    hasMore,
    addMessage,
    loadMoreMessages,
    markAsRead,
    updateReadBoundary, // ✅ 외부에서 사용할 수 있도록 export
    refreshMessages: loadInitialMessages,
  };
};
