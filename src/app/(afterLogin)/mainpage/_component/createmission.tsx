"use client";
import React, { useEffect, useState } from "react";
import styles from "./createmission.module.css";
import { IoChevronBack } from "react-icons/io5";

interface ModalProps {
  setModal: () => void;
}

// 테스트용 팀원 데이터
const testTeamMembers = [
  {
    id: "1",
    name: "권민석",
    avatar: "🐱",
  },
  {
    id: "2",
    name: "정치학 존잘남",
    avatar: "😎",
  },
  {
    id: "3",
    name: "팀플하기싫다",
    avatar: "😩",
  },
];

const CreateMission = ({ setModal }: ModalProps) => {
  const [missionTitle, setMissionTitle] = useState("");
  const [missionDescription, setMissionDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState({
    year: "2025",
    month: "09",
    day: "07",
    hour: "07",
    minute: "00",
  });

  const preventOffModal = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleCreateMission = () => {
    const missionData = {
      title: missionTitle,
      description: missionDescription,
      assignedMembers: selectedMembers,
      dueDate: dueDate,
    };
    console.log("과제 생성:", missionData);
    // 여기에 과제 생성 API 호출 로직 추가
    setModal();
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
              placeholder="자료조사 2장 과제부여"
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              className={styles.titleInput}
            />
          </div>

          {/* 과제 설명 */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>과제 설명</label>
            <textarea
              placeholder="자료조사를 하셨다면 한 장정도 과제를 부여합니다.&#10;과제시간에 맞춰서 과제 제출해주시면 감사하겠습니다."
              value={missionDescription}
              onChange={(e) => setMissionDescription(e.target.value)}
              className={styles.descriptionTextarea}
              rows={4}
            />
          </div>

          {/* 팀원 역할부여 */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>팀원 역할부여</label>
            <div className={styles.memberList}>
              {testTeamMembers.map((member) => (
                <div key={member.id} className={styles.memberItem} onClick={() => handleMemberToggle(member.id)}>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberAvatar}>{member.avatar}</div>
                    <span className={styles.memberName}>{member.name}</span>
                  </div>
                  <div className={`${styles.checkbox} ${selectedMembers.includes(member.id) ? styles.checked : ""}`}>
                    {selectedMembers.includes(member.id) && <span className={styles.checkmark}>✓</span>}
                  </div>
                </div>
              ))}
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
            disabled={!missionTitle.trim() || selectedMembers.length === 0}
          >
            과제 생성
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMission;
