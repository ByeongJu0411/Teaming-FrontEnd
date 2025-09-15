"use client";

import { JSX, useState } from "react";
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

  const handleMenuSelect = (menu: string): void => {
    // 빈 문자열이나 null을 받으면 초기 상태로 리셋
    if (menu === "" || menu === null) {
      setSelectedMenu(null);
      setSelectedRoom(null);
    } else {
      setSelectedMenu(menu);
      setSelectedRoom(null); // 메뉴 선택 시 선택된 룸 초기화
    }
  };

  const handleRoomSelect = (room: { id: string; name: string; lastChat: string }): void => {
    setSelectedRoom(room);
    setSelectedMenu(null); // 룸 선택 시 메뉴 초기화
  };

  const renderContent = (): JSX.Element | null => {
    // 룸이 선택된 경우 ChatRoom 컴포넌트 렌더링
    if (selectedRoom) {
      return <ChatRoom roomData={selectedRoom} />;
    }

    // 메뉴가 선택된 경우 해당 컴포넌트 렌더링
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

  return (
    <>
      <div className={styles.container}>
        <ActionBar onMenuSelect={handleMenuSelect} onRoomSelect={handleRoomSelect} selectedRoom={selectedRoom} />
        {renderContent()}
      </div>
    </>
  );
}
