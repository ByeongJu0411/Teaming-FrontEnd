"use client";

import styles from "./chatroom.module.css";
import { FiPlus, FiSend } from "react-icons/fi";
import React, { useRef, useState, useEffect } from "react";
import { FcDocument, FcAddImage } from "react-icons/fc";
import { ImExit } from "react-icons/im";
import { useSession } from "next-auth/react";

import DataRoom from "./dataroom";
import CreateMission from "./createmission";
import AssignmentRoom from "./assignmentroom";
import ChatMessage from "./chatmessage";
import PaymentModal from "./payment";

// 멤버 타입 정의
interface Member {
  memberId: number;
  lastReadMessageId: number;
  name: string;
  avatarKey: string;
  avatarVersion: number;
  roomRole: "LEADER" | string;
}

// ChatUser 타입 정의 (ChatMessage에서 사용하는 형태)
interface ChatUser {
  id: number;
  name: string;
  avatar: string;
  role?: string;
}

interface ChatRoomProps {
  roomData: {
    id: string;
    name: string;
    lastChat: string;
    members?: Member[];
    memberCount?: number;
  };
}

interface ChatMessageType {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  messageType: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  readBy: number[];
}

// 기본 아바타 생성 함수
const generateAvatar = (name: string): string => {
  const avatars = ["🐱", "🐶", "🐰", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵"];
  const index = name.length % avatars.length;
  return avatars[index];
};

// 테스트용 메시지 데이터
const testMessages: ChatMessageType[] = [
  {
    id: 1,
    content: "이번 프로젝트에서 팀장을 맡게 된 최순조라고 합니다. 반갑습니다.",
    senderId: 2,
    senderName: "팀장 최순조",
    timestamp: "2024-01-15T08:51:00Z",
    messageType: "TEXT",
    readBy: [1, 2, 3, 4],
  },
  {
    id: 2,
    content: "제가 과제 하나 설정해왔는데요 확인하시는 대로 답변 부탁드립니다.",
    senderId: 2,
    senderName: "팀장 최순조",
    timestamp: "2024-01-15T08:51:30Z",
    messageType: "TEXT",
    readBy: [1, 2, 3],
  },
  {
    id: 3,
    content: "네 확인했습니다.",
    senderId: 1,
    senderName: "권민석",
    timestamp: "2024-01-15T08:52:30Z",
    messageType: "TEXT",
    readBy: [1, 2],
  },
  {
    id: 4,
    content: "설명 읽으셨는지 모르겠지만 저희 법칙 있는거 아시죠..?",
    senderId: 3,
    senderName: "정치학 존잘남",
    timestamp: "2024-01-15T08:52:00Z",
    messageType: "TEXT",
    readBy: [1, 3],
  },
];

export default function ChatRoom({ roomData }: ChatRoomProps) {
  const { data: session } = useSession();

  const [fileModalStatus, setFileModalStatus] = useState<boolean>(false);
  const [dataRoomModalStatus, setDataRoomModalStatus] = useState<boolean>(false);
  const [missionModalStatus, setMissionModalStatus] = useState<boolean>(false);
  const [assignmentModalStatus, setAssignmentModalStatus] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageType[]>(testMessages);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);

  // Payment 컴포넌트 표시 상태
  const [showPayment, setShowPayment] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const file = useRef<HTMLInputElement | null>(null);

  // 현재 로그인한 사용자 정보 (NextAuth 세션에서 가져오기)
  const currentUser = {
    id: 1, // 실제 구현시에는 백엔드에서 받은 사용자 ID 사용
    name: session?.user?.name || "사용자",
    email: session?.user?.email || "",
    image: session?.user?.image || null,
  };

  // 실제 멤버 데이터 처리
  const actualMembers: Member[] = roomData.members || [];
  const memberCount: number = actualMembers.length || roomData.memberCount || 0;

  // 멤버 정보를 ChatMessage에서 사용할 수 있는 형태로 변환 (현재 사용자 포함)
  const chatUsers: ChatUser[] = [
    // 현재 사용자 추가
    {
      id: currentUser.id,
      name: currentUser.name,
      avatar: generateAvatar(currentUser.name),
      role: actualMembers.find((m) => m.memberId === currentUser.id)?.roomRole || "MEMBER",
    },
    // 기존 멤버들 추가 (중복 제거)
    ...actualMembers
      .filter((member) => member.memberId !== currentUser.id)
      .map((member: Member) => ({
        id: member.memberId,
        name: member.name,
        avatar: generateAvatar(member.name),
        role: member.roomRole,
      })),
  ];

  // 자동 스크롤
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지 전송
  const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || !isConnected) return;

    const newMessage: ChatMessageType = {
      id: Date.now(),
      content: trimmedMessage,
      senderId: currentUser.id,
      senderName: currentUser.name,
      timestamp: new Date().toISOString(),
      messageType: "TEXT",
      readBy: [currentUser.id],
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    setTimeout(() => scrollToBottom(), 100);
  };

  // 입력 변화 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMessage(e.target.value);
  };

  // 키보드 이벤트 처리
  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // 파일 선택
  const openFileSelector = (): void => {
    file.current?.click();
    setFileModalStatus(false);
  };

  // Payment 처리 완료 핸들러
  const handlePaymentComplete = (): void => {
    setShowPayment(false);
  };

  // 세션이 없으면 로그인 필요 메시지 표시
  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.loginRequired}>
          <p>채팅방을 이용하려면 로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  // 컴포넌트 마운트 시 스크롤
  // eslint-disable-next-line react-hooks/rules-of-hooks
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
            {showPayment ? (
              <PaymentModal
                setModal={() => setShowPayment(false)}
                roomType={{
                  id: "starbucks",
                  name: "Standard Room",
                  price: "4841원",
                  description: "스타벅스 아이스 아메리카노 1잔",
                  icon: "/starbucks.png",
                  iconClass: "starbucksIcon",
                }}
                memberCount={memberCount}
                onPaymentComplete={handlePaymentComplete}
              />
            ) : (
              <>
                <div className={styles.chatMain}>
                  <div ref={messagesContainerRef} className={styles.messagesContainer}>
                    {messages.map((msg, index) => {
                      const prevMessage = index > 0 ? messages[index - 1] : null;
                      const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

                      const isFirstInGroup = !prevMessage || prevMessage.senderId !== msg.senderId;
                      const isLastInGroup = !nextMessage || nextMessage.senderId !== msg.senderId;
                      const showSenderName = isFirstInGroup;

                      return (
                        <ChatMessage
                          key={msg.id}
                          message={msg}
                          currentUserId={currentUser.id}
                          showSenderName={showSenderName}
                          isLastMessage={isLastInGroup}
                          allUsers={chatUsers}
                          hoveredMessage={hoveredMessage}
                          setHoveredMessage={setHoveredMessage}
                        />
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <form onSubmit={handleSendMessage} className={styles.chatInput}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => setFileModalStatus(!fileModalStatus)}
                  >
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
                    <button
                      type="submit"
                      className={`${styles.iconButton} ${message.trim() ? styles.sendActive : ""}`}
                      disabled={!message.trim() || !isConnected}
                    >
                      <FiSend size={20} color={message.trim() ? "#3F3FD4" : "#666"} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <div className={styles.chatRoomInfo}>
          <div className={styles.chatRoomInfoHeader}>
            <div className={styles.chatRoomInfoImg}></div>
            <div className={styles.chatRoomInfoName}>{roomData.name}</div>
          </div>

          <div className={styles.chatUserList}>
            <div className={styles.userListTitle}>참여자 ({memberCount})</div>
            {actualMembers.length > 0 ? (
              actualMembers.map((member: Member) => (
                <div key={member.memberId} className={styles.userItem}>
                  <div className={styles.userAvatar}>
                    {member.avatarKey ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/files/${member.avatarKey}?v=${member.avatarVersion}`}
                        alt={member.name}
                        className={styles.avatarImage}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          if (target.nextSibling) {
                            (target.nextSibling as HTMLElement).style.display = "block";
                          }
                        }}
                      />
                    ) : null}
                    <span className={styles.emojiAvatar} style={{ display: member.avatarKey ? "none" : "block" }}>
                      {generateAvatar(member.name)}
                    </span>
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>
                      {member.name}
                      {member.roomRole === "LEADER" && <span className={styles.leaderBadge}>👑</span>}
                      {member.name === currentUser.name && <span className={styles.currentUserBadge}>(나)</span>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.loadingMembers}>멤버 정보를 불러오는 중...</div>
            )}
          </div>

          <div className={styles.chatNavItem}>
            <div className={styles.item} onClick={() => setDataRoomModalStatus(!dataRoomModalStatus)}>
              📋 자료실
            </div>
            <div className={styles.item} onClick={() => setMissionModalStatus(!missionModalStatus)}>
              ➕ 과제 생성하기
            </div>
            <div className={styles.item} onClick={() => setAssignmentModalStatus(!assignmentModalStatus)}>
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
      {/* 과제 확인하기 모달 */}
      {assignmentModalStatus && (
        <AssignmentRoom setModal={() => setAssignmentModalStatus(!assignmentModalStatus)} roomId={roomData.id} />
      )}
    </>
  );
}
