"use client";

import styles from "./chatroom.module.css";
import { FiMic, FiImage, FiPlus } from "react-icons/fi";
import { LuSmile } from "react-icons/lu";
import React, { useRef, useState } from "react";

import { FcDocument } from "react-icons/fc";
import { FcAddImage } from "react-icons/fc";
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

// 테스트용 유저 데이터
const testUsers = [
  {
    id: "1",
    name: "권민석",
    avatar: "🐱", // 이모지 또는 이미지 URL
  },
  {
    id: "2",
    name: "팀장 최순조",
    avatar: "👨‍💼",
  },
  {
    id: "3",
    name: "정치학 존잘남",
    avatar: "😎",
  },
  {
    id: "4",
    name: "팀플하기싫다",
    avatar: "😩",
  },
];

export default function ChatRoom({ roomData }: ChatRoomProps) {
  const [modalStatus, setModalStatus] = useState(false);
  const [missionModalStatus, setMissionModalStatus] = useState(false);

  const onHandleModalStatus = () => {
    setModalStatus(!modalStatus);
  };

  const onHandleMissionModalStatus = () => {
    setMissionModalStatus(!missionModalStatus);
  };

  const file = useRef<HTMLInputElement | null>(null);
  const openFileSelector = () => {
    file.current?.click();
    setModalStatus(!modalStatus);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.chatPage}>
          <div className={styles.chatHeader}>
            <div className={styles.chatRoomImg}></div>
            <p className={styles.chatRoomName}>{roomData.name}</p>
          </div>
          <div className={styles.chatBody}>
            <div className={styles.chatMain}>{/* 여기에 채팅 메시지들이 들어갈 예정 */}</div>
            <div className={styles.chatInput}>
              <button className={styles.iconButton}>
                <FiPlus size={20} color="#666" />
              </button>
              <input type="text" placeholder="메시지를 입력하세요" className={styles.messageInput} />
              <div className={styles.inputIcons}>
                <button className={styles.iconButton}>
                  <FiMic size={20} color="#666" />
                </button>
                <button className={styles.iconButton}>
                  <LuSmile size={20} color="#666" />
                </button>
                <button className={styles.iconButton}>
                  <FiImage size={20} color="#666" />
                </button>
              </div>
            </div>
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
            <div className={styles.item} onClick={onHandleModalStatus}>
              <FcDocument className={styles.itemIcon} />
              자료실
            </div>
            <div className={styles.item} onClick={onHandleMissionModalStatus}>
              <FcAddImage className={styles.itemIcon} />
              과제 생성하기
            </div>
          </div>

          <div className={styles.exitButton}>
            <ImExit className={styles.exitIcon} />
            티밍룸 나가기
          </div>
        </div>
      </div>

      {/* 모달 조건부 렌더링 */}
      {modalStatus && <DataRoom setModal={onHandleModalStatus} />}
      {missionModalStatus && <CreateMission setModal={onHandleMissionModalStatus} />}
    </>
  );
}
