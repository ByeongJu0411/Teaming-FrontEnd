// 가장 간단한 방법: 백엔드 인증 체크 완전 비활성화
"use client";

import { JSX, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./mainpage.module.css";
import ActionBar from "./_component/actionbar";
import CreateRoom from "./_component/createroom";
import FindRoom from "./_component/findroom";
import MyPage from "./_component/mypage";
import ChatRoom from "./_component/chatroom";
import Welcome from "./_component/welcome";

export default function MainPage(): JSX.Element {
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string; lastChat: string } | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  // NextAuth 인증만 체크 (백엔드 토큰 무시)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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

  const renderContent = (): JSX.Element | null => {
    if (selectedRoom) {
      return <ChatRoom roomData={selectedRoom} />;
    }

    switch (selectedMenu) {
      case "티밍룸 생성":
        return <CreateRoom />;
      case "티밍룸 찾기":
        return <FindRoom />;
      case "마이페이지":
        return <MyPage />;
      default:
        return <Welcome />;
    }
  };

  // 로딩 중
  if (status === "loading") {
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
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않음
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

  // 정상 메인 페이지 (백엔드 토큰 상관없이)
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
        {/* 임시 상태 표시 */}
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            background: "#10b981",
            color: "white",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            zIndex: 1000,
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ fontWeight: "bold" }}>임시 모드</div>
          <div>NextAuth: ✅</div>
          <div>Backend: 스킵</div>
          <div style={{ fontSize: "10px", opacity: 0.8 }}>{session?.user?.name || "사용자"}님</div>
        </div>

        <ActionBar onMenuSelect={handleMenuSelect} onRoomSelect={handleRoomSelect} selectedRoom={selectedRoom} />
        {renderContent()}
      </div>
    </>
  );
}
