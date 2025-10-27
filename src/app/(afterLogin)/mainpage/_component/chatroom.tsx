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
import SpotlightCard from "@/app/_component/SpotlightCard";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useChatMessages } from "@/hooks/useChatMessages";

interface RoomMemberResponseDto {
  memberId: number;
  lastReadMessageId: number | null;
  name: string;
  avatarUrl: string | null;
  avatarVersion: number | null;
  roomRole: "LEADER" | string;
}

interface RoomSuccessEvent {
  roomId: number;
}

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

interface Member {
  memberId: number;
  lastReadMessageId: number;
  name: string;
  avatarKey: string;
  avatarVersion: number;
  avatarUrl?: string;
  roomRole: "LEADER" | string;
}

interface ChatUser {
  id: number;
  name: string;
  avatar: string;
  avatarKey?: string;
  avatarVersion?: number;
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
    roomImageUrl?: string;
    paymentStatus?: "NOT_PAID" | "PAID";
    success?: boolean; // success 필드 추가
  };
  onRoomUpdate?: (roomId: string, unreadCount: number) => void;
  onRefreshRoom?: () => void;
}

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

interface ChatMessageType {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  messageType: "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO" | "SYSTEM" | "SYSTEM_NOTICE";
  readBy: number[];
  attachments?: MessageAttachment[];
}

