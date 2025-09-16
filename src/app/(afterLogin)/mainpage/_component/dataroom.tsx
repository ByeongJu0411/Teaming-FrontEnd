"use client";
import React, { useEffect, useRef } from "react";
import styles from "./dataroom.module.css";
import { IoChevronBack } from "react-icons/io5";
import { FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileAlt } from "react-icons/fa";

interface ModalProps {
  setModal: () => void;
}

// 테스트용 자료실 데이터
const testDataRoomItems = [
  {
    id: "1",
    userName: "권민석",
    userAvatar: "🐱",
    files: [
      { id: "1-1", name: "발표자료.pptx", type: "pptx" },
      { id: "1-2", name: "최종본.pptx", type: "pptx" },
    ],
  },
  {
    id: "2",
    userName: "팀장 최순조",
    userAvatar: "👨‍💼",
    files: [{ id: "2-1", name: "참고자료.pdf", type: "pdf" }],
  },
  {
    id: "3",
    userName: "정치학 존잘남",
    userAvatar: "😎",
    files: [{ id: "3-1", name: "한국사 레포트.pdf", type: "pdf" }],
  },
  {
    id: "4",
    userName: "팀플하기싫다",
    userAvatar: "😩",
    files: [],
  },
];

const DataRoom = ({ setModal }: ModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preventOffModal = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      console.log("업로드된 파일:", files);
      // 여기에 파일 업로드 로직 추가
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FaFilePdf className={styles.fileIcon} style={{ color: "#e53e3e" }} />;
      case "pptx":
        return <FaFilePowerpoint className={styles.fileIcon} style={{ color: "#dd6b20" }} />;
      case "docx":
        return <FaFileWord className={styles.fileIcon} style={{ color: "#3182ce" }} />;
      default:
        return <FaFileAlt className={styles.fileIcon} style={{ color: "#666" }} />;
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
          <h2 className={styles.modalTitle}>자료실</h2>
        </div>

        {/* 파일 입력 (숨김) */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {/* 자료실 내용 */}
        <div className={styles.modalContent}>
          {testDataRoomItems.map((userItem) => (
            <div key={userItem.id} className={styles.userSection}>
              {/* 유저 정보 */}
              <div className={styles.userHeader}>
                <div className={styles.userAvatar}>{userItem.userAvatar}</div>
                <span className={styles.userName}>{userItem.userName}</span>
              </div>

              {/* 파일 리스트 */}
              <div className={styles.fileList}>
                {userItem.files.length > 0 ? (
                  userItem.files.map((file) => (
                    <div key={file.id} className={styles.fileItem}>
                      {getFileIcon(file.type)}
                      <span className={styles.fileName}>{file.name}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.noFiles}>업로드된 파일이 없습니다.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataRoom;
