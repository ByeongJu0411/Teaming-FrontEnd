"use client";

import { JSX, useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Room, Member } from "@/types/room";
import { useRouter } from "next/navigation";

// 방 타입 정보 인터페이스
interface RoomTypeInfo {
  typeName: string;
  price: number;
  description: string;
}
import styles from "./mainpage.module.css";
import ActionBar from "./_component/actionbar";
import CreateRoom from "./_component/createroom";
import FindRoom from "./_component/findroom";
import MyPage from "./_component/mypage";
import ChatRoom from "./_component/chatroom";
import Welcome from "./_component/welcome";
import PaymentModal from "./_component/payment";
import SpotlightCard from "@/app/_component/SpotlightCard";

export default function MainPage(): JSX.Element {
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [backendAuthAttempted, setBackendAuthAttempted] = useState<boolean>(false);
  const [showAuthErrorModal, setShowAuthErrorModal] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
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
      console.log("=== MainPage 세션 정보 ===");
      console.log("Provider:", session.provider);
      console.log("User Name:", session.user?.name);
      console.log("User Email:", session.user?.email);
      console.log("Access Token 존재:", !!session.accessToken);
      console.log("Is Backend Authenticated:", session.isBackendAuthenticated);
      console.log("=======================");

      // 백엔드 인증 실패 시 모달 표시
      if (!session.isBackendAuthenticated || !session.accessToken) {
        console.error("❌ 백엔드 JWT 토큰이 없습니다.");

        if (session.backendError) {
          console.error("백엔드 에러 정보:", session.backendError);
        }

        setBackendAuthAttempted(true);
        setShowAuthErrorModal(true);

        return;
      }

      // 백엔드 인증 성공
      console.log("✅ 백엔드 JWT 토큰 사용 가능 - 정상 진행");
      setBackendAuthAttempted(true);
    }
  }, [status, session, router]);

  // 로그인 페이지로 이동
  const handleGoToLogin = async () => {
    hasRedirected.current = true;
    await signOut({ redirect: false });
    router.push("/login");
  };

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

  const handleRoomSelect = (room: Room): void => {
    console.log("MainPage: 방 선택됨:", room.name);
    console.log("MainPage: 결제 상태:", room.paymentStatus);
    console.log("MainPage: 방 타입:", room.type);

    setSelectedRoom(room);
    setSelectedMenu(null);

    // ✅ 결제 필요 여부 먼저 확인
    if (room.paymentStatus === "NOT_PAID" && room.type !== "DEMO") {
      console.log("MainPage: 결제가 필요한 방입니다 - PaymentModal 표시");
      setShowPaymentModal(true);
    } else {
      console.log("MainPage: 결제 완료된 방 또는 DEMO 방입니다 - ChatRoom 진입");
      setShowPaymentModal(false);
    }
  };

  const handleRoomCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // 선택된 방 정보 새로고침 함수
  const refreshSelectedRoom = useCallback(async () => {
    if (!selectedRoom || !session?.accessToken) {
      console.log("MainPage: 방 정보 새로고침 불가 (방 미선택 또는 토큰 없음)");
      return;
    }

    try {
      console.log("MainPage: 방 정보 새로고침 시작:", selectedRoom.id);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/rooms/${selectedRoom.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error("MainPage: 방 정보 조회 실패:", response.status);
        return;
      }

      const data = await response.json();
      console.log("MainPage: 방 정보 조회 성공:", data);

      // 멤버 정보에 avatarUrl 추가
      const membersWithAvatarUrl = data.members.map((member: Member) => ({
        ...member,
        avatarUrl: member.avatarUrl || "",
      }));

      const roomImageUrl = data.avatarUrl || "/good_space1.jpg";

      // 방 정보 업데이트
      setSelectedRoom({
        ...selectedRoom,
        members: membersWithAvatarUrl,
        name: data.title || selectedRoom.name,
        type: data.type || selectedRoom.type,
        role: data.role || selectedRoom.role,
        memberCount: data.memberCount || selectedRoom.memberCount,
        roomImageUrl: roomImageUrl,
        paymentStatus: data.paymentStatus || selectedRoom.paymentStatus,
      });

      console.log("MainPage: 방 정보 업데이트 완료");
    } catch (error) {
      console.error("MainPage: 방 정보 새로고침 오류:", error);
    }
  }, [selectedRoom, session?.accessToken]);

  // ✅ 결제 완료 핸들러
  const handlePaymentComplete = async () => {
    console.log("MainPage: 결제 완료됨");
    setShowPaymentModal(false);

    // 방 정보 새로고침 (paymentStatus 업데이트)
    await refreshSelectedRoom();

    // ActionBar의 방 목록도 새로고침
    setRefreshTrigger((prev) => prev + 1);
  };

  // ✅ 결제 취소 핸들러
  const handlePaymentCancel = () => {
    console.log("MainPage: 결제 취소됨");
    setShowPaymentModal(false);
    setSelectedRoom(null); // 방 선택 해제
  };

  const renderContent = (): JSX.Element | null => {
    // ✅ 결제 모달이 최우선 (결제가 필요한 경우)
    if (showPaymentModal && selectedRoom) {
      // roomTypeInfo가 있으면 사용, 없으면 기본값
      const typeInfo = selectedRoom.roomTypeInfo;
      const price: string = typeInfo ? `${typeInfo.price.toLocaleString()}원` : "0원";
      const description: string = typeInfo ? typeInfo.description : "1인당 결제 금액";
      const typeName: string = typeInfo ? typeInfo.typeName : selectedRoom.type || "BASIC";

      // ✅ 디버깅 로그 추가
      console.log("MainPage PaymentModal 렌더링:");
      console.log("- selectedRoom.type:", selectedRoom.type);
      console.log("- selectedRoom.roomTypeInfo:", selectedRoom.roomTypeInfo);
      console.log("- typeName:", typeName);

      // ✅ 방 타입에 따른 아이콘 결정
      const getIconForRoomType = (type: string): string => {
        const iconMap: { [key: string]: string } = {
          BASIC: "/megacoffe.webp",
          STANDARD: "/starbucks.png",
          ELITE: "/starbucks.png",
          DEMO: "/good_space1.jpg",
        };
        const icon = iconMap[type] || "/good_space1.jpg";
        console.log(`- getIconForRoomType(${type}) => ${icon}`);
        return icon;
      };

      const iconPath = getIconForRoomType(typeName);

      return (
        <PaymentModal
          setModal={handlePaymentCancel}
          roomType={{
            id: typeName,
            name: selectedRoom.name,
            price: price,
            description: description,
            icon: iconPath, // ✅ 방 타입 기반 아이콘
            iconClass: "",
          }}
          memberCount={selectedRoom.memberCount || 0}
          onPaymentComplete={handlePaymentComplete}
          roomId={selectedRoom.id}
        />
      );
    }

    // ✅ 결제가 완료된 경우에만 ChatRoom 렌더링
    if (selectedRoom) {
      return <ChatRoom roomData={selectedRoom} onRoomUpdate={handleRoomUpdate} onRefreshRoom={refreshSelectedRoom} />;
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

  // 백엔드 인증 실패 모달
  if (showAuthErrorModal) {
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
        <SpotlightCard className={styles.authErrorModal} spotlightColor="rgba(59, 130, 246, 0.3)">
          <div className={styles.authErrorContent}>
            <h2 className={styles.authErrorTitle}>토큰 오류입니다!</h2>
            <p className={styles.authErrorDescription}>등록된 계정이 이미 존재하거나, 토큰 만료 오류입니다.</p>
            <button className={styles.authErrorButton} onClick={handleGoToLogin}>
              로그인 페이지로 이동
            </button>
          </div>
        </SpotlightCard>
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
