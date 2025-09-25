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
}

// ✅ 수정: items로 변경
interface ChatMessagePageResponse {
  items: ChatMessage[]; // messages → items
  hasNext: boolean;
  nextCursor: number | null;
}

interface UseChatMessagesProps {
  roomId: string;
  token: string;
}

export const useChatMessages = ({ roomId, token }: UseChatMessagesProps) => {
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

        // ✅ 수정: data.messages → data.items
        if (isInitial) {
          setMessages(data.items.reverse());
        } else {
          setMessages((prev) => [...data.items.reverse(), ...prev]);
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

  const addMessage = useCallback((newMessage: ChatMessage) => {
    setMessages((prev) => [...prev, newMessage]);
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

        return await response.json();
      } catch (error) {
        console.error("읽음 처리 오류:", error);
      }
    },
    [roomId, token]
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
    refreshMessages: loadInitialMessages,
  };
};
