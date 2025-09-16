import { useState, useEffect, useCallback } from "react";

interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  messageType: "TEXT" | "IMAGE" | "FILE";
}

interface ChatMessagePageResponse {
  messages: ChatMessage[];
  hasNext: boolean;
  nextCursor: number | null;
}

interface UseChatMessagesProps {
  roomId: string;
  userId: string;
  token: string;
}

export const useChatMessages = ({ roomId, userId, token }: UseChatMessagesProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);

  // API 호출 함수
  const fetchMessages = async (currentCursor: number | null = null, isInitial = false) => {
    if (loading) return;

    setLoading(true);

    try {
      const params = new URLSearchParams({
        limit: "50",
        ...(currentCursor && { cursor: currentCursor.toString() }),
      });

      const response = await fetch(
        `http://localhost:8080/rooms/${roomId}/messages?${params}`, // 백엔드 URL로 변경 필요
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("메시지 조회 실패");
      }

      const data: ChatMessagePageResponse = await response.json();

      if (isInitial) {
        setMessages(data.messages.reverse()); // 최신 메시지가 아래로 오도록 역순
      } else {
        setMessages((prev) => [...data.messages.reverse(), ...prev]); // 이전 메시지를 앞에 추가
      }

      setHasMore(data.hasNext);
      setCursor(data.nextCursor);
    } catch (error) {
      console.error("메시지 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 초기 메시지 로드
  const loadInitialMessages = useCallback(() => {
    fetchMessages(null, true);
  }, [roomId]);

  // 이전 메시지 더 로드 (무한 스크롤용)
  const loadMoreMessages = useCallback(() => {
    if (hasMore && cursor) {
      fetchMessages(cursor, false);
    }
  }, [hasMore, cursor]);

  // 새 메시지 추가 (실시간으로 받은 메시지)
  const addMessage = useCallback((newMessage: ChatMessage) => {
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  // 읽음 처리
  const markAsRead = async (lastReadMessageId?: number) => {
    try {
      const response = await fetch(`http://localhost:8080/rooms/${roomId}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lastReadMessageId: lastReadMessageId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("읽음 처리 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("읽음 처리 오류:", error);
    }
  };

  // 컴포넌트 마운트 시 초기 메시지 로드
  useEffect(() => {
    if (roomId) {
      setMessages([]);
      setCursor(null);
      setHasMore(true);
      loadInitialMessages();
    }
  }, [roomId, loadInitialMessages]);

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
