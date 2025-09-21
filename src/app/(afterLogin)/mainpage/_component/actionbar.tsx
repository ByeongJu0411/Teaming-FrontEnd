"use client";

import { JSX, useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./actionbar.module.css";

interface ActionBarProps {
  onMenuSelect: (menu: string) => void;
  onRoomSelect: (room: { id: string; name: string; lastChat: string }) => void;
  selectedRoom: { id: string; name: string; lastChat: string } | null;
  // userInfo prop 추가 (사용하지 않더라도 타입 에러 방지)
  userInfo?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function ActionBar({ onMenuSelect, onRoomSelect, selectedRoom }: ActionBarProps): JSX.Element {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const { data: session } = useSession(); // 세션 정보 가져오기

  const navItems: string[] = ["티밍룸 생성", "티밍룸 찾기", "마이페이지"];

  const handleItemClick = (item: string): void => {
    setSelectedItem(item);
    onMenuSelect(item);
  };

  const handleRoomClick = (room: { id: string; name: string; lastChat: string }): void => {
    onRoomSelect(room);
    setSelectedItem(null);
  };

  const handleHomeClick = (): void => {
    setSelectedItem(null);
    onMenuSelect("");
  };

  const rooms = [
    { id: "room1", name: "티밍룸 A", lastChat: "마지막 채팅 내용입니다." },
    { id: "room2", name: "티밍룸 B", lastChat: "마지막 채팅 내용입니다." },
  ];

  // 사용자 정보 추출
  const userImage = session?.user?.image;
  const userName = session?.user?.name || "사용자";

  return (
    <div className={styles.actionBar}>
      <div className={styles.header} onClick={handleHomeClick}>
        Teaming
      </div>
      <div className={styles.navBar}>
        <div className={styles.userInfo}>
          <div className={styles.userImg}>
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt="사용자 프로필" className={styles.profileImage} />
            ) : (
              // 기본 아바타 아이콘 (이미지가 없을 때)
              <div className={styles.defaultAvatar}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className={styles.userName}>{userName}님</div>
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
