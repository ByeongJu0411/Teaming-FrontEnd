"use client";

import styles from "./chatroom.module.css";
import { FiMic, FiImage, FiPlus, FiSend } from "react-icons/fi";
import { LuSmile } from "react-icons/lu";
import React, { useRef, useState, useEffect } from "react";
import { FcDocument, FcAddImage } from "react-icons/fc";
import { ImExit } from "react-icons/im";

import DataRoom from "./dataroom";
import CreateMission from "./createmission";

interface ChatRoomProps {
  roomData: {
    id: string;
    name: string;
    lastChat: string;
  };
}

interface ChatMessageType {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  messageType: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
}

// 테스트용 유저 데이터
const testUsers = [
  { id: "1", name: "권민석", avatar: "🐱" },
  { id: "2", name: "팀장 최순조", avatar: "👨‍💼" },
  { id: "3", name: "정치학 존잘남", avatar: "😎" },
  { id: "4", name: "팀플하기싫다", avatar: "😩" },
];

// 테스트용 메시지 데이터
const testMessages: ChatMessageType[] = [
  {
    id: 1,
    content: "이번 프로젝트에서 팀장을 맡게 된 최순조라고 합니다. 반갑습니다.",
    senderId: 2,
    senderName: "팀장 최순조",
    timestamp: "2024-01-15T08:51:00Z",
    messageType: "TEXT",
  },
  {
    id: 2,
    content: "제가 과제 하나 설정해왔는데요 확인하시는 대로 답변 부탁드립니다.",
    senderId: 2,
    senderName: "팀장 최순조",
    timestamp: "2024-01-15T08:51:30Z",
    messageType: "TEXT",
  },
  {
    id: 3,
    content: "네 확인했습니다.",
    senderId: 1,
    senderName: "권민석",
    timestamp: "2024-01-15T08:52:30Z",
    messageType: "TEXT",
  },
  {
    id: 4,
    content: "설명 읽으셨는지 모르겠지만 저희 법칙 있는거 아시죠..?",
    senderId: 3,
    senderName: "정치학 존잘남",
    timestamp: "2024-01-15T08:52:00Z",
    messageType: "TEXT",
  },
]; // 임시 사용자 정보
const CURRENT_USER = {
  id: "1",
  name: "권민석",
  token: "your-jwt-token-here",
};

