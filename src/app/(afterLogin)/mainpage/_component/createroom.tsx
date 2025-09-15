"use client";
import { useState } from "react";
import styles from "./createroom.module.css";
import Image from "next/image";

export default function CreateRoom() {
  const [teamCount, setTeamCount] = useState(1);
  const [roomTitle, setRoomTitle] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  const handleCountChange = (increment: boolean) => {
    if (increment) {
      setTeamCount((prev) => prev + 1);
    } else {
      setTeamCount((prev) => Math.max(1, prev - 1));
    }
  };

  const roomTypes = [
    {
      id: "basic",
      name: "Basic Room",
      price: "팀원당 2060원",
      description: "메가커피 아이스 아메리카노 1개",
      icon: "/megacoffe.webp",
      iconClass: "megacoffeeIcon",
    },
    {
      id: "standard",
      name: "Standard Room",
      price: "팀원당 4841원",
      description: "스타벅스 아이스 아메리카노 1개",
      icon: "/starbucks.png",
      iconClass: "starbucksIcon",
    },
    {
      id: "elite",
      name: "Elite Room",
      price: "팀원당 2060원",
      description: "스타벅스 아이스 음료 1개 + 프렌치 크루아상",
      icon: "/starbucks.png",
      iconClass: "starbucksIcon",
      isElite: true,
    },
  ];

  // teamCount만큼 초대 입력 섹션을 렌더링
  const renderInviteSections = () => {
    return Array.from({ length: teamCount }, (_, index) => (
      <div key={index} className={styles.inviteInputSection}>
        <input className={styles.inviteInputUpdated} placeholder={`팀원 ${index + 1}의 이메일을 입력해주세요.`} />
        <div className={styles.inviteButton}>초대코드 발송</div>
      </div>
    ));
  };

  return (
    <div className={styles.createRoom}>
      <p className={styles.titleUpdated}>티밍룸 생성</p>

      <div className={styles.roomTitle}>
        <p className={styles.title_title}>티밍룸 제목</p>
        <input
          className={styles.roomTitleInputUpdated}
          value={roomTitle}
          onChange={(e) => setRoomTitle(e.target.value)}
          placeholder="프로젝트 및 팀플수업"
        />
      </div>

      <div className={styles.roomTitle}>
        <p className={styles.title_title}>팀원 수</p>
        <div className={styles.countBoxUpdated}>
          <button className={styles.countBtnUpdated} onClick={() => handleCountChange(false)}>
            -
          </button>
          <div className={styles.countDisplayUpdated}>{teamCount}</div>
          <button className={styles.countBtnUpdated} onClick={() => handleCountChange(true)}>
            +
          </button>
        </div>
      </div>

      <div className={styles.roomTypeSection}>
        <p className={styles.sectionTitleUpdated}>티밍룸 설정</p>
        <div className={styles.roomTypeGrid}>
          {roomTypes.map((room) => (
            <div
              key={room.id}
              className={`${styles.roomCard} ${room.isElite ? styles.eliteRoomCard : ""} ${
                selectedRoom === room.id ? styles.selected : ""
              }`}
              onClick={() => setSelectedRoom(room.id)}
            >
              <div className={styles.roomCardContent}>
                <div className={styles.roomCardLeft}>
                  <h3 className={styles.roomCardTitleUpdated}>{room.name}</h3>
                  <p className={styles.roomCardPriceUpdated}>{room.price}</p>
                </div>
                <div className={`${styles.roomCardIcon} ${styles[room.iconClass]}`}>
                  <Image
                    src={room.icon}
                    alt={room.name}
                    width={40}
                    height={40}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>
              </div>
              <p className={styles.roomCardDescriptionUpdated}>{room.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.noticeSection}>
        <div className={styles.noticeBox}>
          <div className={styles.noticeIcon}>💡</div>
          <div className={styles.noticeContent}>
            <p className={styles.noticeTitle}>방 입장 시, 팀원 수에 따라 해당 기프티콘을 결제해야 합니다.</p>
            <p className={styles.noticeSubtext}>만약 패널티를 받지 않는다면 이후 완료 후에 전액 환불됩니다.</p>
          </div>
        </div>
      </div>

      <div className={styles.inviteSection}>
        <p className={styles.inviteSectionTitle}>팀원 초대하기</p>
        {renderInviteSections()}
      </div>

      <div className={styles.buttonSection}>
        <button className={styles.createBtnUpdated}>티밍룸 생성하기</button>
      </div>
    </div>
  );
}
