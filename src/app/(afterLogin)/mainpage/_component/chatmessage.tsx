/* eslint-disable @next/next/no-img-element */
import React from "react";
import styles from "./chatmessage.module.css";

interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  messageType: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
}

interface ChatMessageProps {
  message: ChatMessage;
  currentUserId: string;
  showSenderName?: boolean;
  isLastMessage?: boolean;
}

export default function ChatMessage({
  message,
  currentUserId,
  showSenderName = true,
  isLastMessage = false,
}: ChatMessageProps) {
  const isMyMessage = message.senderId.toString() === currentUserId;
  const isSystemMessage = message.messageType === "SYSTEM";

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

        <div className={styles.messageContent}>
          {!isMyMessage && showSenderName && <div className={styles.senderName}>{message.senderName}</div>}

          <div className={styles.messageRow}>
            <div className={`${styles.messageBubble} ${isMyMessage ? styles.myBubble : styles.otherBubble}`}>
              {message.messageType === "TEXT" && <span className={styles.messageText}>{message.content}</span>}
              {message.messageType === "IMAGE" && (
                <img src={message.content} alt="첨부 이미지" className={styles.messageImage} />
              )}
              {message.messageType === "FILE" && (
                <div className={styles.messageFile}>
                  <span>📎 {message.content}</span>
                </div>
              )}
            </div>

            <div className={styles.messageTime}>{formatTime(message.timestamp)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
