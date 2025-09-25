"use client";

import styles from "./chatroom.module.css";
import { FiPlus, FiSend } from "react-icons/fi";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { MdCelebration } from "react-icons/md";
import { FcDocument, FcAddImage } from "react-icons/fc";
import { ImExit } from "react-icons/im";
import { useSession } from "next-auth/react";
import Image from "next/image";

import DataRoom from "./dataroom";
import CreateMission from "./createmission";
import AssignmentRoom from "./assignmentroom";
import ChatMessage from "./chatmessage";
import PaymentModal from "./payment";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useChatMessages } from "@/hooks/useChatMessages";

// MessageAttachment 타입 정의
interface MessageAttachment {
  fileId: number;
  sortOrder: number;
  uploaderId: number;
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
    type?: "BASIC" | "STANDARD" | "ELITE" | "DEMO";
    role?: "LEADER" | "MEMBER";
  };
  onRoomUpdate?: (roomId: string, unreadCount: number) => void;
}

// WebSocket에서 받은 메시지 타입
interface WSChatMessage {
  messageId: number;
  roomId: number;
  clientMessageId: string;
  type: "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO" | "SYSTEM_NOTICE";
  content: string | null;
  createdAt: string;
  sender: {
    id: number | null;
    name: string;
    avatarUrl: string | null;
  };
  attachments: MessageAttachment[];
}

// ChatMessage 컴포넌트용 타입 (기존 구조 유지)
interface ChatMessageType {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  messageType: "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO" | "SYSTEM" | "SYSTEM_NOTICE";
  readBy: number[];
}

