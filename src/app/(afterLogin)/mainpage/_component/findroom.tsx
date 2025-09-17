/* eslint-disable @next/next/no-img-element */
"use client";

import { JSX, useState } from "react";
import styles from "./findroom.module.css";

interface RoomInfo {
  title: string;
  host: string;
  memberCount: number;
  currentMembers: number;
  roomType: string;
  price: string;
  description: string;
  avatar: string;
}

export default function FindRoom(): JSX.Element {
  const [inviteCode, setInviteCode] = useState<string>("");
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // 모의 방 정보 데이터 (실제로는 API에서 가져올 예정)
  const mockRoomData: RoomInfo = {
    title: "방제목",
    host: "비엔의오징어",
    memberCount: 4,
    currentMembers: 2,
    roomType: "Basic Room",
    price: "각 5170원",
    description: "스타벅스 아이스 아메리카노 1개",
    avatar: "./basicProfile.webp",
  };

  const handleSearch = (): void => {
    if (!inviteCode.trim()) return;

    setIsSearching(true);

    // 실제로는 API 호출할 예정
    setTimeout(() => {
      if (inviteCode.trim().length > 0) {
        setRoomInfo(mockRoomData);
      } else {
        setRoomInfo(null);
      }
      setIsSearching(false);
    }, 500);
  };

  const handleJoinRoom = (): void => {
    // 실제로는 API 호출해서 방 참여 처리할 예정
    console.log("방에 참여합니다");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={styles.findRoom}>
      <p className={styles.title}>티밍룸 찾기</p>

      <div className={styles.searchSection}>
        <p className={styles.sectionTitle}>티밍룸 번호</p>
        <div className={styles.searchBox}>
          <input
            className={styles.inviteInput}
            value={inviteCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteCode(e.target.value)}
            placeholder="초대받은 번호"
            onKeyPress={handleKeyPress}
          />
          <button
            className={styles.searchBtn}
            onClick={handleSearch}
            disabled={isSearching || !inviteCode.trim()}
            type="button"
          >
            {isSearching ? "검색중..." : "찾기"}
          </button>
        </div>
      </div>

      {roomInfo && (
        <div className={styles.roomInfoSection}>
          <div className={styles.roomInfoCard}>
            <div className={styles.roomHeader}>
              <div className={styles.hostInfo}>
                <div className={styles.hostAvatar}>
                  {/* 실제로는 Next.js Image 컴포넌트 사용 예정 */}
                  <img src={roomInfo.avatar} alt="host avatar" />
                </div>
                <div className={styles.hostDetails}>
                  <h3 className={styles.roomTitle}>{roomInfo.title}</h3>
                  <p className={styles.hostName}>{roomInfo.host}</p>
                </div>
              </div>
              <button className={styles.joinBtn} onClick={handleJoinRoom} type="button">
                참여하기
              </button>
            </div>

            <div className={styles.roomDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>팀원 수:</span>
                <span className={styles.detailValue}>
                  {roomInfo.currentMembers}/{roomInfo.memberCount}명
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>방 타입:</span>
                <span className={styles.detailValue}>{roomInfo.roomType}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>가격:</span>
                <span className={styles.detailValue}>{roomInfo.price}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>포함 혜택:</span>
                <span className={styles.detailValue}>{roomInfo.description}</span>
              </div>
            </div>
          </div>

          <div className={styles.noticeSection}>
            <div className={styles.noticeBox}>
              <div className={styles.noticeIcon}>💡</div>
              <div className={styles.noticeContent}>
                <p className={styles.noticeTitle}>방 입장 시, 팀원 수에 따라 해당 기프티콘을 결제해야 합니다.</p>
                <p className={styles.noticeSubtext}>만약 패널티를 받지 않는다면 티밍 완료 후에 전액 환불됩니다.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {inviteCode && !roomInfo && !isSearching && (
        <div className={styles.noResultSection}>
          <p className={styles.noResultText}>해당하는 티밍룸을 찾을 수 없습니다.</p>
          <p className={styles.noResultSubtext}>초대 번호를 다시 확인해주세요.</p>
        </div>
      )}
    </div>
  );
}
