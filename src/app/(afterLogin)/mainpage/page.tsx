"use client";

import { JSX, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./mainpage.module.css";
import ActionBar from "./_component/actionbar";
import CreateRoom from "./_component/createroom";
import FindRoom from "./_component/findroom";
import MyPage from "./_component/mypage";
import ChatRoom from "./_component/chatroom";
import Welcome from "./_component/welcome";
// ✅ Room 타입 정의 추가
interface Member {
  memberId: number;
  lastReadMessageId: number;
  name: string;
  avatarKey: string;
  avatarVersion: number;
  roomRole: "LEADER" | string;
}

interface Room {
  id: string;
  name: string;
  lastChat: string;
  unreadCount?: number;
  memberCount?: number;
  members?: Member[];
}
export default function MainPage(): JSX.Element {
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string; lastChat: string } | null>(null);
  const [backendAuthAttempted, setBackendAuthAttempted] = useState<boolean>(false);
  const [, setCanProceedWithoutBackend] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [, setRooms] = useState<Room[]>([]);
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasRedirected = useRef(false);

  // NextAuth 인증 체크 및 백엔드 토큰 상태 관리
  useEffect(() => {
    if (hasRedirected.current) return;

    if (status === "loading") {
      console.log("세션 로딩 중...");
      return;
    }

    if (status === "unauthenticated") {
      console.log("NextAuth 인증되지 않음 - 로그인 페이지로 이동");
      hasRedirected.current = true;
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session) {
      console.log("NextAuth 인증 성공");
      console.log("백엔드 인증 상태:", session.isBackendAuthenticated);
      console.log("백엔드 토큰 존재:", !!session.accessToken);

      // 백엔드 인증 상태에 따른 처리
      if (session.isBackendAuthenticated && session.accessToken && session.accessToken !== "temporary_skip_token") {
        console.log("백엔드 JWT 토큰 사용 가능 - 정상 진행");
        setBackendAuthAttempted(true);
        setCanProceedWithoutBackend(false);
      } else {
        console.log("백엔드 JWT 토큰 없음 - 제한된 기능으로 진행");
        setBackendAuthAttempted(true);
        setCanProceedWithoutBackend(true);

        // 백엔드 에러 정보 출력 (타입 안전하게)
        const sessionWithError = session as typeof session & {
          backendError?: {
            hasError: boolean;
            status: number;
            message: string;
            isNetworkError: boolean;
          };
        };

        if (sessionWithError.backendError) {
          console.log("백엔드 에러 정보:", sessionWithError.backendError);
        }
      }
    }
  }, [status, session, router]);

  const handleRoomUpdate = (roomId: string, unreadCount: number) => {
    setRooms((prevRooms) => prevRooms.map((room) => (room.id === roomId ? { ...room, unreadCount } : room)));
  };

  const handleMenuSelect = (menu: string): void => {
    if (menu === "" || menu === null) {
      setSelectedMenu(null);
      setSelectedRoom(null);
    } else {
      setSelectedMenu(menu);
      setSelectedRoom(null);
    }
  };

  const handleRoomSelect = (room: { id: string; name: string; lastChat: string }): void => {
    setSelectedRoom(room);
    setSelectedMenu(null);
  };

  const handleRoomCreated = () => {
    // 방 생성 완료 시 refreshTrigger를 증가시켜 ActionBar 새로고침
    setRefreshTrigger((prev) => prev + 1);
  };

  const renderContent = (): JSX.Element | null => {
    if (selectedRoom) {
      return <ChatRoom roomData={selectedRoom} onRoomUpdate={handleRoomUpdate} />;
    }

    switch (selectedMenu) {
      case "티밍룸 생성":
        return <CreateRoom onRoomCreated={handleRoomCreated} />;
      case "티밍룸 찾기":
        return <FindRoom onRoomJoined={handleRoomCreated} />;
      case "마이페이지":
        return <MyPage />;
      default:
        return <Welcome />;
    }
  };

  // 백엔드 토큰 재발급 시도 함수
  const retryBackendAuth = async (): Promise<void> => {
    console.log("백엔드 인증 재시도");
    // 페이지 새로고침으로 NextAuth 콜백 재실행
    window.location.reload();
  };

  // 로딩 중 (NextAuth 세션 로딩)
  if (status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minWidth: "100vw",
          minHeight: "100vh",
          background: "black",
          color: "white",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(255,255,255,0.3)",
              borderTop: "4px solid white",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          ></div>
          <p>인증 정보 확인 중...</p>
        </div>
      </div>
    );
  }

  // NextAuth 인증되지 않음
  if (status === "unauthenticated") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f8fafc",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>로그인 페이지로 이동 중...</h2>
        </div>
      </div>
    );
  }

  // 백엔드 인증 시도 전
  if (!backendAuthAttempted) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(255,255,255,0.3)",
              borderTop: "4px solid white",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          ></div>
          <p>백엔드 인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 정상적인 메인 페이지 렌더링
  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className={styles.container}>
        {/* 인증 상태 표시 */}
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            background: session?.isBackendAuthenticated ? "#10b981" : "#f59e0b",
            color: "white",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            zIndex: 1000,
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            minWidth: "220px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>인증 상태</div>
          <div>NextAuth: ✅ {session?.provider}</div>
          <div>Backend JWT: {session?.isBackendAuthenticated ? "✅ 연결됨" : "❌ 없음"}</div>
          <div style={{ fontSize: "10px", marginTop: "4px", opacity: 0.8 }}>{session?.user?.name || "사용자"}님</div>

          {/* 백엔드 토큰이 없을 때 재시도 버튼 */}
          {!session?.isBackendAuthenticated && (
            <button
              onClick={retryBackendAuth}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "10px",
                cursor: "pointer",
                marginTop: "6px",
                width: "100%",
              }}
            >
              백엔드 재연결 시도
            </button>
          )}
        </div>

        <ActionBar
          onMenuSelect={handleMenuSelect}
          onRoomSelect={handleRoomSelect}
          selectedRoom={selectedRoom}
          refreshTrigger={refreshTrigger}
        />
        {renderContent()}
      </div>
    </>
  );
}
