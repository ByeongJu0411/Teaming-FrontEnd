import { useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  messageType: "TEXT" | "IMAGE" | "FILE";
}

interface UseWebSocketProps {
  roomId: string;
  userId: string;
  token: string;
  onMessageReceived: (message: ChatMessage) => void;
  onError?: (error: string) => void;
}

export const useWebSocket = ({ roomId, userId, token, onMessageReceived, onError }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const clientRef = useRef<Client | null>(null);

  const connect = () => {
    if (clientRef.current?.connected) return;

    setIsConnecting(true);

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"), // 백엔드 URL로 변경 필요
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

      // 채팅방 메시지 구독
      client.subscribe(`/topic/rooms/${roomId}`, (message: IMessage) => {
        try {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          onMessageReceived(chatMessage);
        } catch (error) {
          console.error("메시지 파싱 오류:", error);
        }
      });

      // 에러 메시지 구독
      client.subscribe("/user/queue/errors", (message: IMessage) => {
        console.error("WebSocket Error:", message.body);
        onError?.(message.body);
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP Error:", frame.headers["message"]);
      setIsConnected(false);
      setIsConnecting(false);
      onError?.(frame.headers["message"] || "Connection error");
    };

    client.onWebSocketClose = () => {
      console.log("WebSocket Disconnected");
      setIsConnected(false);
      setIsConnecting(false);
    };

    client.activate();
    clientRef.current = client;
  };

  const disconnect = () => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  };

  const sendMessage = (content: string, messageType: "TEXT" | "IMAGE" | "FILE" = "TEXT") => {
    if (!clientRef.current?.connected) {
      console.error("WebSocket이 연결되지 않았습니다.");
      return false;
    }

    try {
      const message = {
        content,
        messageType,
      };

      clientRef.current.publish({
        destination: `/app/rooms/${roomId}/send`,
        body: JSON.stringify(message),
      });

      return true;
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      return false;
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [roomId, userId, token]);

  return {
    isConnected,
    isConnecting,
    sendMessage,
    connect,
    disconnect,
  };
};
