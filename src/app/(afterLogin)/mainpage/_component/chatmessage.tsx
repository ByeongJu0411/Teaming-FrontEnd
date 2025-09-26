import React from "react";
import Image from "next/image";
import { FcDocument } from "react-icons/fc";
import { FiImage } from "react-icons/fi";
import { useSession } from "next-auth/react";
import styles from "./chatmessage.module.css";

interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  messageType: "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO" | "SYSTEM" | "SYSTEM_NOTICE";
  readBy: number[];
  attachments?: Array<{
    fileId: number;
    name: string;
    type: string;
    previewUrl: string | null;
    thumbnailUrl: string | null;
    downloadUrl: string | null;
  }>;
}

interface ChatMessageProps {
  message: ChatMessage;
  currentUserId: number;
  showSenderName?: boolean;
  isLastMessage?: boolean;
  allUsers: Array<{
    id: number;
    name: string;
    avatar: string;
    avatarKey?: string;
    avatarVersion?: number;
  }>;
  hoveredMessage: number | null;
  setHoveredMessage: (id: number | null) => void;
}

// 기본 아바타 생성 함수
const generateAvatar = (name: string): string => {
  const avatars = ["🐱", "🐶", "🐰", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵"];
  const index = name.length % avatars.length;
  return avatars[index];
};

export default function ChatMessage({
  message,
  currentUserId,
  showSenderName = true,
  isLastMessage = false,
  allUsers,
  hoveredMessage,
  setHoveredMessage,
}: ChatMessageProps) {
  const { data: session } = useSession();
  const isMyMessage = message.senderId === currentUserId;
  const isSystemMessage = message.messageType === "SYSTEM" || message.messageType === "SYSTEM_NOTICE";

  // 발신자 정보 찾기
  const sender = allUsers.find((user) => user.id === message.senderId);
  const senderAvatar = sender?.avatar || generateAvatar(message.senderName);
  const isAvatarUrl = senderAvatar.startsWith("http") || senderAvatar.startsWith("/");

  // 파일 다운로드 핸들러
  const handleDownload = async (fileId: number | undefined) => {
    if (!fileId) {
      console.error("fileId가 없습니다:", message);
      alert("파일 ID를 찾을 수 없습니다.");
      return;
    }

    if (!session?.accessToken) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const token = session.accessToken;

      console.log("다운로드 요청 - fileId:", fileId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/files/download-url/${fileId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("다운로드 API 응답:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("다운로드 API 오류:", errorText);
        throw new Error("다운로드 URL 생성 실패");
      }

      const data = await response.json();
      console.log("다운로드 URL 데이터:", data);

      // Presigned URL로 파일 다운로드
      if (data.url) {
        const link = document.createElement("a");
        link.href = data.url;
        link.download = message.content; // 파일명
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("파일 다운로드 오류:", error);
      alert("파일 다운로드에 실패했습니다.");
    }
  };

  // 안 읽은 사용자 계산 함수
  const getUnreadUsers = (message: ChatMessage) => {
    return allUsers.filter(
      (user) => user.id !== message.senderId && user.id !== currentUserId && !message.readBy.includes(user.id)
    );
  };

  // 안 읽은 사용자 수 계산 함수
  const getUnreadCount = (message: ChatMessage) => {
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
            {showSenderName && (
              <div className={styles.senderAvatar}>
                {isAvatarUrl ? (
                  <Image
                    src={senderAvatar}
                    alt={message.senderName}
                    width={36}
                    height={36}
                    className={styles.avatarImage}
                    unoptimized
                    onError={(e) => {
                      // 이미지 로드 실패 시 이모지로 대체
                      const target = e.currentTarget;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.textContent = generateAvatar(message.senderName);
                      }
                    }}
                  />
                ) : (
                  <span className={styles.emojiAvatar}>{senderAvatar}</span>
                )}
              </div>
            )}
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
                <div className={styles.fileMessageWrapper}>
                  <div className={styles.fileMessageContainer}>
                    <div className={styles.fileIcon}>
                      <FiImage size={20} />
                    </div>
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>{message.attachments?.[0]?.name || message.content}</span>
                      <span className={styles.fileType}>이미지</span>
                    </div>
                  </div>
                  <button
                    className={styles.downloadButton}
                    onClick={() => handleDownload(message.attachments?.[0]?.fileId)}
                  >
                    다운로드
                  </button>
                </div>
              )}

              {message.messageType === "FILE" && (
                <div className={styles.fileMessageWrapper}>
                  <div className={styles.fileMessageContainer}>
                    <div className={styles.fileIcon}>
                      <FcDocument size={20} />
                    </div>
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>{message.attachments?.[0]?.name || message.content}</span>
                      <span className={styles.fileType}>문서</span>
                    </div>
                  </div>
                  <button
                    className={styles.downloadButton}
                    onClick={() => handleDownload(message.attachments?.[0]?.fileId)}
                  >
                    다운로드
                  </button>
                </div>
              )}

              {message.messageType === "VIDEO" && (
                <div className={styles.fileMessageWrapper}>
                  <div className={styles.fileMessageContainer}>
                    <div className={styles.fileIcon}>
                      <span>🎥</span>
                    </div>
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>{message.attachments?.[0]?.name || message.content}</span>
                      <span className={styles.fileType}>비디오</span>
                    </div>
                  </div>
                  <button
                    className={styles.downloadButton}
                    onClick={() => handleDownload(message.attachments?.[0]?.fileId)}
                  >
                    다운로드
                  </button>
                </div>
              )}

              {message.messageType === "AUDIO" && (
                <div className={styles.fileMessageWrapper}>
                  <div className={styles.fileMessageContainer}>
                    <div className={styles.fileIcon}>
                      <span>🎵</span>
                    </div>
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>{message.attachments?.[0]?.name || message.content}</span>
                      <span className={styles.fileType}>오디오</span>
                    </div>
                  </div>
                  <button
                    className={styles.downloadButton}
                    onClick={() => handleDownload(message.attachments?.[0]?.fileId)}
                  >
                    다운로드
                  </button>
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
