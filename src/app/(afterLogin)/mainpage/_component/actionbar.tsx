"use client";

import { JSX, useState } from "react";
import styles from "./actionbar.module.css";

interface ActionBarProps {
  onMenuSelect: (menu: string) => void;
  onRoomSelect: (room: { id: string; name: string; lastChat: string }) => void;
  selectedRoom: { id: string; name: string; lastChat: string } | null;
}

export default function ActionBar({ onMenuSelect, onRoomSelect, selectedRoom }: ActionBarProps): JSX.Element {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const navItems: string[] = ["티밍룸 생성", "티밍룸 찾기", "마이페이지"];

  const handleItemClick = (item: string): void => {
    setSelectedItem(item);
    onMenuSelect(item);
  };

  const handleRoomClick = (room: { id: string; name: string; lastChat: string }): void => {
    onRoomSelect(room);
    setSelectedItem(null); // 룸 클릭 시 선택된 메뉴 아이템 초기화
  };

  // 홈으로 돌아가기 함수 추가
  const handleHomeClick = (): void => {
    setSelectedItem(null); // 선택된 메뉴 아이템 초기화
    onMenuSelect(""); // 빈 문자열로 메뉴 초기화 (또는 특별한 값)
  };

  const rooms = [
    { id: "room1", name: "티밍룸 A", lastChat: "마지막 채팅 내용입니다." },
    { id: "room2", name: "티밍룸 B", lastChat: "마지막 채팅 내용입니다." },
  ];

  return (
    <div className={styles.actionBar}>
      <div className={styles.header} onClick={handleHomeClick}>
        Teaming
      </div>
      <div className={styles.navBar}>
        <div className={styles.userInfo}>
          <div className={styles.userImg}></div>
          <div className={styles.userName}>사용자님</div>
        </div>
        <div className={styles.navItem}>
          {navItems.map((item) => (
            <p
              key={item}
              className={`${styles.Item} ${selectedItem === item ? styles.selected : ""}`}
              onClick={() => handleItemClick(item)}
            >
              {item}
            </p>
          ))}
        </div>
      </div>
      <div className={styles.roomList}>
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`${styles.roomItem} ${selectedRoom?.id === room.id ? styles.selectedRoom : ""}`}
            onClick={() => handleRoomClick(room)}
          >
            <div className={styles.roomImg}></div>
            <div className={styles.roomInfo}>
              <p className={styles.roomName}>{room.name}</p>
              <p className={styles.lastChat}>{room.lastChat}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
