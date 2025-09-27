/* eslint-disable @next/next/no-img-element */
"use client";

import { JSX, useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./findroom.module.css";

// API 응답 타입 정의 (스웨거 스펙 기반)
interface RoomSearchResponse {
  title: string;
  imageKey: string;
  imageVersion: number;
  type: {
    typeName: string;
    price: number;
    description: string;
  };
  currentMemberCount: number;
  maxMemberCount: number;
}

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

// NextAuth 세션 타입 확장
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    isBackendAuthenticated?: boolean;
    backendError?: {
      hasError: boolean;
      status: number;
      message: string;
      isNetworkError: boolean;
    };
  }
}

interface FindRoomProps {
  onRoomJoined?: () => void; // 방 참여 후 호출될 콜백
}

export default function FindRoom({ onRoomJoined }: FindRoomProps): JSX.Element {
  const { data: session } = useSession();
  const [inviteCode, setInviteCode] = useState<string>("");
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>("");
  const [hasSearched, setHasSearched] = useState<boolean>(false); // 검색 실행 여부 추적

  // API 응답을 UI 표시용 데이터로 변환
  const convertApiResponseToRoomInfo = (apiResponse: RoomSearchResponse): RoomInfo => {
    return {
      title: apiResponse.title,
      host: "방장", // API에서 호스트 정보가 없으므로 기본값
      memberCount: apiResponse.maxMemberCount,
      currentMembers: apiResponse.currentMemberCount,
      roomType: apiResponse.type.typeName,
      price: `${apiResponse.type.price.toLocaleString()}원`,
      description: apiResponse.type.description,
      avatar: "./basicProfile.webp", // 기본 아바타 (추후 imageKey 활용 가능)
    };
  };

  const handleSearch = async (): Promise<void> => {
    if (!inviteCode.trim()) {
      setSearchError("초대 코드를 입력해주세요.");
      return;
    }

    // 세션 확인
    if (!session?.accessToken || !session?.isBackendAuthenticated) {
      setSearchError("로그인이 필요합니다.");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setRoomInfo(null);
    setHasSearched(true); // 검색 실행 표시

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080";
      const token = session.accessToken;

      console.log("Room search API 호출:", `${backendUrl}/rooms/search?inviteCode=${inviteCode}`);

      const response = await fetch(`${backendUrl}/rooms/search?inviteCode=${encodeURIComponent(inviteCode)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        // 모든 에러 상황에서 에러를 던지지 않고 조용히 종료
        console.log(`검색 실패 (${response.status})`);
        setIsSearching(false);
        return;
      }

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let apiResponse: RoomSearchResponse;
      try {
        apiResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("서버 응답을 파싱할 수 없습니다.");
      }

      console.log("Parsed response:", apiResponse);

      // API 응답을 UI용 데이터로 변환
      const convertedRoomInfo = convertApiResponseToRoomInfo(apiResponse);
      setRoomInfo(convertedRoomInfo);
    } catch (error) {
      // 모든 에러를 조용히 처리 (에러 메시지 표시 안 함)
      console.error("방 검색 실패:", error);
      setRoomInfo(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoinRoom = async (): Promise<void> => {
    if (!inviteCode.trim() || !session?.accessToken) {
      alert("로그인이 필요합니다.");
      return;
    }

    setIsJoining(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080";
      const token = session.accessToken;

      console.log("Room join API 호출:", `${backendUrl}/rooms/invite`);
      console.log("Request body:", { inviteCode });

      // 스웨거 스펙에 맞는 방 참여 API 호출
      const response = await fetch(`${backendUrl}/rooms/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inviteCode: inviteCode,
        }),
      });

      console.log("Join response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Join error response:", errorText);

        if (response.status === 401) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (response.status === 403) {
          throw new Error("방 참여 권한이 없습니다.");
        } else if (response.status === 404) {
          throw new Error("방을 찾을 수 없습니다.");
        } else if (response.status === 409) {
          throw new Error("이미 참여한 방입니다.");
        } else if (response.status === 400) {
          throw new Error("잘못된 초대 코드입니다.");
        } else {
          throw new Error(`방 참여에 실패했습니다. (${response.status}): ${errorText}`);
        }
      }

      // 스웨거 응답 스펙에 따른 처리
      const responseText = await response.text();
      console.log("Join success response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
        console.log("Parsed join result:", result);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (parseError) {
        console.log("Response is not JSON, treating as success");
      }

      alert("방에 성공적으로 참여했습니다!");

      // 방 참여 후 ActionBar 새로고침을 위한 콜백 호출
      if (onRoomJoined) {
        onRoomJoined();
      }

      // 입력 필드 초기화
      setInviteCode("");
      setRoomInfo(null);
      setHasSearched(false);

      // 성공 후 페이지 새로고침으로 ActionBar 확실히 업데이트
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("방 참여 실패:", error);
      alert(error instanceof Error ? error.message : "방 참여에 실패했습니다.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 입력 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInviteCode(e.target.value);
    if (searchError) setSearchError("");
    setHasSearched(false); // 입력 변경 시 검색 상태 리셋
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
            onChange={handleInputChange}
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

        {/* 검색 에러 메시지 - 제거됨 */}
      </div>

      {roomInfo && (
        <div className={styles.roomInfoSection}>
          <div className={styles.roomInfoCard}>
            <div className={styles.roomHeader}>
              <div className={styles.hostInfo}>
                <div className={styles.hostAvatar}>
                  <img src={roomInfo.avatar} alt="host avatar" />
                </div>
                <div className={styles.hostDetails}>
                  <h3 className={styles.roomTitle}>{roomInfo.title}</h3>
                  <p className={styles.hostName}>{roomInfo.host}</p>
                </div>
              </div>
              <button className={styles.joinBtn} onClick={handleJoinRoom} disabled={isJoining} type="button">
                {isJoining ? "참여중..." : "참여하기"}
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

      {/* 검색을 실행했고, 결과가 없을 때만 표시 */}
      {hasSearched && !roomInfo && !isSearching && !searchError && (
        <div className={styles.noResultSection}>
          <p className={styles.noResultText}>해당하는 티밍룸을 찾을 수 없습니다.</p>
          <p className={styles.noResultSubtext}>초대 번호를 다시 확인해주세요.</p>
        </div>
      )}
    </div>
  );
}