// 기본 아바타 생성 함수
const generateAvatar = (name: string): string => {
  const avatars = ["🐱", "🐶", "🐰", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵"];
  const index = name.length % avatars.length;
  return avatars[index];
};

export default function ChatRoom({ roomData, onRoomUpdate }: ChatRoomProps) {
  const { data: session } = useSession();

  const [fileModalStatus, setFileModalStatus] = useState<boolean>(false);
  const [dataRoomModalStatus, setDataRoomModalStatus] = useState<boolean>(false);
  const [missionModalStatus, setMissionModalStatus] = useState<boolean>(false);
  const [assignmentModalStatus, setAssignmentModalStatus] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [displayMessages, setDisplayMessages] = useState<ChatMessageType[]>([]);
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState<boolean>(true);
  const [isSuccessCompleted, setIsSuccessCompleted] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const file = useRef<HTMLInputElement | null>(null);

  // 현재 로그인한 사용자 정보
  const currentUser = {
    id: Number(session?.userId),
    name: session?.user?.name || "사용자",
    email: session?.user?.email || "",
    image: session?.user?.image || null,
  };

  const token = session?.accessToken || "";
  const roomId = roomData.id;

  // WebSocket 메시지를 화면 표시용 타입으로 변환
  const convertWSMessageToDisplay = useCallback((wsMsg: WSChatMessage): ChatMessageType => {
    return {
      id: wsMsg.messageId,
      content: wsMsg.content || "",
      senderId: wsMsg.sender.id || 0,
      senderName: wsMsg.sender.name,
      timestamp: wsMsg.createdAt,
      messageType: wsMsg.type,
      readBy: [wsMsg.sender.id || 0],
    };
  }, []);

  // 메시지 관리 훅
  const {
    messages: apiMessages,
    loading: messagesLoading,
    addMessage: addApiMessage,
    markAsRead,
  } = useChatMessages({
    roomId,
    token,
    currentUserId: currentUser.id,
  });

  // WebSocket 훅
  const { isConnected, sendMessage: wsSendMessage } = useWebSocket({
    roomId,
    token,
    onMessageReceived: (wsMessage) => {
      addApiMessage(wsMessage);

      // 상대방 메시지는 자동 읽음 처리
      if (wsMessage.sender.id !== currentUser.id) {
        markAsRead(wsMessage.messageId);
      }
    },
    onReadBoundaryUpdate: (update) => {
      // 읽음 상태 실시간 업데이트
      setDisplayMessages((prev) =>
        prev.map((msg) => {
          if (update.lastReadMessageId && msg.id <= update.lastReadMessageId) {
            if (!msg.readBy.includes(update.userId)) {
              return { ...msg, readBy: [...msg.readBy, update.userId] };
            }
          }
          return msg;
        })
      );
      // 읽음 처리되면 읽지 않은 개수 0으로 업데이트
      if (update.userId === currentUser.id && onRoomUpdate) {
        onRoomUpdate(roomId, 0);
      }
    },
  });

  // API 메시지를 화면 표시용으로 변환
  useEffect(() => {
    const converted = apiMessages.map(convertWSMessageToDisplay);
    setDisplayMessages(converted);
  }, [apiMessages, convertWSMessageToDisplay]);

  // 실제 멤버 데이터 처리
  const actualMembers: Member[] = roomData.members || [];
  const memberCount: number = actualMembers.length || roomData.memberCount || 0;

  // 멤버 정보를 ChatMessage에서 사용할 수 있는 형태로 변환
  const chatUsers: ChatUser[] = [
    {
      id: currentUser.id,
      name: currentUser.name,
      avatar: generateAvatar(currentUser.name),
      role: actualMembers.find((m) => m.memberId === currentUser.id)?.roomRole || "MEMBER",
    },
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
  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // 메시지 전송
  const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || !isConnected) return;

    const success = wsSendMessage(trimmedMessage, "TEXT");

    if (success) {
      setMessage("");
      setTimeout(() => scrollToBottom(), 100);
    }
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

  // 방 타입에 맞는 정보 가져오기
  const getRoomTypeInfo = () => {
    const roomTypes = [
      {
        id: "BASIC",
        name: "Basic Room",
        price: "팀원당 2060원",
        description: "메가커피 아이스 아메리카노 1개",
        icon: "/megacoffe.webp",
        iconClass: "megacoffeeIcon",
      },
      {
        id: "STANDARD",
        name: "Standard Room",
        price: "팀원당 4841원",
        description: "스타벅스 아이스 아메리카노 1개",
        icon: "/starbucks.png",
        iconClass: "starbucksIcon",
      },
      {
        id: "ELITE",
        name: "Elite Room",
        price: "팀원당 8240원",
        description: "스타벅스 아이스 아메리카노 1개 + 프렌치 크루아상",
        icon: "/starbucks.png",
        iconClass: "starbucksIcon",
        isElite: true,
      },
    ];

    // DEMO 타입이면 BASIC 정보 반환
    const roomType = roomData.type === "DEMO" ? "BASIC" : roomData.type || "BASIC";
    return roomTypes.find((type) => type.id === roomType) || roomTypes[0];
  };

  // Payment 처리 완료 핸들러
  const handlePaymentComplete = (): void => {
    setShowPayment(false);
  };

  // 현재 사용자가 팀장인지 확인 - roomData에서 직접 가져오기
  const isLeader = roomData.role === "LEADER";

  // 디버깅용 로그
  useEffect(() => {
    console.log("Room Data Role:", roomData.role);
    console.log("Is Leader:", isLeader);
  }, [roomData.role, isLeader]);

  // 팀플 성공 처리
  const handleSuccess = async (): Promise<void> => {
    if (!isLeader) {
      alert("팀장만 팀플 성공을 선언할 수 있습니다.");
      return;
    }

    const confirmSuccess = window.confirm("팀플을 성공으로 마무리하시겠습니까?");
    if (!confirmSuccess) return;

    try {
      const response = await fetch(`http://13.125.193.243:8080/rooms/${roomData.id}/success`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("팀플이 성공적으로 완료되었습니다! 🎉");
        setIsSuccessCompleted(true); // 성공 상태로 변경
      } else {
        const errorText = await response.text();
        console.error("팀플 성공 처리 실패:", errorText);
        alert("팀플 성공 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("팀플 성공 API 호출 오류:", error);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  // 티밍룸 나가기 처리
  const handleExit = async (): Promise<void> => {
    const confirmExit = window.confirm("티밍룸에서 나가시겠습니까?");
    if (!confirmExit) return;

    try {
      const response = await fetch(`http://13.125.193.243:8080/rooms/${roomData.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("티밍룸에서 나갔습니다.");
        // 메인 페이지로 이동하거나 방 목록 새로고침 등의 처리
        window.location.href = "/mainpage"; // 또는 적절한 페이지로 리다이렉트
      } else {
        const errorText = await response.text();
        console.error("티밍룸 나가기 실패:", errorText);
        alert("티밍룸 나가기 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("티밍룸 나가기 API 호출 오류:", error);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  // 메시지 변경 시 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [displayMessages.length, scrollToBottom]);

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
                roomType={getRoomTypeInfo()}
                memberCount={memberCount}
                onPaymentComplete={handlePaymentComplete}
              />
            ) : (
              <>
                <div className={styles.chatMain}>
                  <div ref={messagesContainerRef} className={styles.messagesContainer}>
                    {messagesLoading && displayMessages.length === 0 ? (
                      <div className={styles.loadingMessages}>메시지를 불러오는 중...</div>
                    ) : (
                      displayMessages.map((msg, index) => {
                        const prevMessage = index > 0 ? displayMessages[index - 1] : null;
                        const nextMessage = index < displayMessages.length - 1 ? displayMessages[index + 1] : null;

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
                      })
                    )}
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
                      <Image
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/files/${member.avatarKey}?v=${member.avatarVersion}`}
                        alt={member.name}
                        width={40}
                        height={40}
                        className={styles.avatarImage}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const nextSibling = target.nextElementSibling as HTMLElement;
                          if (nextSibling) {
                            nextSibling.style.display = "block";
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

          {/* 팀플 성공 전: 팀장에게만 팀플 성공 버튼 표시 */}
          {!isSuccessCompleted && isLeader && (
            <div className={styles.successButton} onClick={handleSuccess}>
              <MdCelebration className={styles.successIcon} />
              팀플 성공
            </div>
          )}

          {/* 팀플 성공 후: 모든 멤버에게 티밍룸 나가기 버튼 표시 */}
          {isSuccessCompleted && (
            <div className={styles.exitButton} onClick={handleExit}>
              <ImExit className={styles.exitIcon} />
              티밍룸 나가기
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={file}
        style={{ display: "none" }}
        onChange={(e) => {
          console.log("파일 선택:", e.target.files?.[0]);
        }}
      />

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

      {dataRoomModalStatus && <DataRoom setModal={() => setDataRoomModalStatus(!dataRoomModalStatus)} />}

      {missionModalStatus && (
        <CreateMission
          setModal={() => setMissionModalStatus(!missionModalStatus)}
          members={actualMembers}
          roomId={roomData.id}
          onAssignmentCreated={() => {
            console.log("과제 생성 완료, AssignmentRoom 새로고침 필요");
          }}
        />
      )}

      {assignmentModalStatus && (
        <AssignmentRoom
          setModal={() => setAssignmentModalStatus(!assignmentModalStatus)}
          roomId={Number(roomData.id)}
          members={actualMembers}
        />
      )}
    </>
  );
}
