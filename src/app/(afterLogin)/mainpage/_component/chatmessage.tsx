import React from "react";
import Image from "next/image";
import styles from "./chatmessage.module.css";

interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  messageType: "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO" | "SYSTEM" | "SYSTEM_NOTICE";
  readBy: number[];
}

interface ChatMessageProps {
  message: ChatMessage;
  currentUserId: number;
  showSenderName?: boolean;
  isLastMessage?: boolean;
  allUsers: Array<{ id: number; name: string; avatar: string }>;
  hoveredMessage: number | null;
  setHoveredMessage: (id: number | null) => void;
}

export default function ChatMessage({
  message,
  currentUserId,
  showSenderName = true,
  isLastMessage = false,
  allUsers,
  hoveredMessage,
  setHoveredMessage,
}: ChatMessageProps) {
  const isMyMessage = message.senderId === currentUserId;
  const isSystemMessage = message.messageType === "SYSTEM" || message.messageType === "SYSTEM_NOTICE";

  // 안 읽은 사용자 계산 함수
  const getUnreadUsers = (message: ChatMessage) => {
    return allUsers.filter(
      (user) => user.id !== message.senderId && user.id !== currentUserId && !message.readBy.includes(user.id)
    );
  };

  // 안 읽은 사용자 수 계산 함수
  const getUnreadCount = (message: ChatMessage) => {
    // 전체 사용자에서 발신자 제외, readBy에 없는 사람만 카운트
    return allUsers.filter((user) => user.id !== message.senderId && !message.readBy.includes(user.id)).length;
  };

  const unreadCount = getUnreadCount(message);
  const unreadUsers = getUnreadUsers(message);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // 시스템 메시지는 별도 렌더링
  if (isSystemMessage) {
    return (
      <div className={styles.systemMessageContainer}>
        <div className={styles.systemMessage}>{message.content}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.messageContainer} ${isMyMessage ? styles.myMessage : styles.otherMessage}`}>
      <div className={styles.messageWrapper}>
        {/* 상대방 메시지일 때 아바타 영역 - 항상 공간 유지 */}
        {!isMyMessage && (
          <div className={styles.avatarSpace}>
            {showSenderName && <div className={styles.senderAvatar}>{message.senderName[0]}</div>}
          </div>
        )}

        <div className={`${styles.messageContent} ${isMyMessage ? styles.myMessage : styles.otherMessage}`}>
          {!isMyMessage && showSenderName && <div className={styles.senderName}>{message.senderName}</div>}

          <div className={styles.messageRow}>
            <div
              className={`${styles.messageBubble} ${isMyMessage ? styles.myBubble : styles.otherBubble}`}
              onMouseEnter={() => setHoveredMessage(message.id)}
              onMouseLeave={() => setHoveredMessage(null)}
            >
              {message.messageType === "TEXT" && <span className={styles.messageText}>{message.content}</span>}

              {message.messageType === "IMAGE" && (
                <Image
                  src={message.content}
                  alt="첨부 이미지"
                  width={200}
                  height={200}
                  className={styles.messageImage}
                />
              )}

              {message.messageType === "FILE" && (
                <div className={styles.messageFile}>
                  <span>📎 {message.content}</span>
                </div>
              )}

              {message.messageType === "VIDEO" && (
                <div className={styles.messageFile}>
                  <span>🎥 {message.content}</span>
                </div>
              )}

              {message.messageType === "AUDIO" && (
                <div className={styles.messageFile}>
                  <span>🎵 {message.content}</span>
                </div>
              )}
            </div>

            {/* 시간과 읽음 상태 표시 */}
            {isLastMessage && (
              <div className={styles.messageInfo}>
                <div className={styles.messageTime}>{formatTime(message.timestamp)}</div>
                {/* 안 읽은 사람이 있을 때 표시 */}
                {/*{unreadCount > 0 && <div className={styles.unreadCount}>{unreadCount}</div>}*/}
              </div>
            )}
          </div>

          {/* 호버 시 안 읽은 사용자 목록 표시 */}
          {/*     
          {hoveredMessage === message.id && unreadCount > 0 && (
            <div className={styles.unreadTooltip}>
              <div className={styles.tooltipHeader}>안 읽은 사람</div>
              {unreadUsers.map((user) => (
                <div key={user.id} className={styles.tooltipUser}>
                  <span className={styles.tooltipName}>{user.name}</span>
                </div>
              ))}
            </div>
          )}*/}
        </div>
      </div>
    </div>
  );
}