const generateAvatar = (name: string): string => {
  const avatars = ["🐱", "🐶", "🐰", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵"];
  const index = name.length % avatars.length;
  return avatars[index];
};

export default function ChatRoom({ roomData, onRoomUpdate, onRefreshRoom }: ChatRoomProps) {
  const { data: session } = useSession();

  const [fileModalStatus, setFileModalStatus] = useState<boolean>(false);
  const [dataRoomModalStatus, setDataRoomModalStatus] = useState<boolean>(false);
  const [missionModalStatus, setMissionModalStatus] = useState<boolean>(false);
  const [assignmentModalStatus, setAssignmentModalStatus] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [displayMessages, setDisplayMessages] = useState<ChatMessageType[]>([]);
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showLeaderOnlyModal, setShowLeaderOnlyModal] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>(roomData.members || []);

  // API success 필드 기반으로 상태 초기화
  const [isSuccessCompleted, setIsSuccessCompleted] = useState<boolean>(roomData.success || false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement | null>(null);
  const documentFileRef = useRef<HTMLInputElement | null>(null);

  const currentUser = {
    id: Number(session?.userId),
    name: session?.user?.name || "사용자",
    email: session?.user?.email || "",
    image: session?.user?.image || null,
  };

  const token = session?.accessToken || "";
  const roomId = roomData.id;

  console.log("ChatRoom 초기화:", {
    roomId: roomData.id,
    roomSuccess: roomData.success,
    isSuccessCompleted: isSuccessCompleted,
    role: roomData.role,
  });

  const convertWSMessageToDisplay = useCallback((wsMsg: WSChatMessage): ChatMessageType => {
    return {
      id: wsMsg.messageId,
      content: wsMsg.content || "",
      senderId: wsMsg.sender.id || 0,
      senderName: wsMsg.sender.name,
      timestamp: wsMsg.createdAt,
      messageType: wsMsg.type,
      readBy: [wsMsg.sender.id || 0],
      attachments: wsMsg.attachments || [],
    };
  }, []);

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

  const handleMemberEntered = useCallback((member: RoomMemberResponseDto) => {
    console.log("새 멤버 입장:", member);

    setMembers((prevMembers) => {
      const exists = prevMembers.some((m) => m.memberId === member.memberId);
      if (exists) {
        console.log("이미 존재하는 멤버:", member.memberId);
        return prevMembers;
      }

      return [
        ...prevMembers,
        {
          memberId: member.memberId,
          lastReadMessageId: member.lastReadMessageId || 0,
          name: member.name,
          avatarKey: "",
          avatarVersion: member.avatarVersion || 0,
          avatarUrl: member.avatarUrl || undefined,
          roomRole: member.roomRole,
        },
      ];
    });
  }, []);

  const handleRoomSuccess = useCallback(
    (event: RoomSuccessEvent) => {
      console.log("팀플 성공 알림 수신:", event);
      setShowSuccessModal(true);
      setIsSuccessCompleted(true);

      // 부모 컴포넌트에 방 정보 새로고침 요청 (success 상태 업데이트를 위해)
      if (onRefreshRoom) {
        onRefreshRoom();
      }
    },
    [onRefreshRoom]
  );

  const { isConnected, sendMessage: wsSendMessage } = useWebSocket({
    roomId,
    token,
    onMessageReceived: (wsMessage) => {
      addApiMessage(wsMessage);

      if (wsMessage.sender.id !== currentUser.id) {
        markAsRead(wsMessage.messageId);
      }
    },
    onReadBoundaryUpdate: (update) => {
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
      if (update.userId === currentUser.id && onRoomUpdate) {
        onRoomUpdate(roomId, 0);
      }
    },
    onMemberEntered: handleMemberEntered,
    onRoomSuccess: handleRoomSuccess,
  });

  useEffect(() => {
    const converted = apiMessages.map(convertWSMessageToDisplay);
    setDisplayMessages(converted);
  }, [apiMessages, convertWSMessageToDisplay]);

  useEffect(() => {
    const handleUserInfoUpdate = () => {
      console.log("ChatRoom: 사용자 정보 업데이트 감지, 방 정보 새로고침 요청");
      if (onRefreshRoom) {
        onRefreshRoom();
      }
    };

    window.addEventListener("userAvatarUpdated", handleUserInfoUpdate);
    window.addEventListener("userNameUpdated", handleUserInfoUpdate);

    return () => {
      window.removeEventListener("userAvatarUpdated", handleUserInfoUpdate);
      window.removeEventListener("userNameUpdated", handleUserInfoUpdate);
    };
  }, [onRefreshRoom]);

  useEffect(() => {
    if (roomData.members) {
      setMembers(roomData.members);
    }
  }, [roomData.members]);

  // roomData.success 변경 시 상태 업데이트
  useEffect(() => {
    console.log("roomData.success 변경됨:", roomData.success);
    setIsSuccessCompleted(roomData.success || false);
  }, [roomData.success]);

  const chatUsers: ChatUser[] = members.map((member: Member) => {
    const avatarUrl = member.avatarUrl || "";

    return {
      id: member.memberId,
      name: member.name,
      avatar: avatarUrl || generateAvatar(member.name),
      avatarKey: member.avatarKey,
      avatarVersion: member.avatarVersion,
      role: member.roomRole,
    };
  });

  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const openImageSelector = (): void => {
    imageFileRef.current?.click();
    setFileModalStatus(false);
  };

  const openDocumentSelector = (): void => {
    documentFileRef.current?.click();
    setFileModalStatus(false);
  };

  const handleFileUpload = async (file: File, fileType: "IMAGE" | "DOCUMENT"): Promise<void> => {
    try {
      if (!token) {
        alert("인증 토큰이 없습니다.");
        return;
      }

      console.log("=== 파일 업로드 Intent 시작 ===");
      console.log("파일 정보:", {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadType: fileType,
      });

      const requestBody = {
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      };

      const intentResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/files/intent/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Intent API 응답 상태:", intentResponse.status);

      if (!intentResponse.ok) {
        const errorText = await intentResponse.text();
        console.error("Intent API 실패:", errorText);
        return;
      }

      const intentData = await intentResponse.json();
      console.log("Intent 성공:", intentData);

      console.log("=== S3 업로드 시작 ===");
      const s3UploadResponse = await fetch(intentData.url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      console.log("S3 업로드 응답 상태:", s3UploadResponse.status);

      if (!s3UploadResponse.ok) {
        const errorText = await s3UploadResponse.text();
        console.error("S3 업로드 실패:", errorText);
        return;
      }

      console.log("S3 업로드 성공!");

      console.log("=== 파일 업로드 확정 시작 ===");
      const completeResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/files/complete/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: intentData.key,
        }),
      });

      console.log("Complete API 응답 상태:", completeResponse.status);

      if (!completeResponse.ok) {
        const errorText = await completeResponse.text();
        console.error("Complete API 실패:", errorText);
        return;
      }

      const completeData = await completeResponse.json();
      console.log("파일 업로드 완료:", completeData);

      const messageType = fileType === "IMAGE" ? "IMAGE" : "FILE";

      const fileMessageSuccess = wsSendMessage(file.name, messageType, [completeData.fileId]);

      if (fileMessageSuccess) {
        setTimeout(() => scrollToBottom(), 100);
      } else {
        console.error("파일 메시지 전송 실패");
      }
    } catch (error) {
      console.error("파일 업로드 오류:", error);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("이미지 파일 선택:", file.name);
      handleFileUpload(file, "IMAGE");
    }
  };

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("문서 파일 선택:", file.name);
      handleFileUpload(file, "DOCUMENT");
    }
  };

  const isLeader = roomData.role === "LEADER";

  // 과제 생성하기 클릭 핸들러
  const handleMissionClick = () => {
    if (isLeader) {
      setMissionModalStatus(!missionModalStatus);
    } else {
      setShowLeaderOnlyModal(true);
    }
  };

  const handleSuccess = async (): Promise<void> => {
    const confirmSuccess = window.confirm("팀플을 성공으로 마무리하시겠습니까?");
    if (!confirmSuccess) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080";

      // 1️⃣ 첫 번째 API: 팀플 성공 처리
      console.log("1️⃣ 팀플 성공 API 호출 시작");
      const successResponse = await fetch(`${backendUrl}/rooms/${roomData.id}/success`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!successResponse.ok) {
        const errorText = await successResponse.text();
        console.error("❌ 팀플 성공 처리 실패:", errorText);
        alert(`팀플 성공 처리 실패\n${errorText}`);
        return; // ⭐ 첫 번째 API 실패 시 여기서 중단
      }

      console.log("✅ 팀플 성공 API 호출 성공");

      // 2️⃣ 두 번째 API: 결제 인증 취소 (환급 처리)
      console.log("2️⃣ 결제 인증 취소 API 호출 시작");
      const cancelAuthResponse = await fetch(`${backendUrl}/payment/cancelAuth`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: roomData.id,
        }),
      });

      if (!cancelAuthResponse.ok) {
        const cancelAuthError = await cancelAuthResponse.text();
        console.error("❌ 결제 인증 취소 실패:", cancelAuthError);

        // ⚠️ 환급 실패해도 팀플 성공은 완료된 상태이므로 경고만 표시
        alert("팀플은 성공했지만 환급 처리 중 오류가 발생했습니다.\n고객센터에 문의해주세요.");
      } else {
        console.log("✅ 결제 인증 취소 API 호출 성공 (환급 완료)");
      }

      // 3️⃣ 모달 표시 및 상태 업데이트
      setShowSuccessModal(true);
      setIsSuccessCompleted(true);
    } catch (error) {
      console.error("💥 API 호출 오류:", error);
      alert("처리 중 네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleExit = (): void => {
    setShowExitModal(true);
  };

  const handleConfirmExit = async (): Promise<void> => {
    try {
      console.log("티밍룸 나가기 시도:", {
        roomId: roomData.id,
        token: token ? "존재함" : "없음",
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/rooms/${roomData.id}`,
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rooms/${roomData.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("나가기 API 응답:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (response.ok) {
        console.log("티밍룸 나가기 성공");
        alert("티밍룸에서 나갔습니다.");
        window.location.href = "/mainpage";
      } else {
        const errorText = await response.text();
        console.error("티밍룸 나가기 실패:", {
          status: response.status,
          errorText: errorText,
        });

        // 500 에러의 경우 서버 문제이므로 사용자에게 다른 메시지 제공
        if (response.status === 500) {
          const confirmForceExit = window.confirm(
            "서버에서 일시적인 문제가 발생했습니다.\n" +
              "그래도 메인페이지로 이동하시겠습니까?\n" +
              "(방에서 완전히 나가지지 않을 수 있습니다)"
          );

          if (confirmForceExit) {
            window.location.href = "/mainpage";
          }
        } else if (response.status === 401) {
          alert("인증이 만료되었습니다. 다시 로그인해주세요.");
          window.location.href = "/login";
        } else if (response.status === 403) {
          alert("방 나가기 권한이 없습니다.");
        } else if (response.status === 404) {
          alert("존재하지 않는 방입니다. 메인페이지로 이동합니다.");
          window.location.href = "/mainpage";
        } else {
          alert(`티밍룸 나가기 중 오류가 발생했습니다. (${response.status})\n백엔드 개발자에게 문의해주세요.`);
        }
      }
    } catch (error) {
      console.error("티밍룸 나가기 API 호출 오류:", error);

      const confirmNetworkError = window.confirm(
        "네트워크 오류가 발생했습니다.\n" + "그래도 메인페이지로 이동하시겠습니까?"
      );

      if (confirmNetworkError) {
        window.location.href = "/mainpage";
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages.length, scrollToBottom]);

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
            <div className={styles.chatRoomImg}>
              {roomData.roomImageUrl && roomData.roomImageUrl !== "/good_space1.jpg" ? (
                <Image
                  src={roomData.roomImageUrl}
                  alt={roomData.name}
                  width={50}
                  height={50}
                  className={styles.chatRoomImage}
                  unoptimized
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = "/good_space1.jpg";
                  }}
                />
              ) : (
                <Image
                  src="/good_space1.jpg"
                  alt="기본 프로필"
                  width={50}
                  height={50}
                  className={styles.chatRoomImage}
                  unoptimized
                />
              )}
            </div>
            <p className={styles.chatRoomName}>{roomData.name}</p>
            <div className={styles.connectionStatus}>
              {isConnected && <span className={styles.connected}>●</span>}
              {!isConnected && <span className={styles.disconnected}>연결 끊김</span>}
            </div>
          </div>

          <div className={styles.chatBody}>
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
          </div>
        </div>

        <div className={styles.chatRoomInfo}>
          <div className={styles.chatRoomInfoHeader}>
            <div className={styles.chatRoomInfoImg}>
              {roomData.roomImageUrl && roomData.roomImageUrl !== "/good_space1.jpg" ? (
                <Image
                  src={roomData.roomImageUrl}
                  alt={roomData.name}
                  width={60}
                  height={60}
                  className={styles.chatRoomInfoImage}
                  unoptimized
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = "/good_space1.jpg";
                  }}
                />
              ) : (
                <Image
                  src="/good_space1.jpg"
                  alt="기본 프로필"
                  width={60}
                  height={60}
                  className={styles.chatRoomInfoImage}
                  unoptimized
                />
              )}
            </div>
            <div className={styles.chatRoomInfoName}>{roomData.name}</div>
          </div>

          <div className={styles.chatUserList}>
            <div className={styles.userListTitle}>참여자 ({members.length})</div>
            {members.length > 0 ? (
              members.map((member: Member) => {
                const avatarUrl = member.avatarUrl || "";
                const hasAvatar = !!avatarUrl;

                return (
                  <div key={member.memberId} className={styles.userItem}>
                    <div className={styles.userAvatar}>
                      {hasAvatar ? (
                        <>
                          <Image
                            src={avatarUrl}
                            alt={member.name}
                            width={40}
                            height={40}
                            className={styles.avatarImage}
                            unoptimized
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                const emojiSpan = parent.querySelector(`.${styles.emojiAvatar}`) as HTMLElement;
                                if (emojiSpan) {
                                  emojiSpan.style.display = "flex";
                                }
                              }
                            }}
                          />
                          <span className={styles.emojiAvatar} style={{ display: "none" }}>
                            {generateAvatar(member.name)}
                          </span>
                        </>
                      ) : (
                        <span className={styles.emojiAvatar}>{generateAvatar(member.name)}</span>
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>
                        {member.name}
                        {member.roomRole === "LEADER" && <span className={styles.leaderBadge}>👑</span>}
                        {member.memberId === currentUser.id && <span className={styles.currentUserBadge}>(나)</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.loadingMembers}>멤버 정보를 불러오는 중...</div>
            )}
          </div>

          <div className={styles.chatNavItem}>
            <div className={styles.item} onClick={() => setDataRoomModalStatus(!dataRoomModalStatus)}>
              📋 자료실
            </div>
            <div className={styles.item} onClick={handleMissionClick}>
              ➕ 과제 생성하기
            </div>
            <div className={styles.item} onClick={() => setAssignmentModalStatus(!assignmentModalStatus)}>
              📖 과제 확인하기
            </div>
          </div>

          {/* 팀플 성공 버튼: 팀장이고 아직 성공하지 않은 경우에만 표시 */}
          {!isSuccessCompleted && isLeader && (
            <div className={styles.successButton} onClick={handleSuccess}>
              <MdCelebration className={styles.successIcon} />
              팀플 성공
            </div>
          )}

          {/* 나가기 버튼: 팀플이 성공한 경우 모든 멤버에게 표시 */}
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
        ref={imageFileRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageFileChange}
      />

      <input
        type="file"
        ref={documentFileRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.hwp"
        style={{ display: "none" }}
        onChange={handleDocumentFileChange}
      />

      {fileModalStatus && (
        <div className={styles.modalOverlay} onClick={() => setFileModalStatus(false)}>
          <div className={styles.fileModal} onClick={(e) => e.stopPropagation()}>
            <h3>파일 첨부</h3>
            <div className={styles.fileOptions}>
              <button onClick={openDocumentSelector} className={styles.fileOption}>
                <FcDocument size={24} />
                <span>문서</span>
              </button>
              <button onClick={openImageSelector} className={styles.fileOption}>
                <FcAddImage size={24} />
                <span>이미지</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {dataRoomModalStatus && (
        <DataRoom
          setModal={() => setDataRoomModalStatus(!dataRoomModalStatus)}
          roomId={roomData.id}
          members={members}
        />
      )}

      {missionModalStatus && (
        <CreateMission
          setModal={() => setMissionModalStatus(!missionModalStatus)}
          members={members}
          roomId={roomData.id}
          onAssignmentCreated={() => {
            console.log("과제 생성 완료");
          }}
        />
      )}

      {assignmentModalStatus && (
        <AssignmentRoom
          setModal={() => setAssignmentModalStatus(!assignmentModalStatus)}
          roomId={Number(roomData.id)}
          members={members}
        />
      )}

      {/* 팀장 전용 기능 안내 모달 */}
      {showLeaderOnlyModal && (
        <div className={styles.exitModalOverlay} onClick={() => setShowLeaderOnlyModal(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <SpotlightCard className={styles.exitModalCard} spotlightColor="rgba(63, 63, 212, 0.3)">
              <div className={styles.exitModalContent}>
                <h2 className={styles.exitModalTitle}>👑 팀장 전용 기능</h2>
                <p className={styles.exitModalDescription}>
                  과제 생성은 팀장만 가능합니다.{"\n"}
                  팀장에게 과제 생성을 요청해주세요.
                </p>
                <div className={styles.exitModalButtons}>
                  <button className={styles.exitModalConfirm} onClick={() => setShowLeaderOnlyModal(false)}>
                    확인
                  </button>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className={styles.exitModalOverlay} onClick={() => setShowSuccessModal(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <SpotlightCard className={styles.exitModalCard} spotlightColor="rgba(63, 63, 212, 0.3)">
              <div className={styles.exitModalContent}>
                <h2 className={styles.exitModalTitle}>🎉 팀플 성공!</h2>
                <p className={styles.exitModalDescription}>
                  {roomData.role === "LEADER"
                    ? "팀플이 성공적으로 완료되었습니다!\n환급이 진행되었으니 티밍룸을 나가실 수 있습니다."
                    : "팀장이 팀플 성공을 선언했습니다!\n환급이 진행되었으니 티밍룸을 나가실 수 있습니다."}
                </p>
                <div className={styles.exitModalButtons}>
                  <button className={styles.exitModalConfirm} onClick={() => setShowSuccessModal(false)}>
                    확인
                  </button>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>
      )}

      {showExitModal && (
        <div className={styles.exitModalOverlay} onClick={() => setShowExitModal(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <SpotlightCard className={styles.exitModalCard} spotlightColor="rgba(63, 63, 212, 0.3)">
              <div className={styles.exitModalContent}>
                <h2 className={styles.exitModalTitle}>고생하셨습니다!</h2>
                <p className={styles.exitModalDescription}>환급은 팀플 성공 시점에서 진행되었습니다</p>
                <div className={styles.exitModalButtons}>
                  <button className={styles.exitModalConfirm} onClick={handleConfirmExit}>
                    나가기
                  </button>
                  <button className={styles.exitModalCancel} onClick={() => setShowExitModal(false)}>
                    취소
                  </button>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>
      )}
    </>
  );
}
