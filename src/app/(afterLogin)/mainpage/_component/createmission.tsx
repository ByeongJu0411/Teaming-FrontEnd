"use client";
import React, { useEffect, useState } from "react";
import styles from "./createmission.module.css";
import { IoChevronBack } from "react-icons/io5";
import { useSession } from "next-auth/react";

// 멤버 타입 정의 (ActionBar에서 가져온 것과 동일)
interface Member {
  memberId: number;
  lastReadMessageId: number;
  name: string;
  avatarKey: string;
  avatarVersion: number;
  roomRole: "LEADER" | string;
}

interface ModalProps {
  setModal: () => void;
  members?: Member[]; // 방 멤버 정보 추가
  roomId: string; // 방 ID 추가
  onAssignmentCreated?: () => void; // 과제 생성 완료 콜백 추가
}

// 기본 아바타 생성 함수
const generateAvatar = (name: string): string => {
  const avatars = ["🐱", "🐶", "🐰", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵"];
  const index = name.length % avatars.length;
  return avatars[index];
};

const CreateMission = ({ setModal, members = [], roomId, onAssignmentCreated }: ModalProps) => {
  const { data: session } = useSession();

  const [missionTitle, setMissionTitle] = useState("");
  const [missionDescription, setMissionDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dueDate, setDueDate] = useState({
    year: "2025",
    month: "01",
    day: "01",
    hour: "23",
    minute: "59",
  });

  const preventOffModal = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleCreateMission = async () => {
    // 유효성 검사
    if (!missionTitle.trim()) {
      alert("과제 제목을 입력해주세요.");
      return;
    }

    if (selectedMembers.length === 0) {
      alert("과제를 할당할 팀원을 선택해주세요.");
      return;
    }

    if (!session?.accessToken || !session?.isBackendAuthenticated) {
      alert("인증이 필요합니다. 로그인 상태를 확인해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // 날짜 형식 변환 (ISO 8601 형식으로)
      const dueDateString = `${dueDate.year}-${dueDate.month}-${dueDate.day}T${dueDate.hour}:${dueDate.minute}:45.300Z`;

      const missionData = {
        title: missionTitle,
        description: missionDescription,
        assignedMemberIds: selectedMembers.map((id) => parseInt(id)), // string을 number로 변환
        due: dueDateString,
      };

      console.log("과제 생성 요청:", missionData);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/rooms/${roomId}/assignment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify(missionData),
        }
      );

      console.log("API 응답 상태:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (response.status === 403) {
          throw new Error("과제 생성 권한이 없습니다.");
        } else if (response.status === 404) {
          throw new Error("존재하지 않는 방입니다.");
        } else {
          const errorText = await response.text();
          console.error("API 오류 응답:", errorText);
          throw new Error(`서버 오류가 발생했습니다. (${response.status}): ${errorText}`);
        }
      }

      // 응답에 내용이 있는지 확인 후 JSON 파싱
      let result = null;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const responseText = await response.text();
        if (responseText) {
          try {
            result = JSON.parse(responseText);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (parseError) {
            console.warn("JSON 파싱 실패, 하지만 요청은 성공:", responseText);
          }
        }
      }

      console.log("과제 생성 성공:", result || "응답 본문 없음");

      alert("과제가 성공적으로 생성되었습니다!");

      // 과제 생성 완료 후 AssignmentRoom 새로고침을 위한 콜백 호출
      if (onAssignmentCreated) {
        onAssignmentCreated();
      }

      setModal(); // 모달 닫기
    } catch (error) {
      console.error("과제 생성 실패:", error);
      alert(`과제 생성에 실패했습니다:\n${error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div onClick={setModal} className={styles.modalBackground}>
      <div onClick={preventOffModal} className={styles.modal}>
        {/* 헤더 */}
        <div className={styles.modalHeader}>
          <button onClick={setModal} className={styles.backButton}>
            <IoChevronBack size={24} />
          </button>
          <h2 className={styles.modalTitle}>과제 생성하기</h2>
        </div>

        {/* 컨텐츠 */}
        <div className={styles.modalContent}>
          {/* 과제 제목 */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>과제 제목</label>
            <input
              type="text"
              placeholder="과제 제목을 입력하세요"
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              className={styles.titleInput}
            />
          </div>

          {/* 과제 설명 */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>과제 설명</label>
            <textarea
              placeholder="과제에 대한 설명을 입력하세요"
              value={missionDescription}
              onChange={(e) => setMissionDescription(e.target.value)}
              className={styles.descriptionTextarea}
              rows={4}
            />
          </div>

          {/* 팀원 역할부여 */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>팀원 역할부여 ({members.length}명)</label>
            <div className={styles.memberList}>
              {members.length > 0 ? (
                members.map((member) => (
                  <div
                    key={member.memberId}
                    className={styles.memberItem}
                    onClick={() => handleMemberToggle(member.memberId.toString())}
                  >
                    <div className={styles.memberInfo}>
                      <div className={styles.memberAvatar}>
                        {member.avatarKey ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/files/${member.avatarKey}?v=${member.avatarVersion}`}
                            alt={member.name}
                            className={styles.avatarImage}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              if (target.nextSibling) {
                                (target.nextSibling as HTMLElement).style.display = "block";
                              }
                            }}
                          />
                        ) : null}
                        <span className={styles.emojiAvatar} style={{ display: member.avatarKey ? "none" : "block" }}>
                          {generateAvatar(member.name)}
                        </span>
                      </div>
                      <div className={styles.memberNameContainer}>
                        <span className={styles.memberName}>
                          {member.name}
                          {member.roomRole === "LEADER" && <span className={styles.leaderBadge}>👑</span>}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`${styles.checkbox} ${
                        selectedMembers.includes(member.memberId.toString()) ? styles.checked : ""
                      }`}
                    >
                      {selectedMembers.includes(member.memberId.toString()) && (
                        <span className={styles.checkmark}>✓</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noMembers}>멤버 정보를 불러오는 중입니다...</div>
              )}
            </div>
          </div>

          {/* 제한시간 설정 */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>제한시간 설정</label>
            <div className={styles.dateTimeContainer}>
              <div className={styles.dateInputs}>
                <select
                  value={dueDate.year}
                  onChange={(e) => setDueDate((prev) => ({ ...prev, year: e.target.value }))}
                  className={styles.dateSelect}
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
                <span className={styles.dateLabel}>년</span>

                <select
                  value={dueDate.month}
                  onChange={(e) => setDueDate((prev) => ({ ...prev, month: e.target.value }))}
                  className={styles.dateSelect}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span className={styles.dateLabel}>월</span>

                <select
                  value={dueDate.day}
                  onChange={(e) => setDueDate((prev) => ({ ...prev, day: e.target.value }))}
                  className={styles.dateSelect}
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span className={styles.dateLabel}>일</span>
              </div>

              <div className={styles.timeInputs}>
                <span className={styles.timeLabel}>시간</span>
                <select
                  value={dueDate.hour}
                  onChange={(e) => setDueDate((prev) => ({ ...prev, hour: e.target.value }))}
                  className={styles.timeSelect}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, "0")}>
                      {String(i).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span className={styles.timeSeparator}>:</span>
                <select
                  value={dueDate.minute}
                  onChange={(e) => setDueDate((prev) => ({ ...prev, minute: e.target.value }))}
                  className={styles.timeSelect}
                >
                  {["00", "30"].map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 과제 생성 버튼 */}
        <div className={styles.modalFooter}>
          <button
            onClick={handleCreateMission}
            className={styles.createButton}
            disabled={!missionTitle.trim() || selectedMembers.length === 0 || isLoading}
          >
            {isLoading ? <span>생성 중...</span> : "과제 생성"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMission;