export default function ChatRoom({ roomData }: ChatRoomProps) {
  const [fileModalStatus, setFileModalStatus] = useState(false); // 파일 첨부 모달
  const [dataRoomModalStatus, setDataRoomModalStatus] = useState(false); // 자료실 모달
  const [missionModalStatus, setMissionModalStatus] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageType[]>(testMessages);
  const [isConnected, setIsConnected] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const file = useRef<HTMLInputElement | null>(null);

  // 개선된 ChatMessage 컴포넌트
  const ChatMessageComponent = ({
    message: msg,
    currentUserId,
    showSenderName,
    isFirstInGroup,
    isLastInGroup,
  }: {
    message: ChatMessageType;
    currentUserId: string;
    showSenderName: boolean;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
  }) => {
    const isMyMessage = msg.senderId.toString() === currentUserId;
    const isSystemMessage = msg.messageType === "SYSTEM";

    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    if (isSystemMessage) {
      return (
        <div className={styles.systemMessage}>
          <div className={styles.systemMessageBubble}>{msg.content}</div>
        </div>
      );
    }

    return (
      <div
        className={`${styles.messageWrapper} ${isLastInGroup ? styles.lastInGroup : ""} ${
          isMyMessage ? styles.myMessage : styles.otherMessage
        }`}
      >
        <div className={`${styles.messageContent} ${isMyMessage ? styles.myMessage : ""}`}>
          {/* 아바타는 첫 메시지에만 표시 */}
          {!isMyMessage && (
            <div className={styles.avatarSpace}>
              {isFirstInGroup && <div className={styles.avatar}>{msg.senderName[0]}</div>}
            </div>
          )}

          <div className={`${styles.messageBody} ${isMyMessage ? styles.myMessage : styles.otherMessage}`}>
            {/* 발신자 이름은 첫 메시지에만 표시 */}
            {!isMyMessage && isFirstInGroup && <div className={styles.senderName}>{msg.senderName}</div>}

            <div className={`${styles.bubbleContainer} ${isMyMessage ? styles.myMessage : ""}`}>
              <div className={`${styles.messageBubble} ${isMyMessage ? styles.myMessage : styles.otherMessage}`}>
                {msg.content}
              </div>

              {/* 시간은 마지막 메시지에만 표시 */}
              {isLastInGroup && <div className={styles.messageTime}>{formatTime(msg.timestamp)}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지 전송
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || !isConnected) return;

    const newMessage: ChatMessageType = {
      id: Date.now(),
      content: trimmedMessage,
      senderId: parseInt(CURRENT_USER.id),
      senderName: CURRENT_USER.name,
      timestamp: new Date().toISOString(),
      messageType: "TEXT",
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    setTimeout(() => scrollToBottom(), 100);
  };

  // 입력 변화 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  // 키보드 이벤트 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // 파일 선택
  const openFileSelector = () => {
    file.current?.click();
    setFileModalStatus(false);
  };

  // 컴포넌트 마운트 시 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.chatPage}>
          <div className={styles.chatHeader}>
            <div className={styles.chatRoomImg}></div>
            <p className={styles.chatRoomName}>{roomData.name}</p>
            <div className={styles.connectionStatus}>
              {isConnected && <span className={styles.connected}>●</span>}
              {!isConnected && <span className={styles.disconnected}>연결 끊김</span>}
            </div>
          </div>

          <div className={styles.chatBody}>
            <div className={styles.chatMain}>
              <div ref={messagesContainerRef} className={styles.messagesContainer}>
                {messages.map((msg, index) => {
                  const prevMessage = index > 0 ? messages[index - 1] : null;
                  const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

                  // 같은 발신자의 첫 메시지인지 확인
                  const isFirstInGroup = !prevMessage || prevMessage.senderId !== msg.senderId;

                  // 같은 발신자의 마지막 메시지인지 확인
                  const isLastInGroup = !nextMessage || nextMessage.senderId !== msg.senderId;

                  // showSenderName은 이제 사용하지 않고 isFirstInGroup을 사용
                  const showSenderName = isFirstInGroup;

                  return (
                    <ChatMessageComponent
                      key={msg.id}
                      message={msg}
                      currentUserId={CURRENT_USER.id}
                      showSenderName={showSenderName}
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form onSubmit={handleSendMessage} className={styles.chatInput}>
              <button type="button" className={styles.iconButton} onClick={() => setFileModalStatus(!fileModalStatus)}>
                <FiPlus size={20} color="#666" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요"
                className={styles.messageInput}
                disabled={!isConnected}
              />

              <div className={styles.inputIcons}>
                <button type="button" className={styles.iconButton}>
                  <FiMic size={20} color="#666" />
                </button>
                <button type="button" className={styles.iconButton}>
                  <LuSmile size={20} color="#666" />
                </button>
                <button type="button" className={styles.iconButton}>
                  <FiImage size={20} color="#666" />
                </button>
                <button
                  type="submit"
                  className={`${styles.iconButton} ${message.trim() ? styles.sendActive : ""}`}
                  disabled={!message.trim() || !isConnected}
                >
                  <FiSend size={20} color={message.trim() ? "#3F3FD4" : "#666"} />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className={styles.chatRoomInfo}>
          <div className={styles.chatRoomInfoHeader}>
            <div className={styles.chatRoomInfoImg}></div>
            <div className={styles.chatRoomInfoName}>{roomData.name}</div>
          </div>

          <div className={styles.chatUserList}>
            <div className={styles.userListTitle}>참여자 ({testUsers.length})</div>
            {testUsers.map((user) => (
              <div key={user.id} className={styles.userItem}>
                <div className={styles.userAvatar}>{user.avatar}</div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.name}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.chatNavItem}>
            <div className={styles.item} onClick={() => setDataRoomModalStatus(!dataRoomModalStatus)}>
              📋 자료실
            </div>
            <div className={styles.item} onClick={() => setMissionModalStatus(!missionModalStatus)}>
              ➕ 과제 생성하기
            </div>
            <div className={styles.item} onClick={() => setMissionModalStatus(!missionModalStatus)}>
              📖 과제 확인하기
            </div>
          </div>

          <div className={styles.exitButton}>
            <ImExit className={styles.exitIcon} />
            티밍룸 나가기
          </div>
        </div>
      </div>

      {/* 파일 업로드 */}
      <input
        type="file"
        ref={file}
        style={{ display: "none" }}
        onChange={(e) => {
          console.log("파일 선택:", e.target.files?.[0]);
        }}
      />

      {/* 파일 첨부 모달 */}
      {fileModalStatus && (
        <div className={styles.modalOverlay} onClick={() => setFileModalStatus(false)}>
          <div className={styles.fileModal} onClick={(e) => e.stopPropagation()}>
            <h3>파일 첨부</h3>
            <div className={styles.fileOptions}>
              <button onClick={openFileSelector} className={styles.fileOption}>
                <FcDocument size={24} />
                <span>문서</span>
              </button>
              <button onClick={openFileSelector} className={styles.fileOption}>
                <FcAddImage size={24} />
                <span>이미지</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 자료실 모달 */}
      {dataRoomModalStatus && <DataRoom setModal={() => setDataRoomModalStatus(!dataRoomModalStatus)} />}
      {/* 과제 생성하기 모달 */}
      {missionModalStatus && <CreateMission setModal={() => setMissionModalStatus(!missionModalStatus)} />}
    </>
  );
}
